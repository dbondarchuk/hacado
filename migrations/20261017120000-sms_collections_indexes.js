const SMS_CONSENTS_COLLECTION_NAME = "sms-consents";
const SMS_OPT_OUTS_COLLECTION_NAME = "sms-opt-outs";
const SMS_SENDS_COLLECTION_NAME = "sms-sends";

const ensureCollection = async (db, name) => {
  const collections = await db.listCollections({ name }).toArray();
  return collections.length > 0
    ? db.collection(name)
    : await db.createCollection(name);
};

const sameKeys = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const hasIndex = async (collection, keys) => {
  const indexes = await collection.indexes();
  return indexes.some((index) => sameKeys(index.key, keys));
};

const ensureIndex = async (collection, keys, options) => {
  if (await hasIndex(collection, keys)) return;
  await collection.createIndex(keys, options);
};

const dropIndexByKeys = async (collection, keys) => {
  const indexes = await collection.indexes();
  const match = indexes.find((index) => sameKeys(index.key, keys));
  if (match?.name) {
    await collection.dropIndex(match.name);
  }
};

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   */
  async up(db) {
    const sends = await ensureCollection(db, SMS_SENDS_COLLECTION_NAME);
    const optOuts = await ensureCollection(db, SMS_OPT_OUTS_COLLECTION_NAME);
    const consents = await ensureCollection(db, SMS_CONSENTS_COLLECTION_NAME);

    await ensureIndex(
      sends,
      { idempotencyKey: 1 },
      { unique: true, name: "idempotencyKey_1" },
    );
    await ensureIndex(sends, { textId: 1 }, { name: "textId_1" });
    await ensureIndex(
      sends,
      { organizationId: 1, phone: 1, participantType: 1, status: 1 },
      { name: "organizationId_1_phone_1_participantType_1_status_1" },
    );
    await ensureIndex(
      optOuts,
      { phone: 1 },
      { unique: true, name: "phone_1" },
    );
    await ensureIndex(
      consents,
      { organizationId: 1, phone: 1, createdAt: -1 },
      { name: "organizationId_1_phone_1_createdAt_-1" },
    );
  },

  /**
   * @param db {import('mongodb').Db}
   */
  async down(db) {
    const sends = db.collection(SMS_SENDS_COLLECTION_NAME);
    const optOuts = db.collection(SMS_OPT_OUTS_COLLECTION_NAME);
    const consents = db.collection(SMS_CONSENTS_COLLECTION_NAME);

    await dropIndexByKeys(sends, { idempotencyKey: 1 });
    await dropIndexByKeys(sends, { textId: 1 });
    await dropIndexByKeys(sends, {
      organizationId: 1,
      phone: 1,
      participantType: 1,
      status: 1,
    });
    await dropIndexByKeys(optOuts, { phone: 1 });
    await dropIndexByKeys(consents, {
      organizationId: 1,
      phone: 1,
      createdAt: -1,
    });
  },
};
