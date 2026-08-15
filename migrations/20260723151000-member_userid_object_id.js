const { ObjectId } = require("mongodb");

module.exports = {
  /**
   * Convert `members.userId` from string to ObjectId so Better Auth Mongo
   * adapter lookups (e.g. invite-member findMemberByOrgId) succeed.
   *
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async up(db) {
    const members = db.collection("members");
    const cursor = members.find({
      userId: { $type: "string" },
    });

    let converted = 0;
    let skipped = 0;

    while (await cursor.hasNext()) {
      const member = await cursor.next();
      if (!member) continue;

      const asString = String(member.userId);
      if (!ObjectId.isValid(asString) || asString.length !== 24) {
        skipped++;
        continue;
      }

      await members.updateOne(
        { _id: member._id },
        { $set: { userId: new ObjectId(asString) } },
      );
      converted++;
    }

    console.log(
      `Member userId ObjectIds: converted=${converted}, skipped=${skipped}`,
    );
  },

  async down() {
    // Irreversible without knowing callers; hex string form is recoverable
    // via String(objectId) if needed.
  },
};
