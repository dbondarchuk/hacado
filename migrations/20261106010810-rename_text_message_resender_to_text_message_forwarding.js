const OLD_APP_NAME = "text-message-resender";
const NEW_APP_NAME = "text-message-forwarding";

const OLD_PREFIX = `app_${OLD_APP_NAME}_admin`;
const NEW_PREFIX = `app_${NEW_APP_NAME}_admin`;

const HANDLED_BY_KEYS = [
  "handlers.resendToCustomer",
  "handlers.processUserReply",
  "handlers.resendToUser",
  "handlers.processCustomerReply",
];

const STATUS_TEXT_KEYS = [
  "statusText.successfully_set_up",
  "statusText.error_processing_configuration",
  "statusText.error_processing_reply",
];

const replaceHandledBy = async (logs, fromPrefix, toPrefix) => {
  for (const suffix of HANDLED_BY_KEYS) {
    const fromKey = `${fromPrefix}.${suffix}`;
    const toKey = `${toPrefix}.${suffix}`;

    await logs.updateMany(
      { handledBy: fromKey },
      { $set: { handledBy: toKey } },
    );

    await logs.updateMany(
      { "handledBy.key": fromKey },
      { $set: { "handledBy.key": toKey } },
    );
  }
};

const replaceStatusText = async (connectedApps, fromPrefix, toPrefix) => {
  for (const suffix of STATUS_TEXT_KEYS) {
    const fromKey = `${fromPrefix}.${suffix}`;
    const toKey = `${toPrefix}.${suffix}`;

    await connectedApps.updateMany(
      { statusText: fromKey },
      { $set: { statusText: toKey } },
    );

    await connectedApps.updateMany(
      { "statusText.key": fromKey },
      { $set: { "statusText.key": toKey } },
    );
  }
};

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const connectedApps = db.collection("connected-apps");
        const logs = db.collection("communication-logs");

        await connectedApps.updateMany(
          { name: OLD_APP_NAME },
          { $set: { name: NEW_APP_NAME } },
        );

        await replaceStatusText(connectedApps, OLD_PREFIX, NEW_PREFIX);
        await replaceHandledBy(logs, OLD_PREFIX, NEW_PREFIX);
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
        const connectedApps = db.collection("connected-apps");
        const logs = db.collection("communication-logs");

        await connectedApps.updateMany(
          { name: NEW_APP_NAME },
          { $set: { name: OLD_APP_NAME } },
        );

        await replaceStatusText(connectedApps, NEW_PREFIX, OLD_PREFIX);
        await replaceHandledBy(logs, NEW_PREFIX, OLD_PREFIX);
      });
    } finally {
      await session.endSession();
    }
  },
};
