const SMS_REGISTRATIONS_COLLECTION_NAME = "sms-registrations";
const SMS_POOL_NUMBERS_COLLECTION_NAME = "sms-pool-numbers";

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
   * Shared toll-free numbers live in sms-pool-numbers as
   * { phoneNumber: "+18005550100", createdAt }. Insert pool rows by hand
   * after buying the number in Telnyx and attaching it to the client profile.
   * @param db {import('mongodb').Db}
   */
  async up(db) {
    const registrations = await ensureCollection(
      db,
      SMS_REGISTRATIONS_COLLECTION_NAME,
    );
    const pool = await ensureCollection(db, SMS_POOL_NUMBERS_COLLECTION_NAME);

    await ensureIndex(
      registrations,
      { organizationId: 1 },
      { unique: true, name: "organizationId_1" },
    );
    await ensureIndex(
      registrations,
      { telnyxRequestId: 1 },
      { unique: true, sparse: true, name: "telnyxRequestId_1" },
    );
    await ensureIndex(
      registrations,
      { telnyxResourceId: 1 },
      { unique: true, sparse: true, name: "telnyxResourceId_1" },
    );
    await ensureIndex(
      pool,
      { phoneNumber: 1 },
      { unique: true, name: "phoneNumber_1" },
    );
  },

  /**
   * @param db {import('mongodb').Db}
   */
  async down(db) {
    const registrations = db.collection(SMS_REGISTRATIONS_COLLECTION_NAME);
    const pool = db.collection(SMS_POOL_NUMBERS_COLLECTION_NAME);

    await dropIndexByKeys(registrations, { organizationId: 1 });
    await dropIndexByKeys(registrations, { telnyxRequestId: 1 });
    await dropIndexByKeys(registrations, { telnyxResourceId: 1 });
    await dropIndexByKeys(pool, { phoneNumber: 1 });
  },
};
