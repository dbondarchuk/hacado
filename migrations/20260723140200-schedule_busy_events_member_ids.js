module.exports = {
  /**
   * Stamp weekly-schedules / busy-events with owner memberId and add compound indexes.
   * Depends on 20260723140000-team_members_and_user_slots.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    const owners = await db
      .collection("members")
      .find({ role: "owner" })
      .toArray();
    const ownerByOrg = new Map(
      owners.map((m) => [String(m.organizationId), String(m._id)]),
    );

    const missingMemberFilter = {
      $or: [
        { memberId: { $exists: false } },
        { memberId: null },
        { memberId: "" },
      ],
    };

    async function migrateCollection(name) {
      const exists = (await db.listCollections({ name }).toArray()).length > 0;
      if (!exists) return 0;

      let updated = 0;
      for (const [orgId, memberId] of ownerByOrg) {
        const res = await db.collection(name).updateMany(
          { organizationId: orgId, ...missingMemberFilter },
          { $set: { memberId } },
        );
        updated += res.modifiedCount;
      }

      try {
        await db.collection(name).createIndex(
          { organizationId: 1, appId: 1, memberId: 1, week: 1 },
          { name: "org_app_member_week", unique: true },
        );
      } catch (err) {
        console.warn(`Index create on ${name}:`, err.message);
      }

      return updated;
    }

    const weekly = await migrateCollection("weekly-schedules");
    const busy = await migrateCollection("busy-events");

    console.log(
      `Schedule memberIds: weekly-schedules=${weekly}, busy-events=${busy}`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down() {
    console.log(
      "Skipping down: schedule/busy-events memberId backfill is not reversible.",
    );
  },
};
