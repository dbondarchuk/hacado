module.exports = {
  /**
   * Backfill `general.industry` to `"other"` for organizations that do not
   * have an industry set yet.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    const configuration = db.collection("configuration");

    const result = await configuration.updateMany(
      {
        key: "general",
        $or: [
          { "value.industry": { $exists: false } },
          { "value.industry": null },
          { "value.industry": "" },
        ],
      },
      { $set: { "value.industry": "other" } },
    );

    console.log(
      `Backfilled general.industry=other on ${result.modifiedCount} configuration(s)`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db) {
    const configuration = db.collection("configuration");

    await configuration.updateMany(
      { key: "general", "value.industry": "other" },
      { $unset: { "value.industry": "" } },
    );
  },
};
