module.exports = {
  /**
   * Promote unmatched synced payments that already have an appointment to
   * matched. Assign used to attach the appointment without updating status,
   * which hid Confirm and left the row stuck in the review queue.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    const syncedPayments = db.collection("synced-payments");

    const result = await syncedPayments.updateMany(
      {
        status: "unmatched",
        appointmentId: { $exists: true, $nin: [null, ""] },
      },
      { $set: { status: "matched" } },
    );

    console.log(
      `Promoted ${result.modifiedCount} unmatched assigned synced payment(s) to matched (${result.matchedCount} matched).`,
    );
  },

  /**
   * Not safely reversible: unmatched with an appointment is the bug state.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down() {
    console.log(
      "Skipping down: unmatched assigned synced payment backfill is not reversible.",
    );
  },
};
