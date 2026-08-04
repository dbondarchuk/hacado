const { ObjectId } = require("mongodb");

/**
 * Backfill denormalized `members.email` from the linked auth `users` document.
 * Keeps appointment/waitlist/team queries from needing a users join for email.
 */
module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    const members = db.collection("members");
    const users = db.collection("users");

    const cursor = members.find({
      $or: [
        { email: { $exists: false } },
        { email: null },
        { email: "" },
      ],
    });

    let updated = 0;
    let skippedNoUser = 0;
    let skippedNoEmail = 0;

    while (await cursor.hasNext()) {
      const member = await cursor.next();
      if (!member?.userId) {
        skippedNoUser++;
        continue;
      }

      const userId = String(member.userId);
      let user = await users.findOne(
        { _id: userId },
        { projection: { email: 1 } },
      );
      if (!user && ObjectId.isValid(userId) && userId.length === 24) {
        user = await users.findOne(
          { _id: new ObjectId(userId) },
          { projection: { email: 1 } },
        );
      }

      if (!user) {
        skippedNoUser++;
        continue;
      }

      const email =
        typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
      if (!email) {
        skippedNoEmail++;
        continue;
      }

      await members.updateOne({ _id: member._id }, { $set: { email } });
      updated++;
    }

    console.log(
      `Backfilled members.email: updated=${updated}, skippedNoUser=${skippedNoUser}, skippedNoEmail=${skippedNoEmail}`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down() {
    console.log(
      "Skipping down: member email backfill is not reversible (would wipe emails set after migration).",
    );
  },
};
