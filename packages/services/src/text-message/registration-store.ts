import type {
  PostalAddress,
  SmsEntityType,
  SmsRegistrationStatus,
  SmsRegistrationView,
} from "@hacado/types";
import { getDbConnection } from "../database";

export const SMS_REGISTRATIONS_COLLECTION_NAME = "sms-registrations";
export const SMS_POOL_NUMBERS_COLLECTION_NAME = "sms-pool-numbers";
export const SMS_PROFILE_NUMBERS_COLLECTION_NAME = "sms-profile-numbers";

export type SmsRegistrationRecord = {
  organizationId: string;
  enabled: boolean;
  status: SmsRegistrationStatus;
  entityType?: SmsEntityType;
  legalName?: string;
  doingBusinessAs?: string;
  businessRegistrationNumber?: string;
  website?: string;
  address?: PostalAddress;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  telnyxRequestId?: string;
  telnyxResourceId?: string;
  rejectionReason?: string;
  blockedReason?: "number_preparing";
  updatedAt: Date;
  submittedAt?: Date;
  verifiedAt?: Date;
};

export type SmsPoolNumberRecord = {
  phoneNumber: string;
  createdAt: Date;
};

export type SmsProfileNumberStatus = "assigned" | "released";

export type SmsProfileNumberRecord = {
  phoneNumber: string;
  telnyxId?: string;
  organizationId?: string;
  status: SmsProfileNumberStatus;
  createdAt: Date;
  releasedAt?: Date;
};

const blank = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const toSmsRegistrationView = (
  record: SmsRegistrationRecord | null,
  fallback?: Partial<SmsRegistrationView>,
): SmsRegistrationView => {
  return {
    enabled: record?.enabled ?? fallback?.enabled ?? false,
    status: record?.status ?? "draft",
    entityType: record?.entityType ?? fallback?.entityType ?? "PRIVATE_PROFIT",
    legalName: record?.legalName ?? fallback?.legalName ?? "",
    doingBusinessAs: record?.doingBusinessAs ?? fallback?.doingBusinessAs ?? "",
    businessRegistrationNumber:
      record?.businessRegistrationNumber ??
      fallback?.businessRegistrationNumber ??
      "",
    website: record?.website ?? fallback?.website ?? "",
    address: record?.address ?? fallback?.address ?? {},
    contactFirstName:
      record?.contactFirstName ?? fallback?.contactFirstName ?? "",
    contactLastName: record?.contactLastName ?? fallback?.contactLastName ?? "",
    contactEmail: record?.contactEmail ?? fallback?.contactEmail ?? "",
    contactPhone: record?.contactPhone ?? fallback?.contactPhone ?? "",
    ...(record?.rejectionReason
      ? { rejectionReason: record.rejectionReason }
      : {}),
    ...(record?.blockedReason ? { blockedReason: record.blockedReason } : {}),
  };
};

export class SmsRegistrationStore {
  public async get(
    organizationId: string,
  ): Promise<SmsRegistrationRecord | null> {
    const db = await getDbConnection();
    return db
      .collection<SmsRegistrationRecord>(SMS_REGISTRATIONS_COLLECTION_NAME)
      .findOne({ organizationId });
  }

  public async save(
    record: Omit<SmsRegistrationRecord, "updatedAt"> & {
      updatedAt?: Date;
      _id?: unknown;
    },
  ): Promise<SmsRegistrationRecord> {
    const db = await getDbConnection();
    const { updatedAt: _updatedAt, _id: _ignoredId, ...fields } = record;
    const next: SmsRegistrationRecord = {
      ...fields,
      legalName: blank(fields.legalName),
      doingBusinessAs: blank(fields.doingBusinessAs),
      businessRegistrationNumber: blank(fields.businessRegistrationNumber),
      website: blank(fields.website),
      contactFirstName: blank(fields.contactFirstName),
      contactLastName: blank(fields.contactLastName),
      contactEmail: blank(fields.contactEmail),
      contactPhone: blank(fields.contactPhone),
      rejectionReason: blank(fields.rejectionReason),
      updatedAt: new Date(),
    };

    const clearable = [
      "doingBusinessAs",
      "businessRegistrationNumber",
      "rejectionReason",
      "blockedReason",
      "telnyxRequestId",
      "telnyxResourceId",
      "submittedAt",
      "verifiedAt",
    ] as const;

    const unset: Record<string, ""> = {
      smsEnabled: "",
      privacyPageId: "",
      termsPageId: "",
    };

    for (const key of clearable) {
      if (next[key] == null) {
        delete next[key];
        unset[key] = "";
      }
    }

    await db
      .collection<SmsRegistrationRecord>(SMS_REGISTRATIONS_COLLECTION_NAME)
      .updateOne(
        { organizationId: record.organizationId },
        {
          $set: next,
          ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
        },
        { upsert: true },
      );

    return next;
  }

  public async findByRequestId(
    requestId: string,
  ): Promise<SmsRegistrationRecord | null> {
    const db = await getDbConnection();
    return db
      .collection<SmsRegistrationRecord>(SMS_REGISTRATIONS_COLLECTION_NAME)
      .findOne({
        $or: [{ telnyxRequestId: requestId }, { telnyxResourceId: requestId }],
      });
  }

  public async listPoolNumbers(): Promise<string[]> {
    const db = await getDbConnection();
    const rows = await db
      .collection<SmsPoolNumberRecord>(SMS_POOL_NUMBERS_COLLECTION_NAME)
      .find({})
      .sort({ phoneNumber: 1 })
      .toArray();
    return rows
      .map((row) => row.phoneNumber?.trim())
      .filter((phone): phone is string => Boolean(phone));
  }

  public async getProfileNumber(
    phoneNumber: string,
  ): Promise<SmsProfileNumberRecord | null> {
    const db = await getDbConnection();
    return db
      .collection<SmsProfileNumberRecord>(SMS_PROFILE_NUMBERS_COLLECTION_NAME)
      .findOne({ phoneNumber });
  }

  public async getAssignedProfileNumber(
    organizationId: string,
  ): Promise<SmsProfileNumberRecord | null> {
    const db = await getDbConnection();
    return db
      .collection<SmsProfileNumberRecord>(SMS_PROFILE_NUMBERS_COLLECTION_NAME)
      .findOne({ organizationId, status: "assigned" });
  }

  public async claimReleasedProfileNumber(
    organizationId: string,
  ): Promise<SmsProfileNumberRecord | null> {
    const db = await getDbConnection();
    return db
      .collection<SmsProfileNumberRecord>(SMS_PROFILE_NUMBERS_COLLECTION_NAME)
      .findOneAndUpdate(
        { status: "released" },
        {
          $set: { status: "assigned", organizationId },
          $unset: { releasedAt: "" },
        },
        { sort: { phoneNumber: 1 }, returnDocument: "after" },
      );
  }

  public async insertAssignedProfileNumber(input: {
    phoneNumber: string;
    telnyxId?: string;
    organizationId: string;
  }): Promise<void> {
    const db = await getDbConnection();
    await db
      .collection<SmsProfileNumberRecord>(SMS_PROFILE_NUMBERS_COLLECTION_NAME)
      .insertOne({
        phoneNumber: input.phoneNumber,
        ...(input.telnyxId ? { telnyxId: input.telnyxId } : {}),
        organizationId: input.organizationId,
        status: "assigned",
        createdAt: new Date(),
      });
  }

  public async releaseOrganizationNumber(
    organizationId: string,
  ): Promise<void> {
    const db = await getDbConnection();
    const now = new Date();
    await db
      .collection<SmsProfileNumberRecord>(SMS_PROFILE_NUMBERS_COLLECTION_NAME)
      .updateMany(
        { organizationId, status: "assigned" },
        {
          $set: { status: "released", releasedAt: now },
          $unset: { organizationId: "" },
        },
      );
    await db
      .collection<SmsRegistrationRecord>(SMS_REGISTRATIONS_COLLECTION_NAME)
      .updateOne(
        { organizationId },
        {
          $set: { enabled: false, status: "draft", updatedAt: now },
          $unset: {
            telnyxRequestId: "",
            telnyxResourceId: "",
            rejectionReason: "",
            blockedReason: "",
            verifiedAt: "",
            submittedAt: "",
          },
        },
      );
  }
}
