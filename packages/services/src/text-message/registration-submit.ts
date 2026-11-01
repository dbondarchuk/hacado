import { getLoggerFactory } from "@hacado/logger";
import type { Email } from "@hacado/types/apps";
import type { SmsVerificationStatusPayload } from "@hacado/types/events";
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
  getClientMessagingProfileId,
  getTelnyxConfiguration,
  isTelnyxVerificationDryRun,
} from "./telnyx/config";
import {
  buildTollFreeVerificationBody,
  requiresSmsVerification,
} from "./verification";
import { emitSmsVerificationStatusChange } from "./verification-events";

const SUPPORT_EMAIL = "support@hacado.com";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const paragraph = (value: string) => `<p>${escapeHtml(value)}</p>`;

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

export async function saveSmsRegistration(input: {
  organizationId: string;
  country: string;
  values: SmsRegistrationInput;
  sendEmail: (email: Email) => Promise<void>;
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
      existingTelnyxRequestId: existing?.telnyxRequestId ?? null,
      existingTelnyxResourceId: existing?.telnyxResourceId ?? null,
      hasOptInImage: Boolean(input.optInImageUrl?.trim()),
      optInImageLength: input.optInImageUrl?.trim().length ?? 0,
      hasPrivacyPolicyUrl: Boolean(input.privacyPolicyUrl?.trim()),
      hasTermsAndConditionUrl: Boolean(input.termsAndConditionUrl?.trim()),
      website: values.website?.trim() || null,
      legalName: values.legalName?.trim() || null,
      contactEmail: values.contactEmail?.trim() || null,
      contactPhoneRaw: values.contactPhone?.trim() || null,
      contactPhoneE164: contactPhone ?? null,
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
        requiresVerification: requiresSmsVerification(input.country),
        enabled: values.enabled,
        resubmit: values.resubmit,
        releasing,
      },
      "Skipping Telnyx verification submit",
    );

    if (releasing) {
      logger.info(
        { organizationId: input.organizationId },
        "Releasing dedicated number because custom messaging was turned off",
      );

      await store.releaseOrganizationNumber(input.organizationId);
    }

    const saved = await store.save({
      ...base,
      enabled: values.enabled,
      ...(releasing
        ? {
            status: "draft" as const,
            telnyxRequestId: undefined,
            telnyxResourceId: undefined,
            rejectionReason: undefined,
            blockedReason: undefined,
            submittedAt: undefined,
            verifiedAt: undefined,
          }
        : {}),
    });

    logger.info(
      {
        organizationId: input.organizationId,
        outcome: "saved",
        status: saved.status,
        enabled: saved.enabled,
      },
      "SMS registration saved without Telnyx submit",
    );

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
      {
        organizationId: input.organizationId,
        missing,
      },
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
      submittedAt: new Date(),
      verifiedAt: undefined,
    });

    await notifyVerificationStatus(store, existing, saved, input.emit);

    return { outcome: "submitted", registration: toSmsRegistrationView(saved) };
  }

  const optInImageUrl = input.optInImageUrl?.trim() ?? "";
  const messagingProfileId = getClientMessagingProfileId();
  const alreadyAssigned = await store.getAssignedProfileNumber(
    input.organizationId,
  );

  logger.info(
    {
      organizationId: input.organizationId,
      hasOptInImage: Boolean(optInImageUrl),
      optInImageLength: optInImageUrl.length,
      messagingProfileId: messagingProfileId || null,
      alreadyAssignedPhone: alreadyAssigned?.phoneNumber ?? null,
      alreadyAssignedTelnyxId: alreadyAssigned?.telnyxId ?? null,
    },
    "Checking opt-in image and dedicated number readiness",
  );

  if (!optInImageUrl || (!alreadyAssigned && !messagingProfileId)) {
    logger.warn(
      {
        organizationId: input.organizationId,
        reason: !optInImageUrl
          ? "missing_opt_in_image"
          : "missing_messaging_profile_for_new_number",
        hasOptInImage: Boolean(optInImageUrl),
        hasAlreadyAssigned: Boolean(alreadyAssigned),
        hasMessagingProfileId: Boolean(messagingProfileId),
      },
      "Cannot submit verification yet; marking number_preparing",
    );

    const saved = await store.save({
      ...base,
      blockedReason: "number_preparing",
    });

    if (existing?.blockedReason !== "number_preparing") {
      await notify(input.sendEmail, logger, {
        to: SUPPORT_EMAIL,
        subject: `SMS number needed for ${saved.legalName || input.organizationId}`,
        body: paragraph(
          `${saved.legalName || "A business"} (${input.organizationId}) turned on custom messaging, and a toll-free number or the opt-in screenshot is not ready.`,
        ),
      });
    }

    return {
      outcome: "preparing",
      registration: toSmsRegistrationView(saved),
    };
  }

  let phoneNumber = alreadyAssigned?.phoneNumber;
  const config = getTelnyxConfiguration();
  const apiKey = config.apiKey;
  if (!apiKey) {
    logger.error(
      { organizationId: input.organizationId },
      "Telnyx API key is not configured",
    );

    await store.save(base);
    return { error: "Telnyx is not configured" };
  }

  if (!phoneNumber) {
    logger.info(
      {
        organizationId: input.organizationId,
        messagingProfileId,
      },
      "No assigned number; acquiring dedicated toll-free number",
    );

    const dedicated = await acquireDedicatedNumber({
      store,
      organizationId: input.organizationId,
      messagingProfileId,
      apiKey,
    });

    if (!dedicated) {
      logger.warn(
        { organizationId: input.organizationId, messagingProfileId },
        "Could not acquire a dedicated number; marking number_preparing",
      );

      const saved = await store.save({
        ...base,
        blockedReason: "number_preparing",
      });

      if (existing?.blockedReason !== "number_preparing") {
        await notify(input.sendEmail, logger, {
          to: SUPPORT_EMAIL,
          subject: `SMS number needed for ${saved.legalName || input.organizationId}`,
          body: paragraph(
            `${saved.legalName || "A business"} (${input.organizationId}) turned on custom messaging, and a toll-free number could not be assigned.`,
          ),
        });
      }

      return {
        outcome: "preparing",
        registration: toSmsRegistrationView(saved),
      };
    }

    phoneNumber = dedicated.phoneNumber;
    logger.info(
      {
        organizationId: input.organizationId,
        phoneNumber,
        source: dedicated.source,
      },
      "Dedicated toll-free number acquired",
    );
  } else {
    logger.info(
      {
        organizationId: input.organizationId,
        phoneNumber,
        source: "already_assigned",
      },
      "Using existing assigned dedicated number",
    );
  }

  const webhookUrl = `${getAppsExternalUrl()}/api/webhooks/platform/telnyx/verification`;
  const body = buildTollFreeVerificationBody({
    entityType: entityType!,
    legalName: values.legalName!,
    doingBusinessAs: values.doingBusinessAs,
    businessRegistrationNumber: values.businessRegistrationNumber,
    country: input.country,
    website: values.website!,
    streetAddress: values.address!.streetAddress!,
    addressLine2: values.address!.addressLine2,
    city: values.address!.addressLocality!,
    state: values.address!.addressRegion!,
    postalCode: values.address!.postalCode!,
    contactFirstName: values.contactFirstName!,
    contactLastName: values.contactLastName!,
    contactEmail: values.contactEmail!,
    contactPhone: contactPhone!,
    phoneNumbers: [phoneNumber],
    optInImageUrl,
    privacyPolicyUrl: input.privacyPolicyUrl?.trim() ?? "",
    termsAndConditionUrl: input.termsAndConditionUrl?.trim() ?? "",
    webhookUrl,
    helpMessage: getHelpSms("en"),
  });

  if (!body) {
    logger.warn(
      {
        organizationId: input.organizationId,
        phoneNumber,
        country: input.country,
        entityType,
      },
      "buildTollFreeVerificationBody returned null; marking number_preparing",
    );

    const saved = await store.save({
      ...base,
      blockedReason: "number_preparing",
    });

    return {
      outcome: "preparing",
      registration: toSmsRegistrationView(saved),
    };
  }

  logger.info(
    {
      organizationId: input.organizationId,
      phoneNumber,
      webhookUrl,
      businessName: body.businessName,
      corporateWebsite: body.corporateWebsite,
      optInWorkflowImageURLs: body.optInWorkflowImageURLs,
      privacyPolicyURL: body.privacyPolicyURL,
      termsAndConditionURL: body.termsAndConditionURL,
      phoneNumbers: body.phoneNumbers,
      entityType: body.entityType,
      existingRequestId: existing?.telnyxRequestId ?? null,
      existingResourceId: existing?.telnyxResourceId ?? null,
    },
    "Submitting toll-free verification request to Telnyx",
  );

  try {
    const client = new Telnyx({ apiKey });
    const requestId = existing?.telnyxRequestId || existing?.telnyxResourceId;
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
        previousRequestId: requestId ?? null,
        verificationRequestId: result.verificationRequestId ?? null,
        resourceId: result.id ?? null,
        resultStatus:
          "verificationStatus" in result
            ? result.verificationStatus
            : "status" in result
              ? result.status
              : null,
      },
      "Telnyx verification request accepted",
    );

    const saved = await store.save({
      ...base,
      status: "pending",
      telnyxRequestId: result.verificationRequestId || result.id,
      telnyxResourceId: result.id,
      rejectionReason: undefined,
      blockedReason: undefined,
      submittedAt: new Date(),
      verifiedAt: undefined,
    });
    await notifyVerificationStatus(store, existing, saved, input.emit);

    return {
      outcome: "submitted",
      registration: toSmsRegistrationView(saved),
    };
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

    await store.save(base);
    return { error: details.message };
  }
}

async function acquireDedicatedNumber(input: {
  store: SmsRegistrationStore;
  organizationId: string;
  messagingProfileId: string;
  apiKey: string;
}): Promise<{ phoneNumber: string; source: "released" | "purchased" } | null> {
  const logger = getLoggerFactory("SmsRegistration")("acquireDedicatedNumber");

  logger.info(
    {
      organizationId: input.organizationId,
      messagingProfileId: input.messagingProfileId,
    },
    "Looking for a released profile number to reuse",
  );

  const released = await input.store.claimReleasedProfileNumber(
    input.organizationId,
  );

  if (released?.phoneNumber) {
    logger.info(
      {
        organizationId: input.organizationId,
        phoneNumber: released.phoneNumber,
        telnyxId: released.telnyxId ?? null,
        source: "released",
      },
      "Reused a released toll-free number",
    );

    return { phoneNumber: released.phoneNumber, source: "released" };
  }

  logger.info(
    {
      organizationId: input.organizationId,
      messagingProfileId: input.messagingProfileId,
      filter: {
        country_code: "US",
        phone_number_type: "toll_free",
        features: ["sms"],
        quickship: true,
        limit: 1,
      },
    },
    "No released number; searching Telnyx available toll-free numbers to buy",
  );

  try {
    const client = new Telnyx({ apiKey: input.apiKey });
    const available = await client.availablePhoneNumbers.list({
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
        candidateMeta: available.data?.[0]
          ? {
              phoneNumber: available.data[0].phone_number,
              region: available.data[0].region_information,
              features: available.data[0].features,
              costInformation: available.data[0].cost_information,
            }
          : null,
      },
      "Telnyx availablePhoneNumbers.list result",
    );

    if (!phoneNumber) {
      logger.warn(
        { organizationId: input.organizationId },
        "Telnyx returned no purchasable toll-free SMS numbers",
      );

      return null;
    }

    logger.info(
      {
        organizationId: input.organizationId,
        phoneNumber,
        messagingProfileId: input.messagingProfileId,
      },
      "Creating Telnyx number order",
    );

    const order = await client.numberOrders.create({
      messaging_profile_id: input.messagingProfileId,
      phone_numbers: [{ phone_number: phoneNumber }],
    });
    const ordered = order.data?.phone_numbers?.[0];
    logger.info(
      {
        organizationId: input.organizationId,
        orderId: order.data?.id ?? null,
        orderStatus: order.data?.status ?? null,
        orderedPhone: ordered?.phone_number ?? null,
        orderedStatus: ordered?.status ?? null,
        orderedId: ordered?.id ?? null,
      },
      "Telnyx numberOrders.create result",
    );

    if (!ordered?.phone_number || ordered.status === "failure") {
      logger.warn(
        {
          organizationId: input.organizationId,
          phoneNumber,
          orderedStatus: ordered?.status ?? null,
          order,
        },
        "Telnyx number order did not succeed",
      );

      return null;
    }

    await input.store.insertAssignedProfileNumber({
      phoneNumber: ordered.phone_number,
      telnyxId: ordered.id,
      organizationId: input.organizationId,
    });

    logger.info(
      {
        organizationId: input.organizationId,
        phoneNumber: ordered.phone_number,
        telnyxId: ordered.id ?? null,
        source: "purchased",
      },
      "Purchased and assigned dedicated toll-free number",
    );

    return { phoneNumber: ordered.phone_number, source: "purchased" };
  } catch (error) {
    const details = telnyxErrorDetails(error);
    logger.error(
      {
        organizationId: input.organizationId,
        messagingProfileId: input.messagingProfileId,
        ...details,
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
