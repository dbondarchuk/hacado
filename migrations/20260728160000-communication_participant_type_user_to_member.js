/**
 * Rename communication-logs.participantType from legacy `user` to `member`,
 * and backfill missing memberId to each org's owner member.
 */
module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    const typeResult = await db.collection("communication-logs").updateMany(
      { participantType: "user" },
      { $set: { participantType: "member" } },
    );

    console.log(
      `communication-logs participantType user→member: matched=${typeResult.matchedCount} modified=${typeResult.modifiedCount}`,
    );

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

    let memberIdsUpdated = 0;
    for (const [orgId, memberId] of ownerByOrg) {
      const result = await db.collection("communication-logs").updateMany(
        { organizationId: orgId, ...missingMemberFilter },
        { $set: { memberId } },
      );
      memberIdsUpdated += result.modifiedCount;
    }

    await db.collection("communication-logs").createIndexes([
      {
        key: { organizationId: 1, memberId: 1, dateTime: -1 },
        name: "org_member_datetime",
      },
    ]);

    console.log(
      `communication-logs memberId backfill (owner): modified=${memberIdsUpdated}`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db) {
    const result = await db.collection("communication-logs").updateMany(
      { participantType: "member" },
      { $set: { participantType: "user" } },
    );

    console.log(
      `communication-logs participantType member→user: matched=${result.matchedCount} modified=${result.modifiedCount}`,
    );
    console.log(
      "Skipping down: communication-logs memberId backfill is not reversible.",
    );
  },
};
