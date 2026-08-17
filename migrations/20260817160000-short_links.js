const SHORT_LINKS_COLLECTION_NAME = "short-links";

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async up(db) {
    const collections = await db
      .listCollections({ name: SHORT_LINKS_COLLECTION_NAME })
      .toArray();

    const collection =
      collections.length > 0
        ? db.collection(SHORT_LINKS_COLLECTION_NAME)
        : await db.createCollection(SHORT_LINKS_COLLECTION_NAME);

    const indexes = {
      code_1: { code: 1 },
      url_1: { url: 1 },
    };

    for (const [name, index] of Object.entries(indexes)) {
      if (await collection.indexExists(name)) {
        continue;
      }
      await collection.createIndex(index, { name, unique: true });
      console.log(
        `Created unique index ${name} on ${SHORT_LINKS_COLLECTION_NAME}`,
      );
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async down(db) {
    const collection = db.collection(SHORT_LINKS_COLLECTION_NAME);
    const indexNames = ["code_1", "url_1"];

    for (const name of indexNames) {
      if (await collection.indexExists(name)) {
        await collection.dropIndex(name);
        console.log(`Dropped index ${name}`);
      }
    }
  },
};
