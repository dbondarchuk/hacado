import { getLoggerFactory } from "@hacado/logger";
import type {
  Email,
  SmsRegistrationInput,
  SmsRegistrationSaveResponse,
} from "@hacado/types";
import { getAppsExternalUrl, normalizeToE164 } from "@hacado/utils";
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

const SUPPORT_EMAIL = "support@hacado.com";
const DRY_RUN_PHONE_NUMBER = "+18005550100";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const paragraph = (value: string) => `<p>${escapeHtml(value)}</p>`;

const telnyxErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;
  return "Telnyx rejected the verification";
};

export async function saveSmsRegistration(input: {
  organizationId: string;
  country: string;
  values: SmsRegistrationInput;
  sendEmail: (email: Email) => Promise<void>;
  store?: SmsRegistrationStore;
  optInImageUrl?: string;
  notifyEmail?: string;
}): Promise<SmsRegistrationSaveResponse | { error: string }> {
  const logger = getLoggerFactory("SmsRegistration")("save");
  const store = input.store ?? new SmsRegistrationStore();
  const existing = await store.get(input.organizationId);
  const values = input.values;
  const contactPhone = values.contactPhone?.trim()
    ? normalizeToE164(values.contactPhone)
    : undefined;

  if (values.contactPhone?.trim() && !contactPhone) {
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
    if (existing?.enabled && !values.enabled) {
      await store.releaseOrganizationNumber(input.organizationId);
    }
    const saved = await store.save({
      ...base,
      enabled: values.enabled,
      ...(existing?.enabled && !values.enabled
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

    return { outcome: "saved", registration: toSmsRegistrationView(saved) };
  }

  const optInImageUrl = input.optInImageUrl?.trim() ?? "";
  const dryRun = isTelnyxVerificationDryRun();
  const messagingProfileId = getClientMessagingProfileId();
  const alreadyAssigned = await store.getAssignedProfileNumber(
    input.organizationId,
  );

  if (!optInImageUrl || (!dryRun && !alreadyAssigned && !messagingProfileId)) {
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
  let apiKey = "";
  if (dryRun) {
    phoneNumber = phoneNumber || DRY_RUN_PHONE_NUMBER;
  } else {
    const config = getTelnyxConfiguration();
    apiKey = config.apiKey;
    if (!apiKey) {
      await store.save(base);
      return { error: "Telnyx is not configured" };
    }

    if (!phoneNumber) {
      const dedicated = await acquireDedicatedNumber({
        store,
        organizationId: input.organizationId,
        messagingProfileId,
        apiKey,
      });
      if (!dedicated) {
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
    }
  }

  const entityType = values.entityType;
  if (
    !entityType ||
    !values.legalName?.trim() ||
    !values.website?.trim() ||
    !values.address?.streetAddress?.trim() ||
    !values.address.addressLocality?.trim() ||
    !values.address.addressRegion?.trim() ||
    !values.address.postalCode?.trim() ||
    !values.contactFirstName?.trim() ||
    !values.contactLastName?.trim() ||
    !values.contactEmail?.trim() ||
    !contactPhone ||
    (entityType !== "SOLE_PROPRIETOR" &&
      !values.businessRegistrationNumber?.trim())
  ) {
    await store.save(base);
    return { error: "Verification details are incomplete" };
  }

  const body = buildTollFreeVerificationBody({
    entityType,
    legalName: values.legalName,
    doingBusinessAs: values.doingBusinessAs,
    businessRegistrationNumber: values.businessRegistrationNumber,
    country: input.country,
    website: values.website,
    streetAddress: values.address.streetAddress,
    addressLine2: values.address.addressLine2,
    city: values.address.addressLocality,
    state: values.address.addressRegion,
    postalCode: values.address.postalCode,
    contactFirstName: values.contactFirstName,
    contactLastName: values.contactLastName,
    contactEmail: values.contactEmail,
    contactPhone,
    phoneNumbers: [phoneNumber],
    optInImageUrl,
    webhookUrl: `${getAppsExternalUrl()}/api/webhooks/platform/telnyx/verification`,
    helpMessage: getHelpSms("en"),
  });

  if (!body) {
    const saved = await store.save({
      ...base,
      blockedReason: "number_preparing",
    });

    return {
      outcome: "preparing",
      registration: toSmsRegistrationView(saved),
    };
  }

  if (dryRun) {
    const recipient = input.notifyEmail?.trim() || values.contactEmail?.trim();
    if (!recipient) {
      await store.save(base);
      return { error: "Verification preview has no recipient" };
    }

    const placeholderNote =
      phoneNumber === DRY_RUN_PHONE_NUMBER
        ? paragraph(
            "No toll-free number is assigned, so the phone number below is a placeholder. Nothing was ordered from Telnyx.",
          )
        : "";

    try {
      await input.sendEmail({
        to: recipient,
        subject: "SMS verification preview",
        body: `${paragraph("Verification was not submitted to Telnyx. These are the values that would be sent.")}${placeholderNote}<pre>${escapeHtml(JSON.stringify(body, null, 2))}</pre>`,
      });
    } catch (error) {
      logger.error(
        { organizationId: input.organizationId, error },
        "SMS verification preview email failed",
      );
      await store.save(base);
      return { error: "Could not email the verification preview" };
    }

    const saved = await store.save(base);
    return { outcome: "saved", registration: toSmsRegistrationView(saved) };
  }

  try {
    const client = new Telnyx({ apiKey });
    const requestId = existing?.telnyxRequestId || existing?.telnyxResourceId;
    const result = requestId
      ? await client.messagingTollfree.verification.requests
          .update(requestId, body)
          .catch(async () =>
            client.messagingTollfree.verification.requests.create(body),
          )
      : await client.messagingTollfree.verification.requests.create(body);

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

    return {
      outcome: "submitted",
      registration: toSmsRegistrationView(saved),
    };
  } catch (error) {
    logger.error(
      {
        organizationId: input.organizationId,
        error: telnyxErrorMessage(error),
      },
      "Telnyx verification submit failed",
    );
    await store.save(base);
    return { error: telnyxErrorMessage(error) };
  }
}

async function acquireDedicatedNumber(input: {
  store: SmsRegistrationStore;
  organizationId: string;
  messagingProfileId: string;
  apiKey: string;
}): Promise<{ phoneNumber: string } | null> {
  const released = await input.store.claimReleasedProfileNumber(
    input.organizationId,
  );
  if (released?.phoneNumber) return { phoneNumber: released.phoneNumber };

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
    if (!phoneNumber) return null;

    const order = await client.numberOrders.create({
      messaging_profile_id: input.messagingProfileId,
      phone_numbers: [{ phone_number: phoneNumber }],
    });
    const ordered = order.data?.phone_numbers?.[0];
    if (!ordered?.phone_number || ordered.status === "failure") return null;

    await input.store.insertAssignedProfileNumber({
      phoneNumber: ordered.phone_number,
      telnyxId: ordered.id,
      organizationId: input.organizationId,
    });
    return { phoneNumber: ordered.phone_number };
  } catch (error) {
    getLoggerFactory("SmsRegistration")("acquireDedicatedNumber").error(
      { organizationId: input.organizationId, error },
      "Could not buy a toll-free number",
    );
    return null;
  }
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
