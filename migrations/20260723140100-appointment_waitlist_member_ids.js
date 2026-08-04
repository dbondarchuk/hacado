module.exports = {
  /**
   * Backfill appointments.memberId and waitlist.memberId to each org's owner member.
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

    let appointmentsUpdated = 0;
    let waitlistUpdated = 0;

    const missingMemberFilter = {
      $or: [
        { memberId: { $exists: false } },
        { memberId: null },
        { memberId: "" },
      ],
    };

    for (const [orgId, memberId] of ownerByOrg) {
      const appt = await db.collection("appointments").updateMany(
        { organizationId: orgId, ...missingMemberFilter },
        { $set: { memberId } },
      );
      appointmentsUpdated += appt.modifiedCount;

      const waitlistExists = (
        await db.listCollections({ name: "waitlist" }).toArray()
      ).length;
      if (waitlistExists) {
        const wl = await db.collection("waitlist").updateMany(
          { organizationId: orgId, ...missingMemberFilter },
          { $set: { memberId } },
        );
        waitlistUpdated += wl.modifiedCount;
      }
    }

    await db.collection("appointments").createIndexes([
      {
        key: { organizationId: 1, memberId: 1, dateTime: 1 },
        name: "org_member_datetime",
      },
      {
        key: { organizationId: 1, memberId: 1, status: 1 },
        name: "org_member_status",
      },
    ]);

    console.log(
      `Appointment/waitlist memberIds: appointments=${appointmentsUpdated}, waitlist=${waitlistUpdated}`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down() {
    console.log(
      "Skipping down: appointment/waitlist memberId backfill is not reversible.",
    );
  },
};
