module.exports = {
  /**
   * Convert legacy `general.address` string values into PostalAddress objects
   * (`{ streetAddress }`) for JSON-LD / structured address support.
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
        const cursor = configuration.find(
          { key: "general", "value.address": { $type: "string" } },
          { session },
        );

        let converted = 0;
        let cleared = 0;

        for await (const doc of cursor) {
          const raw = doc.value?.address;
          const streetAddress =
            typeof raw === "string" ? raw.trim() : "";

          if (streetAddress) {
            await configuration.updateOne(
              { _id: doc._id },
              {
                $set: {
                  "value.address": { streetAddress },
                },
              },
              { session },
            );
            converted++;
          } else {
            await configuration.updateOne(
              { _id: doc._id },
              { $unset: { "value.address": "" } },
              { session },
            );
            cleared++;
          }
        }

        console.log(
          `Postal address migration: converted=${converted} cleared=${cleared}`,
        );
      });
    } finally {
      await session.endSession();
    }
  },

  /**
   * Flatten PostalAddress objects that only have `streetAddress` back to a string.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const configuration = db.collection("configuration");
        const cursor = configuration.find(
          { key: "general", "value.address": { $type: "object" } },
          { session },
        );

        for await (const doc of cursor) {
          const address = doc.value?.address;
          if (!address || typeof address !== "object") continue;

          const streetAddress =
            typeof address.streetAddress === "string"
              ? address.streetAddress.trim()
              : "";

          if (streetAddress) {
            await configuration.updateOne(
              { _id: doc._id },
              { $set: { "value.address": streetAddress } },
              { session },
            );
          } else {
            await configuration.updateOne(
              { _id: doc._id },
              { $unset: { "value.address": "" } },
              { session },
            );
          }
        }
      });
    } finally {
      await session.endSession();
    }
  },
};
