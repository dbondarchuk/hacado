const SMS_PROFILE_NUMBERS_COLLECTION_NAME = "sms-profile-numbers";

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
   * Dedicated toll-free numbers on the client messaging profile.
   * status is "assigned" or "released". Released numbers are reused
   * before a new number is ordered.
   * @param db {import('mongodb').Db}
   */
  async up(db) {
    const numbers = await ensureCollection(
      db,
      SMS_PROFILE_NUMBERS_COLLECTION_NAME,
    );
    await ensureIndex(
      numbers,
      { phoneNumber: 1 },
      { unique: true, name: "phoneNumber_1" },
    );
    await ensureIndex(
      numbers,
      { organizationId: 1 },
      { sparse: true, name: "organizationId_1" },
    );
    await ensureIndex(numbers, { status: 1 }, { name: "status_1" });
  },

  /**
   * @param db {import('mongodb').Db}
   */
  async down(db) {
    const numbers = db.collection(SMS_PROFILE_NUMBERS_COLLECTION_NAME);
    await dropIndexByKeys(numbers, { phoneNumber: 1 });
    await dropIndexByKeys(numbers, { organizationId: 1 });
    await dropIndexByKeys(numbers, { status: 1 });
  },
};
