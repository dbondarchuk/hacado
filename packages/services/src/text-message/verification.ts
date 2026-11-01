import type { SmsRegistrationStatus } from "@hacado/types/text-message/registration";

export const SMS_VERIFICATION_COUNTRIES = ["US", "CA"] as const;

export const requiresSmsVerification = (country: string | undefined) =>
  SMS_VERIFICATION_COUNTRIES.includes(
    (country ?? "")
      .trim()
      .toUpperCase() as (typeof SMS_VERIFICATION_COUNTRIES)[number],
  );

export type PlatformSmsRoute =
  | { kind: "skip"; reason: string }
  | {
      kind: "telnyx";
      from: string;
      messagingProfileId: string;
      shared: boolean;
    }
  | { kind: "textbelt" };

export type UnverifiedSmsProvider = "textbelt" | "telnyx";

export const getUnverifiedSmsProvider = (
  value = process.env.SMS_UNVERIFIED_PROVIDER,
): UnverifiedSmsProvider => {
  const provider = value?.trim().toLowerCase() || "textbelt";
  if (provider === "textbelt" || provider === "telnyx") {
    return provider;
  }

  throw new Error(`Unsupported SMS_UNVERIFIED_PROVIDER: ${value}`);
};

export const resolvePlatformSmsRoute = (input: {
  customVerified: boolean;
  dedicatedNumber: string | undefined;
  platformCountry: boolean;
  poolNumber: string | undefined;
  messagingProfileId: string;
  unverifiedProvider?: UnverifiedSmsProvider;
}): PlatformSmsRoute => {
  if (input.platformCountry && input.customVerified && input.dedicatedNumber) {
    return {
      kind: "telnyx",
      from: input.dedicatedNumber,
      messagingProfileId: input.messagingProfileId,
      shared: false,
    };
  }

  const unverifiedProvider = input.unverifiedProvider ?? "textbelt";
  if (!input.platformCountry || unverifiedProvider === "textbelt") {
    return { kind: "textbelt" };
  }

  if (!input.poolNumber) {
    return { kind: "skip", reason: "sms number not ready" };
  }

  return {
    kind: "telnyx",
    from: input.poolNumber,
    messagingProfileId: input.messagingProfileId,
    shared: true,
  };
};

export const mapTelnyxVerificationStatus = (
  status: string,
): SmsRegistrationStatus | null => {
  const normalized = status.trim().toLowerCase();
  if (normalized === "verified") return "verified";
  if (normalized === "rejected" || normalized === "waiting for customer") {
    return "rejected";
  }
  if (
    normalized === "in progress" ||
    normalized === "waiting for vendor" ||
    normalized === "waiting for telnyx"
  ) {
    return "pending";
  }

  return null;
};

const readString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

export const readVerificationWebhook = (
  event: unknown,
): { requestId: string; status: string; reason?: string } | null => {
  if (!event || typeof event !== "object") return null;

  const data = (event as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;

  const payload = (data as { payload?: unknown }).payload;
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const requestId =
    readString(record.id) ||
    readString(record.verification_request_id) ||
    readString(record.verificationRequestId);
  const status =
    readString(record.verification_status) ||
    readString(record.verificationStatus);
  if (!requestId || !status) return null;

  const reason =
    readString(record.reason) ||
    readString(record.rejection_reason) ||
    (Array.isArray(record.rejection_reasons)
      ? record.rejection_reasons
          .map((item) => readString(item))
          .filter((item): item is string => Boolean(item))
          .join(" ")
      : undefined);

  return { requestId, status, ...(reason ? { reason } : {}) };
};

const capitalize = (value: string) =>
  value.replace(/^\p{L}/u, (letter) => letter.toUpperCase());

export type TollFreeVerificationBody = {
  additionalInformation: string;
  businessAddr1: string;
  businessAddr2?: string;
  businessCity: string;
  businessContactEmail: string;
  businessContactFirstName: string;
  businessContactLastName: string;
  businessContactPhone: string;
  businessName: string;
  businessState: string;
  businessZip: string;
  corporateWebsite: string;
  messageVolume: "1,000";
  optInWorkflow: string;
  optInWorkflowImageURLs: Array<{ url: string }>;
  phoneNumbers: Array<{ phoneNumber: string }>;
  productionMessageContent: string;
  useCase: "Appointments";
  useCaseSummary: string;
  ageGatedContent: false;
  businessRegistrationCountry?: string;
  businessRegistrationNumber?: string;
  businessRegistrationType?: string;
  doingBusinessAs?: string;
  entityType:
    | "PRIVATE_PROFIT"
    | "PUBLIC_PROFIT"
    | "SOLE_PROPRIETOR"
    | "NON_PROFIT";
  helpMessageResponse: string;
  isvReseller: "Hacado";
  optInKeywords: string;
  privacyPolicyURL: string;
  termsAndConditionURL: string;
  webhookUrl: string;
};

export const buildTollFreeVerificationBody = (input: {
  entityType:
    | "PRIVATE_PROFIT"
    | "PUBLIC_PROFIT"
    | "SOLE_PROPRIETOR"
    | "NON_PROFIT";
  legalName: string;
  doingBusinessAs?: string;
  businessRegistrationNumber?: string;
  country: string;
  website: string;
  streetAddress: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  phoneNumbers: string[];
  optInImageUrl: string;
  privacyPolicyUrl: string;
  termsAndConditionUrl: string;
  webhookUrl: string;
  helpMessage: string;
}): TollFreeVerificationBody | null => {
  if (
    !input.optInImageUrl.trim() ||
    !input.privacyPolicyUrl.trim() ||
    !input.termsAndConditionUrl.trim()
  ) {
    return null;
  }

  const tradeName = input.doingBusinessAs?.trim() || input.legalName.trim();
  const website = input.website.trim();
  const privacyPolicyUrl = input.privacyPolicyUrl.trim();
  const termsAndConditionUrl = input.termsAndConditionUrl.trim();
  const body: TollFreeVerificationBody = {
    additionalInformation: `This toll-free number is assigned exclusively to ${tradeName} and is not shared with any other business, brand, or Hacado customer. Messages sent from this number are strictly transactional appointment communications between ${tradeName} and their registered customers. No marketing, promotional, or cold outreach messaging is permitted or transmitted. Every message clearly identifies the sender brand (${tradeName}) and includes standard opt-out instructions (Reply STOP to cancel) and support details (Reply HELP for help or email support@hacado.com). Privacy policy: ${privacyPolicyUrl}. Terms: ${termsAndConditionUrl}.`,
    businessAddr1: input.streetAddress.trim(),
    businessCity: capitalize(input.city.trim()),
    businessContactEmail: input.contactEmail.trim(),
    businessContactFirstName: input.contactFirstName.trim(),
    businessContactLastName: input.contactLastName.trim(),
    businessContactPhone: input.contactPhone.trim(),
    businessName: input.legalName.trim(),
    businessState: capitalize(input.state.trim()),
    businessZip: input.postalCode.trim(),
    corporateWebsite: website,
    messageVolume: "1,000",
    optInWorkflow: `Customer enters a mobile number on the booking or waitlist page for ${tradeName} and may check an unchecked box to receive appointment or waitlist texts. The box is optional. Booking completes if it is left unchecked. Consent is stored for that phone number and ${tradeName} only and is not shared with other businesses.`,
    optInWorkflowImageURLs: [{ url: input.optInImageUrl }],
    phoneNumbers: input.phoneNumbers.map((phoneNumber) => ({ phoneNumber })),
    productionMessageContent: `${tradeName}: Hi Jessica, your appointment on Fri, Oct 17, 3:00 PM is confirmed.`,
    useCase: "Appointments",
    useCaseSummary: `${tradeName} uses this dedicated toll-free number solely for its own transactional appointment confirmations, booking updates, rescheduling alerts, and automated reminders to its clients. The number is not shared with other businesses or used for Hacado platform-wide messaging. The messaging infrastructure is managed by Hacado as the scheduling software ISV for ${tradeName}. All notifications are triggered strictly by client booking activity on ${website}.`,
    ageGatedContent: false,
    entityType: input.entityType,
    helpMessageResponse: input.helpMessage,
    isvReseller: "Hacado",
    optInKeywords: "START, YES, UNSTOP, SUBSCRIBE",
    privacyPolicyURL: privacyPolicyUrl,
    termsAndConditionURL: termsAndConditionUrl,
    webhookUrl: input.webhookUrl,
  };

  const line2 = input.addressLine2?.trim();
  if (line2) body.businessAddr2 = line2;

  const dba = input.doingBusinessAs?.trim();
  if (dba) body.doingBusinessAs = dba;

  const registrationNumber = input.businessRegistrationNumber?.trim();
  if (registrationNumber) {
    body.businessRegistrationNumber = registrationNumber;
    body.businessRegistrationType =
      input.country.toUpperCase() === "CA" ? "BN" : "EIN";
    body.businessRegistrationCountry = input.country.toUpperCase();
  }

  return body;
};
