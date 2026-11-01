import { getLoggerFactory } from "@hacado/logger";
import type { Email } from "@hacado/types/apps";
import type { SmsVerificationStatusPayload } from "@hacado/types/events";
import type { JobRequest } from "@hacado/types/jobs";
import type {
  SmsRegistrationInput,
  SmsRegistrationSaveResponse,
} from "@hacado/types/text-message/registration";
import { normalizeToE164 } from "@hacado/utils/phone";
import { getAppsExternalUrl } from "@hacado/utils/website";
import { Telnyx } from "telnyx";
import { getHelpSms } from "./messages";
import {
  SmsRegistrationRecord,
  SmsRegistrationStore,
  toSmsRegistrationView,
} from "./registration-store";
import {
  getTelnyxConfiguration,
  isTelnyxVerificationDryRun,
} from "./telnyx/config";
import {
  ensureOrganizationMessagingProfile,
  findUnassignedTollFreeNumber,
  releaseDedicatedNumberForOrganization,
} from "./telnyx/org-messaging-profile";
import {
  buildTollFreeVerificationBody,
  requiresSmsVerification,
} from "./verification";
import { emitSmsVerificationStatusChange } from "./verification-events";

const SUPPORT_EMAIL = "support@hacado.com";
const REQUEUE_DELAY_MS = 60_000;
const MAX_PROVISION_ATTEMPTS = 30;
const SMS_VERIFICATION_DEDUPE_TTL_MS = 2 * 60 * 60 * 1000;
const READINESS_POLL_MS = 1_500;
const READINESS_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const paragraph = (value: string) => `<p>${escapeHtml(value)}</p>`;

export const smsVerificationJobDeduplication = (organizationId: string) => ({
  id: `sms-verification:${organizationId}`,
  ttl: SMS_VERIFICATION_DEDUPE_TTL_MS,
});

export const scheduleSmsVerificationJob = async (input: {
  organizationId: string;
  executeAt?: Date | "now";
  scheduleJob: (job: JobRequest) => Promise<unknown>;
}) => {
  const logger = getLoggerFactory("SmsRegistration")(
    "scheduleSmsVerificationJob",
  );

  const executeAt = input.executeAt ?? "now";
  const deduplication = smsVerificationJobDeduplication(input.organizationId);

  logger.debug(
    {
      organizationId: input.organizationId,
      executeAt,
      deduplication,
    },
    "Scheduling SMS verification core job",
  );

  return input.scheduleJob({
    type: "core",
    requestType: "sms-verification",
    executeAt,
    deduplication,
  });
};

const isNotProvisionedError = (details: {
  message?: string;
  raw?: unknown;
}) => {
  const haystack = [
    details.message,
    typeof details.raw === "string" ? details.raw : "",
    details.raw && typeof details.raw === "object"
      ? JSON.stringify(details.raw)
      : "",
  ]
    .join(" ")
    .toLowerCase();

  return (
    haystack.includes("not provisioned") ||
    haystack.includes("not yet provisioned") ||
    haystack.includes("number is not active") ||
    haystack.includes("phone number is not ready") ||
    (haystack.includes("provision") && haystack.includes("not"))
  );
};

const telnyxErrorDetails = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return {
      message:
        typeof error === "string" && error
          ? error
          : "Telnyx rejected the verification",
      raw: error,
    };
  }

  const record = error as Record<string, unknown>;
  const errors = Array.isArray(record.errors) ? record.errors : undefined;
  const nested =
    record.error && typeof record.error === "object"
      ? (record.error as Record<string, unknown>)
      : undefined;

  const messageCandidates = [
    typeof record.message === "string" ? record.message : undefined,
    typeof nested?.message === "string" ? nested.message : undefined,
    typeof record.detail === "string" ? record.detail : undefined,
    typeof record.title === "string" ? record.title : undefined,
    error instanceof Error ? error.message : undefined,
  ].filter(Boolean);

  return {
    message: messageCandidates[0] || "Telnyx rejected the verification",
    name: error instanceof Error ? error.name : undefined,
    status:
      typeof record.status === "number"
        ? record.status
        : typeof record.statusCode === "number"
          ? record.statusCode
          : undefined,
    code:
      typeof record.code === "string" || typeof record.code === "number"
        ? record.code
        : undefined,
    errors,
    raw: error,
  };
};

/** Prefer updatable Telnyx statuses; skip Verified. */
const verificationRequestRank = (status: string) => {
  switch (status) {
    case "Waiting For Customer":
      return 0;
    case "In Progress":
      return 1;
    case "Waiting For Telnyx":
      return 2;
    case "Waiting For Vendor":
      return 3;
    case "Rejected":
      return 4;
    default:
      return 5;
  }
};

async function findExistingTollFreeVerificationRequestId(input: {
  client: Telnyx;
  phoneNumber: string;
  organizationId: string;
}): Promise<string | undefined> {
  const logger = getLoggerFactory("SmsRegistration")(
    "findExistingTollFreeVerificationRequestId",
  );

  logger.debug(
    {
      organizationId: input.organizationId,
      phoneNumber: input.phoneNumber,
    },
    "Listing Telnyx verification requests for phone number",
  );

  try {
    const matches: Array<{
      id: string;
      status: string;
      updatedAt?: string;
    }> = [];

    let listed = 0;
    let skippedVerified = 0;

    for await (const row of input.client.messagingTollfree.verification.requests.list(
      {
        phone_number: input.phoneNumber,
        page: 1,
        page_size: 50,
      },
    )) {
      listed += 1;
      if (!row.id || row.verificationStatus === "Verified") {
        if (row.verificationStatus === "Verified") skippedVerified += 1;
        continue;
      }

      matches.push({
        id: row.id,
        status: row.verificationStatus,
        updatedAt: row.updatedAt,
      });
    }

    logger.debug(
      {
        organizationId: input.organizationId,
        phoneNumber: input.phoneNumber,
        listed,
        skippedVerified,
        candidates: matches.map((match) => ({
          id: match.id,
          status: match.status,
        })),
      },
      "Telnyx verification request list filtered",
    );

    matches.sort((a, b) => {
      const byStatus =
        verificationRequestRank(a.status) - verificationRequestRank(b.status);

      if (byStatus !== 0) return byStatus;

      return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
    });

    const found = matches[0]?.id;
    logger.info(
      {
        organizationId: input.organizationId,
        phoneNumber: input.phoneNumber,
        matchCount: matches.length,
        requestId: found ?? null,
        status: matches[0]?.status ?? null,
      },
      "Looked up existing Telnyx verification requests for number",
    );

    return found;
  } catch (error) {
    logger.warn(
      {
        organizationId: input.organizationId,
        phoneNumber: input.phoneNumber,
        ...telnyxErrorDetails(error),
      },
      "Could not list Telnyx verification requests for number",
    );

    return undefined;
  }
}

const missingVerificationFields = (input: {
  entityType?: string;
  legalName?: string;
  website?: string;
  privacyPolicyUrl?: string;
  termsAndConditionUrl?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  businessRegistrationNumber?: string;
}) => {
  const missing: string[] = [];
  if (!input.entityType) missing.push("entityType");
  if (!input.legalName?.trim()) missing.push("legalName");
  if (!input.website?.trim()) missing.push("website");
  if (!input.privacyPolicyUrl?.trim()) missing.push("privacyPolicyUrl");
  if (!input.termsAndConditionUrl?.trim()) missing.push("termsAndConditionUrl");
  if (!input.streetAddress?.trim()) missing.push("address.streetAddress");
  if (!input.city?.trim()) missing.push("address.addressLocality");
  if (!input.state?.trim()) missing.push("address.addressRegion");
  if (!input.postalCode?.trim()) missing.push("address.postalCode");
  if (!input.contactFirstName?.trim()) missing.push("contactFirstName");
  if (!input.contactLastName?.trim()) missing.push("contactLastName");
  if (!input.contactEmail?.trim()) missing.push("contactEmail");
  if (!input.contactPhone) missing.push("contactPhone");
  if (
    input.entityType &&
    input.entityType !== "SOLE_PROPRIETOR" &&
    !input.businessRegistrationNumber?.trim()
  ) {
    missing.push("businessRegistrationNumber");
  }

  return missing;
};

/** Fast HTTP path: validate, persist, enqueue worker. Does not call Telnyx. */
export async function saveSmsRegistration(input: {
  organizationId: string;
  country: string;
  values: SmsRegistrationInput;
  sendEmail: (email: Email) => Promise<void>;
  scheduleJob: (job: JobRequest) => Promise<unknown>;
  store?: SmsRegistrationStore;
  optInImageUrl?: string;
  privacyPolicyUrl?: string;
  termsAndConditionUrl?: string;
  notifyEmail?: string;
  emit?: (type: string, payload: SmsVerificationStatusPayload) => Promise<void>;
}): Promise<SmsRegistrationSaveResponse | { error: string }> {
  const logger = getLoggerFactory("SmsRegistration")("save");
  const store = input.store ?? new SmsRegistrationStore();
  const existing = await store.get(input.organizationId);
  const values = input.values;
  const contactPhone = values.contactPhone?.trim()
    ? (normalizeToE164(values.contactPhone) ?? undefined)
    : undefined;

  logger.info(
    {
      organizationId: input.organizationId,
      country: input.country,
      enabled: values.enabled,
      resubmit: values.resubmit,
      entityType: values.entityType,
      existingStatus: existing?.status ?? null,
      existingEnabled: existing?.enabled ?? null,
      existingBlockedReason: existing?.blockedReason ?? null,
      hasOptInImage: Boolean(input.optInImageUrl?.trim()),
      hasPrivacyPolicyUrl: Boolean(input.privacyPolicyUrl?.trim()),
      hasTermsAndConditionUrl: Boolean(input.termsAndConditionUrl?.trim()),
      requiresVerification: requiresSmsVerification(input.country),
      dryRun: isTelnyxVerificationDryRun(),
    },
    "SMS registration save started",
  );

  if (values.contactPhone?.trim() && !contactPhone) {
    logger.warn(
      {
        organizationId: input.organizationId,
        contactPhoneRaw: values.contactPhone,
      },
      "Contact phone could not be normalized to E.164",
    );

    return { error: "Contact phone is not a valid number" };
  }

  const base: Omit<SmsRegistrationRecord, "updatedAt"> = {
    organizationId: input.organizationId,
    enabled: values.enabled,
    status: existing?.status ?? "draft",
    entityType: values.entityType,
    legalName: values.legalName,
    doingBusinessAs: values.doingBusinessAs,
    businessRegistrationNumber: values.businessRegistrationNumber,
    website: values.website,
    address: values.address,
    contactFirstName: values.contactFirstName,
    contactLastName: values.contactLastName,
    contactEmail: values.contactEmail,
    contactPhone: contactPhone ?? undefined,
    optInImageUrl: input.optInImageUrl?.trim() || existing?.optInImageUrl,
    privacyPolicyUrl:
      input.privacyPolicyUrl?.trim() || existing?.privacyPolicyUrl,
    termsAndConditionUrl:
      input.termsAndConditionUrl?.trim() || existing?.termsAndConditionUrl,
    notifyEmail: input.notifyEmail?.trim() || existing?.notifyEmail,
    provisionAttempts: existing?.provisionAttempts,
    telnyxMessagingProfileId: existing?.telnyxMessagingProfileId,
    telnyxRequestId: existing?.telnyxRequestId,
    telnyxResourceId: existing?.telnyxResourceId,
    rejectionReason: existing?.rejectionReason,
    blockedReason: existing?.blockedReason,
    submittedAt: existing?.submittedAt,
    verifiedAt: existing?.verifiedAt,
  };

  const shouldSubmit =
    requiresSmsVerification(input.country) &&
    values.enabled &&
    values.resubmit !== false;

  if (!shouldSubmit) {
    const releasing = Boolean(existing?.enabled && !values.enabled);
    logger.info(
      {
        organizationId: input.organizationId,
        shouldSubmit,
        releasing,
      },
      "Skipping Telnyx verification submit",
    );

    if (releasing) {
      logger.info(
        { organizationId: input.organizationId },
        "Releasing dedicated number because custom messaging was turned off",
      );

      const apiKey = getTelnyxConfiguration().apiKey;
      await releaseDedicatedNumberForOrganization({
        organizationId: input.organizationId,
        store,
        ...(apiKey ? { client: new Telnyx({ apiKey }) } : {}),
      });
    }

    const saved = await store.save({
      ...base,
      enabled: values.enabled,
      // Keep telnyxMessagingProfileId so the org profile can be reused.
      ...(releasing
        ? {
            status: "draft" as const,
            telnyxRequestId: undefined,
            telnyxResourceId: undefined,
            rejectionReason: undefined,
            blockedReason: undefined,
            optInImageUrl: undefined,
            privacyPolicyUrl: undefined,
            termsAndConditionUrl: undefined,
            notifyEmail: undefined,
            provisionAttempts: undefined,
            submittedAt: undefined,
            verifiedAt: undefined,
          }
        : {}),
    });

    return { outcome: "saved", registration: toSmsRegistrationView(saved) };
  }

  const entityType = values.entityType;
  const missing = missingVerificationFields({
    entityType,
    legalName: values.legalName,
    website: values.website,
    privacyPolicyUrl: input.privacyPolicyUrl,
    termsAndConditionUrl: input.termsAndConditionUrl,
    streetAddress: values.address?.streetAddress,
    city: values.address?.addressLocality,
    state: values.address?.addressRegion,
    postalCode: values.address?.postalCode,
    contactFirstName: values.contactFirstName,
    contactLastName: values.contactLastName,
    contactEmail: values.contactEmail,
    contactPhone,
    businessRegistrationNumber: values.businessRegistrationNumber,
  });

  if (missing.length > 0) {
    logger.warn(
      { organizationId: input.organizationId, missing },
      "Verification details are incomplete",
    );

    await store.save(base);
    return { error: "Verification details are incomplete" };
  }

  if (isTelnyxVerificationDryRun()) {
    logger.info(
      { organizationId: input.organizationId },
      "Telnyx verification dry-run: marking registration pending without API call",
    );

    const saved = await store.save({
      ...base,
      status: "pending",
      rejectionReason: undefined,
      blockedReason: undefined,
      provisionAttempts: undefined,
      submittedAt: new Date(),
      verifiedAt: undefined,
    });

    await notifyVerificationStatus(store, existing, saved, input.emit);

    return { outcome: "submitted", registration: toSmsRegistrationView(saved) };
  }

  const optInImageUrl = input.optInImageUrl?.trim() ?? "";

  if (!optInImageUrl) {
    logger.warn(
      {
        organizationId: input.organizationId,
        reason: "missing_opt_in_image",
      },
      "Cannot enqueue verification yet; marking number_preparing",
    );

    const saved = await store.save({
      ...base,
      blockedReason: "number_preparing",
      provisionAttempts: 0,
    });

    if (existing?.blockedReason !== "number_preparing") {
      await notify(input.sendEmail, logger, {
        to: SUPPORT_EMAIL,
        subject: `SMS number needed for ${saved.legalName || input.organizationId}`,
        body: paragraph(
          `${saved.legalName || "A business"} (${input.organizationId}) turned on custom messaging, and the opt-in screenshot is not ready.`,
        ),
      });
    }

    return {
      outcome: "preparing",
      registration: toSmsRegistrationView(saved),
    };
  }

  const saved = await store.save({
    ...base,
    status: "draft",
    blockedReason: "number_preparing",
    rejectionReason: undefined,
    provisionAttempts: 0,
    optInImageUrl,
    privacyPolicyUrl: input.privacyPolicyUrl?.trim(),
    termsAndConditionUrl: input.termsAndConditionUrl?.trim(),
    notifyEmail: input.notifyEmail?.trim(),
  });

  await scheduleSmsVerificationJob({
    organizationId: input.organizationId,
    scheduleJob: input.scheduleJob,
  });

  logger.info(
    { organizationId: input.organizationId },
    "SMS verification job enqueued",
  );

  return {
    outcome: "preparing",
    registration: toSmsRegistrationView(saved),
  };
}

/** Worker path: purchase/reuse number, wait for provision, submit Telnyx verification. */
export async function processSmsVerificationJob(input: {
  organizationId: string;
  country: string;
  sendEmail: (email: Email) => Promise<void>;
  scheduleJob: (job: JobRequest) => Promise<unknown>;
  store?: SmsRegistrationStore;
  emit?: (type: string, payload: SmsVerificationStatusPayload) => Promise<void>;
}): Promise<void> {
  const logger = getLoggerFactory("SmsRegistration")("processJob");
  const store = input.store ?? new SmsRegistrationStore();

  logger.info(
    {
      organizationId: input.organizationId,
      country: input.country,
    },
    "SMS verification job started",
  );

  const record = await store.get(input.organizationId);

  logger.debug(
    {
      organizationId: input.organizationId,
      hasRecord: Boolean(record),
      enabled: record?.enabled ?? null,
      status: record?.status ?? null,
      blockedReason: record?.blockedReason ?? null,
      provisionAttempts: record?.provisionAttempts ?? null,
      telnyxMessagingProfileId: record?.telnyxMessagingProfileId ?? null,
      telnyxRequestId: record?.telnyxRequestId ?? null,
      telnyxResourceId: record?.telnyxResourceId ?? null,
      hasOptInImage: Boolean(record?.optInImageUrl?.trim()),
      hasPrivacyPolicyUrl: Boolean(record?.privacyPolicyUrl?.trim()),
      hasTermsAndConditionUrl: Boolean(record?.termsAndConditionUrl?.trim()),
    },
    "Loaded SMS registration for verification job",
  );

  if (!record?.enabled) {
    logger.info(
      { organizationId: input.organizationId },
      "Skipping SMS verification job; custom messaging is off",
    );

    return;
  }

  if (record.status === "pending" || record.status === "verified") {
    logger.info(
      {
        organizationId: input.organizationId,
        status: record.status,
      },
      "Skipping SMS verification job; already submitted",
    );

    return;
  }

  if (!requiresSmsVerification(input.country)) {
    logger.info(
      { organizationId: input.organizationId, country: input.country },
      "Skipping SMS verification job; country does not require verification",
    );

    return;
  }

  const optInImageUrl = record.optInImageUrl?.trim() ?? "";
  const privacyPolicyUrl = record.privacyPolicyUrl?.trim() ?? "";
  const termsAndConditionUrl = record.termsAndConditionUrl?.trim() ?? "";
  const missing = missingVerificationFields({
    entityType: record.entityType,
    legalName: record.legalName,
    website: record.website,
    privacyPolicyUrl,
    termsAndConditionUrl,
    streetAddress: record.address?.streetAddress,
    city: record.address?.addressLocality,
    state: record.address?.addressRegion,
    postalCode: record.address?.postalCode,
    contactFirstName: record.contactFirstName,
    contactLastName: record.contactLastName,
    contactEmail: record.contactEmail,
    contactPhone: record.contactPhone,
    businessRegistrationNumber: record.businessRegistrationNumber,
  });

  if (missing.length > 0 || !optInImageUrl) {
    logger.warn(
      {
        organizationId: input.organizationId,
        missing: !optInImageUrl ? [...missing, "optInImageUrl"] : missing,
      },
      "SMS verification job missing required details",
    );

    await store.save({
      ...record,
      blockedReason: undefined,
    });

    return;
  }

  const apiKey = getTelnyxConfiguration().apiKey;
  if (!apiKey) {
    logger.error(
      { organizationId: input.organizationId },
      "Telnyx API key is not configured",
    );

    await store.save({
      ...record,
      blockedReason: undefined,
    });

    return;
  }

  const client = new Telnyx({ apiKey });
  const tradeName =
    record.doingBusinessAs?.trim() ||
    record.legalName?.trim() ||
    input.organizationId;

  logger.debug(
    {
      organizationId: input.organizationId,
      tradeName,
      hasStoredMessagingProfileId: Boolean(
        record.telnyxMessagingProfileId?.trim(),
      ),
    },
    "Ensuring org messaging profile before number acquire",
  );

  let workingRecord = record;
  let messagingProfileId: string;

  try {
    const ensured = await ensureOrganizationMessagingProfile({
      client,
      store,
      record: workingRecord,
      businessName: tradeName,
    });

    messagingProfileId = ensured.profileId;
    workingRecord = ensured.record;
  } catch (error) {
    logger.error(
      {
        organizationId: input.organizationId,
        ...telnyxErrorDetails(error),
      },
      "Could not ensure organization messaging profile",
    );

    await requeueOrGiveUp({
      store,
      record: workingRecord,
      sendEmail: input.sendEmail,
      scheduleJob: input.scheduleJob,
      reason: "messaging_profile_create_failed",
    });

    return;
  }

  const assigned = await store.getAssignedProfileNumber(input.organizationId);
  let phoneNumber = assigned?.phoneNumber;

  logger.debug(
    {
      organizationId: input.organizationId,
      messagingProfileId,
      assignedPhoneNumber: phoneNumber ?? null,
      assignedMessagingProfileId: assigned?.messagingProfileId ?? null,
    },
    phoneNumber
      ? "Organization already has an assigned number"
      : "No assigned number; acquiring dedicated number",
  );

  if (!phoneNumber) {
    const dedicated = await acquireDedicatedNumber({
      store,
      organizationId: input.organizationId,
      messagingProfileId,
      client,
    });

    if (!dedicated) {
      await requeueOrGiveUp({
        store,
        record: workingRecord,
        sendEmail: input.sendEmail,
        scheduleJob: input.scheduleJob,
        reason: "could_not_acquire_number",
      });

      return;
    }

    phoneNumber = dedicated.phoneNumber;
    logger.info(
      {
        organizationId: input.organizationId,
        phoneNumber,
        source: dedicated.source,
        ready: dedicated.ready,
        messagingProfileId,
      },
      "Dedicated number acquire finished",
    );

    if (!dedicated.ready) {
      await requeueOrGiveUp({
        store,
        record: workingRecord,
        sendEmail: input.sendEmail,
        scheduleJob: input.scheduleJob,
        reason: "number_not_ready",
        phoneNumber,
      });

      return;
    }
  } else {
    const ready = await ensureMessagingProfileReady({
      client,
      phoneNumber,
      messagingProfileId,
      organizationId: input.organizationId,
    });

    logger.debug(
      {
        organizationId: input.organizationId,
        phoneNumber,
        messagingProfileId,
        ready,
      },
      "Checked existing number messaging profile readiness",
    );

    if (!ready) {
      await requeueOrGiveUp({
        store,
        record: workingRecord,
        sendEmail: input.sendEmail,
        scheduleJob: input.scheduleJob,
        reason: "messaging_profile_not_ready",
        phoneNumber,
      });

      return;
    }
  }

  const webhookUrl = `${getAppsExternalUrl()}/api/webhooks/platform/telnyx/verification`;
  const body = buildTollFreeVerificationBody({
    entityType: workingRecord.entityType!,
    legalName: workingRecord.legalName!,
    doingBusinessAs: workingRecord.doingBusinessAs,
    businessRegistrationNumber: workingRecord.businessRegistrationNumber,
    country: input.country,
    website: workingRecord.website!,
    streetAddress: workingRecord.address!.streetAddress!,
    addressLine2: workingRecord.address!.addressLine2,
    city: workingRecord.address!.addressLocality!,
    state: workingRecord.address!.addressRegion!,
    postalCode: workingRecord.address!.postalCode!,
    contactFirstName: workingRecord.contactFirstName!,
    contactLastName: workingRecord.contactLastName!,
    contactEmail: workingRecord.contactEmail!,
    contactPhone: workingRecord.contactPhone!,
    phoneNumbers: [phoneNumber],
    optInImageUrl,
    privacyPolicyUrl,
    termsAndConditionUrl,
    webhookUrl,
    helpMessage: getHelpSms("en"),
  });

  if (!body) {
    await requeueOrGiveUp({
      store,
      record: workingRecord,
      sendEmail: input.sendEmail,
      scheduleJob: input.scheduleJob,
      reason: "verification_body_incomplete",
      phoneNumber,
    });

    return;
  }

  logger.debug(
    {
      organizationId: input.organizationId,
      phoneNumber,
      messagingProfileId,
      businessName: body.businessName,
      useCase: body.useCase,
      entityType: body.entityType,
      optInImageUrl,
      privacyPolicyUrl,
      termsAndConditionUrl,
    },
    "Built Telnyx toll-free verification body",
  );

  logger.info(
    {
      organizationId: input.organizationId,
      phoneNumber,
      messagingProfileId,
      webhookUrl,
      businessName: body.businessName,
    },
    "Submitting toll-free verification request to Telnyx",
  );

  try {
    const storedRequestId =
      workingRecord.telnyxRequestId?.trim() ||
      workingRecord.telnyxResourceId?.trim() ||
      undefined;

    logger.debug(
      {
        organizationId: input.organizationId,
        phoneNumber,
        storedRequestId: storedRequestId ?? null,
      },
      "Resolving Telnyx verification request id",
    );

    const requestId =
      storedRequestId ||
      (await findExistingTollFreeVerificationRequestId({
        client,
        phoneNumber,
        organizationId: input.organizationId,
      }));

    let usedCreate = !requestId;
    const result = requestId
      ? await client.messagingTollfree.verification.requests
          .update(requestId, body)
          .catch(async (updateError) => {
            const details = telnyxErrorDetails(updateError);
            logger.warn(
              {
                organizationId: input.organizationId,
                requestId,
                fromMongo: Boolean(storedRequestId),
                ...details,
              },
              "Telnyx verification update failed; falling back to create",
            );

            usedCreate = true;
            return client.messagingTollfree.verification.requests.create(body);
          })
      : await client.messagingTollfree.verification.requests.create(body);

    logger.info(
      {
        organizationId: input.organizationId,
        phoneNumber,
        usedCreate,
        fromMongo: Boolean(storedRequestId),
        lookedUpRequestId: !storedRequestId && requestId ? requestId : null,
        verificationRequestId: result.verificationRequestId ?? null,
        resourceId: result.id ?? null,
      },
      "Telnyx verification request accepted",
    );

    const saved = await store.save({
      ...workingRecord,
      status: "pending",
      telnyxMessagingProfileId: messagingProfileId,
      telnyxRequestId: result.verificationRequestId || result.id,
      telnyxResourceId: result.id,
      rejectionReason: undefined,
      blockedReason: undefined,
      provisionAttempts: undefined,
      submittedAt: new Date(),
      verifiedAt: undefined,
    });

    await notifyVerificationStatus(store, workingRecord, saved, input.emit);
  } catch (error) {
    const details = telnyxErrorDetails(error);
    logger.error(
      {
        organizationId: input.organizationId,
        phoneNumber,
        ...details,
      },
      "Telnyx verification submit failed",
    );

    if (isNotProvisionedError(details)) {
      await requeueOrGiveUp({
        store,
        record: workingRecord,
        sendEmail: input.sendEmail,
        scheduleJob: input.scheduleJob,
        reason: "telnyx_not_provisioned",
        phoneNumber,
      });

      return;
    }

    await store.save({
      ...workingRecord,
      blockedReason: undefined,
      provisionAttempts: undefined,
    });
  }
}

async function requeueOrGiveUp(input: {
  store: SmsRegistrationStore;
  record: SmsRegistrationRecord;
  sendEmail: (email: Email) => Promise<void>;
  scheduleJob: (job: JobRequest) => Promise<unknown>;
  reason: string;
  phoneNumber?: string;
}) {
  const logger = getLoggerFactory("SmsRegistration")("requeueOrGiveUp");
  const attempts = (input.record.provisionAttempts ?? 0) + 1;
  const organizationId = input.record.organizationId;

  await input.store.save({
    ...input.record,
    blockedReason: "number_preparing",
    provisionAttempts: attempts,
  });

  if (attempts >= MAX_PROVISION_ATTEMPTS) {
    logger.warn(
      {
        organizationId,
        attempts,
        reason: input.reason,
        phoneNumber: input.phoneNumber ?? null,
      },
      "SMS verification provision attempts exhausted",
    );

    await notify(input.sendEmail, logger, {
      to: SUPPORT_EMAIL,
      subject: `SMS number still preparing for ${input.record.legalName || organizationId}`,
      body: paragraph(
        `${input.record.legalName || "A business"} (${organizationId}) is still waiting for a dedicated toll-free number after ${attempts} attempts (${input.reason}${input.phoneNumber ? `, number ${input.phoneNumber}` : ""}).`,
      ),
    });

    return;
  }

  logger.info(
    {
      organizationId,
      attempts,
      reason: input.reason,
      phoneNumber: input.phoneNumber ?? null,
      requeueInMs: REQUEUE_DELAY_MS,
    },
    "Requeueing SMS verification job",
  );

  await scheduleSmsVerificationJob({
    organizationId,
    executeAt: new Date(Date.now() + REQUEUE_DELAY_MS),
    scheduleJob: input.scheduleJob,
  });
}

async function ensureMessagingProfileReady(input: {
  client: Telnyx;
  phoneNumber: string;
  messagingProfileId: string;
  organizationId: string;
}): Promise<boolean> {
  const logger = getLoggerFactory("SmsRegistration")(
    "ensureMessagingProfileReady",
  );

  logger.debug(
    {
      organizationId: input.organizationId,
      phoneNumber: input.phoneNumber,
      messagingProfileId: input.messagingProfileId,
      maxAttempts: READINESS_ATTEMPTS,
    },
    "Checking messaging profile readiness",
  );

  for (let attempt = 1; attempt <= READINESS_ATTEMPTS; attempt += 1) {
    try {
      let settings = await input.client.phoneNumbers.messaging.retrieve(
        input.phoneNumber,
      );

      let profileId = settings.data?.messaging_profile_id ?? null;

      if (profileId !== input.messagingProfileId) {
        logger.info(
          {
            organizationId: input.organizationId,
            phoneNumber: input.phoneNumber,
            currentProfileId: profileId,
            targetProfileId: input.messagingProfileId,
            attempt,
          },
          "Assigning number to organization messaging profile",
        );

        settings = await input.client.phoneNumbers.messaging.update(
          input.phoneNumber,
          { messaging_profile_id: input.messagingProfileId },
        );

        profileId = settings.data?.messaging_profile_id ?? null;
      }

      logger.info(
        {
          organizationId: input.organizationId,
          phoneNumber: input.phoneNumber,
          profileId,
          hasSms: Boolean(settings.data?.features?.sms),
          attempt,
        },
        "Checked Telnyx messaging settings for dedicated number",
      );

      if (profileId === input.messagingProfileId) {
        logger.debug(
          {
            organizationId: input.organizationId,
            phoneNumber: input.phoneNumber,
            messagingProfileId: input.messagingProfileId,
            attempt,
          },
          "Number is assigned to organization messaging profile",
        );

        return true;
      }
    } catch (error) {
      logger.warn(
        {
          organizationId: input.organizationId,
          phoneNumber: input.phoneNumber,
          attempt,
          ...telnyxErrorDetails(error),
        },
        "Messaging settings not ready yet for dedicated number",
      );
    }

    if (attempt < READINESS_ATTEMPTS) {
      await sleep(READINESS_POLL_MS);
    }
  }

  logger.warn(
    {
      organizationId: input.organizationId,
      phoneNumber: input.phoneNumber,
      messagingProfileId: input.messagingProfileId,
      attempts: READINESS_ATTEMPTS,
    },
    "Messaging profile readiness checks exhausted",
  );

  return false;
}

async function acquireDedicatedNumber(input: {
  store: SmsRegistrationStore;
  organizationId: string;
  messagingProfileId: string;
  client: Telnyx;
}): Promise<{
  phoneNumber: string;
  source: "released" | "inventory" | "purchased";
  ready: boolean;
} | null> {
  const logger = getLoggerFactory("SmsRegistration")("acquireDedicatedNumber");

  logger.debug(
    {
      organizationId: input.organizationId,
      messagingProfileId: input.messagingProfileId,
    },
    "Acquiring dedicated toll-free number",
  );

  const released = await input.store.claimReleasedProfileNumber(
    input.organizationId,
    input.messagingProfileId,
  );

  logger.debug(
    {
      organizationId: input.organizationId,
      claimedReleased: Boolean(released?.phoneNumber),
      phoneNumber: released?.phoneNumber ?? null,
    },
    "Claimed released profile number result",
  );

  if (released?.phoneNumber) {
    const ready = await ensureMessagingProfileReady({
      client: input.client,
      phoneNumber: released.phoneNumber,
      messagingProfileId: input.messagingProfileId,
      organizationId: input.organizationId,
    });

    logger.info(
      {
        organizationId: input.organizationId,
        phoneNumber: released.phoneNumber,
        source: "released",
        ready,
      },
      "Reused a released toll-free number",
    );

    return {
      phoneNumber: released.phoneNumber,
      source: "released",
      ready,
    };
  }

  logger.debug(
    { organizationId: input.organizationId },
    "Looking for unassigned toll-free inventory on Telnyx account",
  );

  const inventory = await findUnassignedTollFreeNumber({
    client: input.client,
    store: input.store,
    organizationId: input.organizationId,
  });

  if (inventory?.phoneNumber) {
    await input.store.assignProfileNumber({
      phoneNumber: inventory.phoneNumber,
      telnyxId: inventory.telnyxId,
      messagingProfileId: input.messagingProfileId,
      organizationId: input.organizationId,
    });

    const ready = await ensureMessagingProfileReady({
      client: input.client,
      phoneNumber: inventory.phoneNumber,
      messagingProfileId: input.messagingProfileId,
      organizationId: input.organizationId,
    });

    logger.info(
      {
        organizationId: input.organizationId,
        phoneNumber: inventory.phoneNumber,
        source: "inventory",
        ready,
      },
      "Assigned an unassigned account toll-free number",
    );

    return {
      phoneNumber: inventory.phoneNumber,
      source: "inventory",
      ready,
    };
  }

  try {
    logger.debug(
      {
        organizationId: input.organizationId,
        messagingProfileId: input.messagingProfileId,
      },
      "No inventory available; purchasing toll-free number from Telnyx",
    );

    const available = await input.client.availablePhoneNumbers.list({
      filter: {
        country_code: "US",
        phone_number_type: "toll_free",
        features: ["sms"],
        quickship: true,
        limit: 1,
      },
    });

    const phoneNumber = available.data?.[0]?.phone_number?.trim();
    logger.info(
      {
        organizationId: input.organizationId,
        availableCount: available.data?.length ?? 0,
        candidatePhone: phoneNumber ?? null,
      },
      "Telnyx availablePhoneNumbers.list result",
    );

    if (!phoneNumber) {
      logger.warn(
        { organizationId: input.organizationId },
        "No purchasable toll-free number available from Telnyx",
      );

      return null;
    }

    const order = await input.client.numberOrders.create({
      messaging_profile_id: input.messagingProfileId,
      phone_numbers: [{ phone_number: phoneNumber }],
    });

    const orderId = order.data?.id;
    const ordered = order.data?.phone_numbers?.[0];

    logger.info(
      {
        organizationId: input.organizationId,
        orderId: orderId ?? null,
        orderStatus: order.data?.status ?? null,
        orderedPhone: ordered?.phone_number ?? null,
        orderedStatus: ordered?.status ?? null,
      },
      "Telnyx numberOrders.create result",
    );

    if (!ordered?.phone_number || ordered.status === "failure") {
      return null;
    }

    await input.store.insertAssignedProfileNumber({
      phoneNumber: ordered.phone_number,
      telnyxId: ordered.id,
      messagingProfileId: input.messagingProfileId,
      organizationId: input.organizationId,
    });

    let orderReady = order.data?.status === "success";
    if (!orderReady && orderId) {
      for (let attempt = 1; attempt <= READINESS_ATTEMPTS; attempt += 1) {
        const polled = await input.client.numberOrders.retrieve(orderId);
        const status = polled.data?.status;
        logger.info(
          {
            organizationId: input.organizationId,
            orderId,
            status: status ?? null,
            attempt,
          },
          "Polled Telnyx number order status",
        );

        if (status === "success") {
          orderReady = true;
          break;
        }

        if (status === "failure") {
          return {
            phoneNumber: ordered.phone_number,
            source: "purchased",
            ready: false,
          };
        }

        if (attempt < READINESS_ATTEMPTS) {
          await sleep(READINESS_POLL_MS);
        }
      }
    }

    const messagingReady = orderReady
      ? await ensureMessagingProfileReady({
          client: input.client,
          phoneNumber: ordered.phone_number,
          messagingProfileId: input.messagingProfileId,
          organizationId: input.organizationId,
        })
      : false;

    logger.info(
      {
        organizationId: input.organizationId,
        phoneNumber: ordered.phone_number,
        source: "purchased",
        orderReady,
        messagingReady,
      },
      "Purchased and assigned dedicated toll-free number",
    );

    return {
      phoneNumber: ordered.phone_number,
      source: "purchased",
      ready: orderReady && messagingReady,
    };
  } catch (error) {
    logger.error(
      {
        organizationId: input.organizationId,
        messagingProfileId: input.messagingProfileId,
        ...telnyxErrorDetails(error),
      },
      "Could not buy a toll-free number",
    );

    return null;
  }
}

async function notifyVerificationStatus(
  store: SmsRegistrationStore,
  existing: SmsRegistrationRecord | null,
  saved: SmsRegistrationRecord,
  emit?: (type: string, payload: SmsVerificationStatusPayload) => Promise<void>,
) {
  if (!emit) return;

  const assigned = await store.getAssignedProfileNumber(saved.organizationId);
  await emitSmsVerificationStatusChange({
    previousStatus: existing?.status,
    nextStatus: saved.status,
    firstSubmission:
      (!existing || existing.status === "draft") && saved.status === "pending",
    phoneNumber: assigned?.phoneNumber,
    reason: saved.rejectionReason,
    emit,
  });
}

const notify = async (
  sendEmail: (email: Email) => Promise<void>,
  logger: { error: (data: unknown, message: string) => void },
  email: Email,
) => {
  try {
    await sendEmail(email);
  } catch (error) {
    logger.error({ error }, "SMS registration email failed");
  }
};

export { paragraph, SUPPORT_EMAIL };
