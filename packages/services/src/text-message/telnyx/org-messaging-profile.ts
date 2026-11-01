import { getLoggerFactory } from "@hacado/logger";
import { getAppsExternalUrl } from "@hacado/utils/website";
import type { Telnyx } from "telnyx";
import {
  SmsRegistrationRecord,
  SmsRegistrationStore,
} from "../registration-store";

export const orgMessagingProfileName = (businessName: string) =>
  `Hacado ISV: ${businessName.trim() || "Business"}`;

const messagingWebhookUrl = () =>
  `${getAppsExternalUrl()}/api/webhooks/platform/telnyx/messaging`;

/** Create or reuse the org's dedicated Telnyx messaging profile. */
export async function ensureOrganizationMessagingProfile(input: {
  client: Telnyx;
  store: SmsRegistrationStore;
  record: SmsRegistrationRecord;
  businessName: string;
}): Promise<{ profileId: string; record: SmsRegistrationRecord }> {
  const logger = getLoggerFactory("SmsRegistration")(
    "ensureOrganizationMessagingProfile",
  );

  const name = orgMessagingProfileName(input.businessName);
  const webhookUrl = messagingWebhookUrl();
  const existingId = input.record.telnyxMessagingProfileId?.trim();

  logger.debug(
    {
      organizationId: input.record.organizationId,
      businessName: input.businessName,
      profileName: name,
      existingMessagingProfileId: existingId ?? null,
      webhookUrl,
    },
    "Ensuring organization messaging profile",
  );

  if (existingId) {
    try {
      logger.debug(
        {
          organizationId: input.record.organizationId,
          messagingProfileId: existingId,
          name,
          webhookUrl,
        },
        "Updating existing Telnyx messaging profile",
      );

      await input.client.messagingProfiles.update(existingId, {
        name,
        webhook_url: webhookUrl,
        webhook_api_version: "2",
        enabled: true,
      });

      logger.info(
        {
          organizationId: input.record.organizationId,
          messagingProfileId: existingId,
          name,
        },
        "Reused organization messaging profile",
      );

      return { profileId: existingId, record: input.record };
    } catch (error) {
      logger.warn(
        {
          organizationId: input.record.organizationId,
          messagingProfileId: existingId,
          error,
        },
        "Stored messaging profile missing; creating a new one",
      );
    }
  }

  logger.debug(
    {
      organizationId: input.record.organizationId,
      name,
      webhookUrl,
      whitelistedDestinations: ["US", "CA"],
    },
    "Creating Telnyx messaging profile",
  );

  const created = await input.client.messagingProfiles.create({
    name,
    whitelisted_destinations: ["US", "CA"],
    webhook_url: webhookUrl,
    webhook_api_version: "2",
    enabled: true,
  });

  const profileId = created.data?.id?.trim();
  if (!profileId) {
    logger.error(
      {
        organizationId: input.record.organizationId,
        name,
        webhookUrl,
        createResponse: created,
      },
      "Telnyx messaging profile create returned no id",
    );

    throw new Error("Telnyx messaging profile create returned no id");
  }

  const record = await input.store.save({
    ...input.record,
    telnyxMessagingProfileId: profileId,
  });

  logger.info(
    {
      organizationId: input.record.organizationId,
      messagingProfileId: profileId,
      name,
    },
    "Created organization messaging profile",
  );

  return { profileId, record };
}

/** Detach a number from its messaging profile (empty string unassigns). */
export async function unassignNumberFromMessagingProfile(input: {
  client: Telnyx;
  phoneNumber: string;
  organizationId: string;
}): Promise<void> {
  const logger = getLoggerFactory("SmsRegistration")(
    "unassignNumberFromMessagingProfile",
  );

  logger.debug(
    {
      organizationId: input.organizationId,
      phoneNumber: input.phoneNumber,
    },
    "Unassigning number from messaging profile",
  );

  try {
    await input.client.phoneNumbers.messaging.update(input.phoneNumber, {
      messaging_profile_id: "",
    });

    logger.info(
      {
        organizationId: input.organizationId,
        phoneNumber: input.phoneNumber,
      },
      "Unassigned number from messaging profile",
    );
  } catch (error) {
    logger.warn(
      {
        organizationId: input.organizationId,
        phoneNumber: input.phoneNumber,
        error,
      },
      "Could not unassign number from messaging profile",
    );
  }
}

/** Find a toll-free number on the account with no messaging profile. */
export async function findUnassignedTollFreeNumber(input: {
  client: Telnyx;
  store: SmsRegistrationStore;
  organizationId: string;
}): Promise<{ phoneNumber: string; telnyxId?: string } | null> {
  const logger = getLoggerFactory("SmsRegistration")(
    "findUnassignedTollFreeNumber",
  );

  const pool = new Set(await input.store.listPoolNumbers());

  logger.debug(
    {
      organizationId: input.organizationId,
      poolNumberCount: pool.size,
    },
    "Scanning Telnyx account for unassigned toll-free numbers",
  );

  let scanned = 0;
  let skippedPool = 0;
  let skippedAssignedProfile = 0;
  let skippedAssignedInMongo = 0;

  for await (const row of input.client.phoneNumbers.messaging.list({
    "filter[type]": "tollfree",
    "page[size]": 50,
  })) {
    scanned += 1;
    const phoneNumber = row.phone_number?.trim();
    if (!phoneNumber) continue;

    if (pool.has(phoneNumber)) {
      skippedPool += 1;
      continue;
    }

    if (row.messaging_profile_id) {
      skippedAssignedProfile += 1;
      continue;
    }

    const existing = await input.store.getProfileNumber(phoneNumber);
    if (existing?.status === "assigned") {
      skippedAssignedInMongo += 1;
      continue;
    }

    logger.info(
      {
        organizationId: input.organizationId,
        phoneNumber,
        telnyxId: row.id ?? null,
        scanned,
        skippedPool,
        skippedAssignedProfile,
        skippedAssignedInMongo,
      },
      "Found unassigned toll-free number on Telnyx account",
    );

    return {
      phoneNumber,
      ...(row.id ? { telnyxId: row.id } : {}),
    };
  }

  logger.debug(
    {
      organizationId: input.organizationId,
      scanned,
      skippedPool,
      skippedAssignedProfile,
      skippedAssignedInMongo,
    },
    "No unassigned toll-free number found on Telnyx account",
  );

  return null;
}

export async function releaseDedicatedNumberForOrganization(input: {
  organizationId: string;
  store?: SmsRegistrationStore;
  client?: Telnyx;
}): Promise<void> {
  const logger = getLoggerFactory("SmsRegistration")(
    "releaseDedicatedNumberForOrganization",
  );

  const store = input.store ?? new SmsRegistrationStore();
  const assigned = await store.getAssignedProfileNumber(input.organizationId);

  logger.info(
    {
      organizationId: input.organizationId,
      phoneNumber: assigned?.phoneNumber ?? null,
      messagingProfileId: assigned?.messagingProfileId ?? null,
      hasTelnyxClient: Boolean(input.client),
    },
    "Releasing dedicated number for organization",
  );

  if (assigned?.phoneNumber && input.client) {
    await unassignNumberFromMessagingProfile({
      client: input.client,
      phoneNumber: assigned.phoneNumber,
      organizationId: input.organizationId,
    });
  } else if (assigned?.phoneNumber && !input.client) {
    logger.warn(
      {
        organizationId: input.organizationId,
        phoneNumber: assigned.phoneNumber,
      },
      "Releasing number in Mongo without Telnyx unassign; API key missing",
    );
  }

  await store.releaseOrganizationNumber(input.organizationId);

  logger.debug(
    { organizationId: input.organizationId },
    "Dedicated number release persisted",
  );
}
