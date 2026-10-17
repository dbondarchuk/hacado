import { getDbConnection } from "../database";
import { SMS_CONSENT_TEXT_VERSION } from "./compliance";

export const SMS_CONSENTS_COLLECTION_NAME = "sms-consents";
export const SMS_OPT_OUTS_COLLECTION_NAME = "sms-opt-outs";
export const SMS_SENDS_COLLECTION_NAME = "sms-sends";

export type SmsConsentSource = "web_form" | "owner_attested";

export type SmsConsentRecord = {
  organizationId: string;
  phone: string;
  consented: boolean;
  source: SmsConsentSource;
  textVersion: string;
  createdAt: Date;
  ip?: string;
};

export type SmsOptOutRecord = {
  phone: string;
  createdAt: Date;
  source: "stop" | "telnyx_40300";
};

export type SmsSendStatus = "accepted" | "delivered" | "failed";

export type SmsSendRecord = {
  organizationId: string;
  idempotencyKey: string;
  phone: string;
  participantType: "customer" | "member";
  appointmentId?: string;
  customerId?: string;
  appId?: string;
  data?: string;
  status: SmsSendStatus;
  textId?: string;
  errorCode?: string;
  createdAt: Date;
  updatedAt: Date;
};

export class SmsStore {
  public async recordConsent(input: {
    organizationId: string;
    phone: string;
    consented: boolean;
    source: SmsConsentSource;
    ip?: string;
    textVersion?: string;
  }): Promise<void> {
    const db = await getDbConnection();
    const record: SmsConsentRecord = {
      organizationId: input.organizationId,
      phone: input.phone,
      consented: input.consented,
      source: input.source,
      textVersion: input.textVersion ?? SMS_CONSENT_TEXT_VERSION,
      createdAt: new Date(),
      ...(input.ip ? { ip: input.ip } : {}),
    };
    await db
      .collection<SmsConsentRecord>(SMS_CONSENTS_COLLECTION_NAME)
      .insertOne(record);
  }

  public async latestConsent(
    organizationId: string,
    phone: string,
  ): Promise<boolean> {
    const db = await getDbConnection();
    const record = await db
      .collection<SmsConsentRecord>(SMS_CONSENTS_COLLECTION_NAME)
      .find({ organizationId, phone })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();
    return record?.consented === true;
  }

  public async hasAnyConsent(phone: string): Promise<boolean> {
    const db = await getDbConnection();
    const record = await db
      .collection<SmsConsentRecord>(SMS_CONSENTS_COLLECTION_NAME)
      .findOne({ phone, consented: true });
    return Boolean(record);
  }

  public async isOptedOut(phone: string): Promise<boolean> {
    const db = await getDbConnection();
    const record = await db
      .collection<SmsOptOutRecord>(SMS_OPT_OUTS_COLLECTION_NAME)
      .findOne({ phone });
    return Boolean(record);
  }

  public async optOut(
    phone: string,
    source: SmsOptOutRecord["source"],
  ): Promise<void> {
    const db = await getDbConnection();
    await db
      .collection<SmsOptOutRecord>(SMS_OPT_OUTS_COLLECTION_NAME)
      .updateOne(
        { phone },
        { $setOnInsert: { phone, createdAt: new Date(), source } },
        { upsert: true },
      );
  }

  public async clearOptOut(phone: string): Promise<void> {
    const db = await getDbConnection();
    await db
      .collection<SmsOptOutRecord>(SMS_OPT_OUTS_COLLECTION_NAME)
      .deleteOne({ phone });
  }

  public async findSend(idempotencyKey: string): Promise<SmsSendRecord | null> {
    const db = await getDbConnection();
    return db
      .collection<SmsSendRecord>(SMS_SENDS_COLLECTION_NAME)
      .findOne({ idempotencyKey });
  }

  public async hasAcceptedCustomerSend(
    organizationId: string,
    phone: string,
  ): Promise<boolean> {
    const db = await getDbConnection();
    const record = await db
      .collection<SmsSendRecord>(SMS_SENDS_COLLECTION_NAME)
      .findOne({
        organizationId,
        phone,
        participantType: "customer",
        status: { $in: ["accepted", "delivered"] },
      });
    return Boolean(record);
  }

  public async recordAccepted(input: {
    organizationId: string;
    idempotencyKey: string;
    phone: string;
    participantType: "customer" | "member";
    appointmentId?: string;
    customerId?: string;
    appId?: string;
    data?: string;
    textId?: string;
  }): Promise<void> {
    const db = await getDbConnection();
    const now = new Date();
    await db.collection<SmsSendRecord>(SMS_SENDS_COLLECTION_NAME).updateOne(
      { idempotencyKey: input.idempotencyKey },
      {
        $setOnInsert: {
          organizationId: input.organizationId,
          idempotencyKey: input.idempotencyKey,
          phone: input.phone,
          participantType: input.participantType,
          appointmentId: input.appointmentId,
          customerId: input.customerId,
          appId: input.appId,
          data: input.data,
          createdAt: now,
        },
        $set: {
          status: "accepted",
          textId: input.textId,
          updatedAt: now,
        },
      },
      { upsert: true },
    );
  }

  public async updateStatusByTextId(
    textId: string,
    status: SmsSendStatus,
    errorCode?: string,
  ): Promise<SmsSendRecord | null> {
    const db = await getDbConnection();
    const updated = await db
      .collection<SmsSendRecord>(SMS_SENDS_COLLECTION_NAME)
      .findOneAndUpdate(
        { textId },
        {
          $set: {
            status,
            updatedAt: new Date(),
            ...(errorCode ? { errorCode } : {}),
          },
        },
        { returnDocument: "after" },
      );
    return updated;
  }

  public async latestConsentByPhones(
    organizationId: string,
    phones: string[],
  ): Promise<Map<string, boolean>> {
    const unique = [...new Set(phones)];
    if (unique.length === 0) {
      return new Map();
    }

    const db = await getDbConnection();
    const records = await db
      .collection<SmsConsentRecord>(SMS_CONSENTS_COLLECTION_NAME)
      .aggregate<{ _id: string; consented?: boolean }>([
        { $match: { organizationId, phone: { $in: unique } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$phone", consented: { $first: "$consented" } } },
      ])
      .toArray();

    return new Map(
      records.map((record) => [record._id, record.consented === true]),
    );
  }

  public async optedOutPhones(phones: string[]): Promise<Set<string>> {
    const unique = [...new Set(phones)];
    if (unique.length === 0) {
      return new Set();
    }

    const db = await getDbConnection();
    const records = await db
      .collection<SmsOptOutRecord>(SMS_OPT_OUTS_COLLECTION_NAME)
      .find({ phone: { $in: unique } })
      .project<{ phone: string }>({ phone: 1 })
      .toArray();

    return new Set(records.map((record) => record.phone));
  }

  public async findLatestSendByPhone(
    phone: string,
  ): Promise<SmsSendRecord | null> {
    const db = await getDbConnection();
    return db
      .collection<SmsSendRecord>(SMS_SENDS_COLLECTION_NAME)
      .find({ phone })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();
  }
}
