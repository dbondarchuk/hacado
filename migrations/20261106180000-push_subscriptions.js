const PUSH_SUBSCRIPTIONS_COLLECTION_NAME = "push-subscriptions";

const ensureCollection = async (db, name) => {
  const collections = await db.listCollections({ name }).toArray();
  return collections.length > 0
    ? db.collection(name)
    : await db.createCollection(name);
};

const sameKeys = (left, right) =>
  JSON.stringify(left) === JSON.stringify(right);

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
    const collection = await ensureCollection(
      db,
      PUSH_SUBSCRIPTIONS_COLLECTION_NAME,
    );

    await ensureIndex(
      collection,
      { endpoint: 1 },
      { unique: true, name: "endpoint_1" },
    );

    await ensureIndex(
      collection,
      { organizationId: 1, memberId: 1 },
      { name: "organizationId_1_memberId_1" },
    );
  },

  /**
   * @param db {import('mongodb').Db}
   */
  async down(db) {
    const collection = db.collection(PUSH_SUBSCRIPTIONS_COLLECTION_NAME);
    await dropIndexByKeys(collection, { endpoint: 1 });
    await dropIndexByKeys(collection, { organizationId: 1, memberId: 1 });
  },
};
