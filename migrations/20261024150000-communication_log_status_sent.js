/**
 * Logs written before statuses existed have no status field.
 * Outbound logs are sent. Inbound logs are received.
 */
module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async up(db) {
    const logs = db.collection("communication-logs");
    const missingStatus = {
      $or: [{ status: { $exists: false } }, { status: null }],
    };
    const inbound = await logs.updateMany(
      {
        direction: "inbound",
        $or: [...missingStatus.$or, { status: "sent" }],
      },
      { $set: { status: "received" } },
    );
    const outbound = await logs.updateMany(
      {
        direction: { $ne: "inbound" },
        ...missingStatus,
      },
      { $set: { status: "sent" } },
    );

    console.log(
      `communication-logs status backfill: inbound matched=${inbound.matchedCount} modified=${inbound.modifiedCount}; outbound matched=${outbound.matchedCount} modified=${outbound.modifiedCount}`,
    );
  },

  /**
   * Clears the backfilled status. Outbound logs that also store lifecycle
   * fields stay sent. Inbound replies are cleared back to no status.
   *
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async down(db) {
    const logs = db.collection("communication-logs");
    const outbound = await logs.updateMany(
      {
        direction: { $ne: "inbound" },
        status: "sent",
        providerMessageId: { $exists: false },
        reason: { $exists: false },
        retryable: { $exists: false },
        retriesDone: { $exists: false },
        retriesLeft: { $exists: false },
      },
      { $unset: { status: "" } },
    );
    const inbound = await logs.updateMany(
      {
        direction: "inbound",
        status: "received",
        providerMessageId: { $exists: false },
        reason: { $exists: false },
        retryable: { $exists: false },
        retriesDone: { $exists: false },
        retriesLeft: { $exists: false },
      },
      { $unset: { status: "" } },
    );

    console.log(
      `communication-logs status backfill reverted: outbound matched=${outbound.matchedCount} modified=${outbound.modifiedCount}; inbound matched=${inbound.matchedCount} modified=${inbound.modifiedCount}`,
    );
  },
};
