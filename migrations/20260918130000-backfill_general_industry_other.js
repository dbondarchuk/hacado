module.exports = {
  /**
   * Backfill `general.industry` to `"other"` for organizations that do not
   * have an industry set yet.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
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
          { session },
        );

        console.log(
          `Backfilled general.industry=other on ${result.modifiedCount} configuration(s)`,
        );
      });
    } finally {
      await session.endSession();
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const configuration = db.collection("configuration");

        await configuration.updateMany(
          { key: "general", "value.industry": "other" },
          { $unset: { "value.industry": "" } },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
  },
};
