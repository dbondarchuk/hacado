const OLD_APP_NAME = "appointment-notifications";
const NEW_APP_NAME = "appointment-reminders";
const OLD_COLLECTION = "appointment-notifications";
const NEW_COLLECTION = "appointment-reminders";

const OLD_PREFIX = `app_${OLD_APP_NAME}_admin`;
const NEW_PREFIX = `app_${NEW_APP_NAME}_admin`;

const renameCollectionIfNeeded = async (db, fromName, toName) => {
  const hasFrom = await db.listCollections({ name: fromName }).hasNext();
  const hasTo = await db.listCollections({ name: toName }).hasNext();

  if (!hasFrom) return;

  if (hasTo) {
    console.warn(
      `Both '${fromName}' and '${toName}' exist. Skipping collection rename.`,
    );

    return;
  }

  await db.collection(fromName).rename(toName);
};

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   */
  async up(db, client) {
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        await renameCollectionIfNeeded(db, OLD_COLLECTION, NEW_COLLECTION);

        const connectedApps = db.collection("connected-apps");
        const logs = db.collection("communication-logs");

        await connectedApps.updateMany(
          { name: OLD_APP_NAME },
          {
            $set: {
              name: NEW_APP_NAME,
              statusText: `${NEW_PREFIX}.statusText.successfully_set_up`,
            },
          },
        );

        await connectedApps.updateMany(
          {
            "statusText.key": `${OLD_PREFIX}.statusText.successfully_set_up`,
          },
          {
            $set: {
              "statusText.key": `${NEW_PREFIX}.statusText.successfully_set_up`,
            },
          },
        );

        await connectedApps.updateMany(
          { statusText: `${OLD_PREFIX}.statusText.successfully_set_up` },
          {
            $set: {
              statusText: `${NEW_PREFIX}.statusText.successfully_set_up`,
            },
          },
        );

        await logs.updateMany(
          { "handledBy.key": `${OLD_PREFIX}.handler` },
          { $set: { "handledBy.key": `${NEW_PREFIX}.handler` } },
        );

        await logs.updateMany(
          { handledBy: `${OLD_PREFIX}.handler` },
          { $set: { handledBy: `${NEW_PREFIX}.handler` } },
        );
      });
    } finally {
      await session.endSession();
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   */
  async down(db, client) {
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        await renameCollectionIfNeeded(db, NEW_COLLECTION, OLD_COLLECTION);

        const connectedApps = db.collection("connected-apps");
        const logs = db.collection("communication-logs");

        await connectedApps.updateMany(
          { name: NEW_APP_NAME },
          {
            $set: {
              name: OLD_APP_NAME,
              statusText: `${OLD_PREFIX}.statusText.successfully_set_up`,
            },
          },
        );

        await connectedApps.updateMany(
          {
            "statusText.key": `${NEW_PREFIX}.statusText.successfully_set_up`,
          },
          {
            $set: {
              "statusText.key": `${OLD_PREFIX}.statusText.successfully_set_up`,
            },
          },
        );

        await connectedApps.updateMany(
          { statusText: `${NEW_PREFIX}.statusText.successfully_set_up` },
          {
            $set: {
              statusText: `${OLD_PREFIX}.statusText.successfully_set_up`,
            },
          },
        );

        await logs.updateMany(
          { "handledBy.key": `${NEW_PREFIX}.handler` },
          { $set: { "handledBy.key": `${OLD_PREFIX}.handler` } },
        );

        await logs.updateMany(
          { handledBy: `${NEW_PREFIX}.handler` },
          { $set: { handledBy: `${OLD_PREFIX}.handler` } },
        );
      });
    } finally {
      await session.endSession();
    }
  },
};
