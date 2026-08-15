const USER_TARGET_APPS = new Set([
  "google-calendar",
  "outlook",
  "calendar-writer",
  "ics",
]);

module.exports = {
  /**
   * Backfill connected-apps.target (+ memberId for user-target apps).
   * Depends on 20260723140000-team_members_and_user_slots.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    const apps = await db
      .collection("connected-apps")
      .find({
        $or: [{ target: { $exists: false } }, { target: null }],
      })
      .toArray();

    let updated = 0;
    for (const app of apps) {
      const target = USER_TARGET_APPS.has(app.name) ? "user" : "company";
      /** @type {Record<string, string>} */
      const set = { target };
      if (target === "user" && app.userId && !app.memberId) {
        const member = await db.collection("members").findOne({
          organizationId: app.organizationId,
          userId: String(app.userId),
        });
        if (member) set.memberId = String(member._id);
      }

      await db
        .collection("connected-apps")
        .updateOne({ _id: app._id }, { $set: set });
      updated++;
    }

    console.log(`Connected app targets: updated=${updated}`);
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down() {
    console.log(
      "Skipping down: connected-apps target backfill is not reversible.",
    );
  },
};
