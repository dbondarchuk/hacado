const { ObjectId } = require("mongodb");

function toObjectId(value) {
  if (value instanceof ObjectId) return value;
  const asString = String(value);
  if (ObjectId.isValid(asString) && asString.length === 24) {
    return new ObjectId(asString);
  }
  return new ObjectId();
}

module.exports = {
  /**
   * Copy org-scoped profile fields from `users` onto `members`, ensure a
   * member row exists for every user with organizationId, convert string
   * member `_id` values to MongoDB ObjectId (Better Auth), then unset those
   * fields on users (auth identity only).
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    const members = db.collection("members");
    const users = db.collection("users");

    let membersCreated = 0;
    let membersUpdated = 0;
    let membersIdConverted = 0;
    let usersCleaned = 0;

    const profileKeys = [
      "name",
      "phone",
      "bio",
      "language",
      "image",
      "calendarSources",
      "role",
    ];

    const usersWithOrg = await users
      .find({
        organizationId: { $exists: true, $nin: [null, ""] },
      })
      .toArray();

    for (const user of usersWithOrg) {
      const userId = String(user._id);
      const organizationId = String(user.organizationId);

      let member = await members.findOne({ organizationId, userId });
      if (!member) {
        let role = user.role === "viewer" ? "staff" : user.role;
        if (!["owner", "admin", "coordinator", "staff"].includes(role)) {
          role = "staff";
        }

        await members.insertOne({
          _id: new ObjectId(),
          organizationId,
          userId,
          role,
          createdAt: user.createdAt || new Date(),
          status: "active",
          name: user.name || "",
          phone: user.phone || "",
          bio: user.bio ?? null,
          language: user.language || "en",
          image: user.image ?? null,
          calendarSources: user.calendarSources || [],
        });
        membersCreated++;
        continue;
      }

      const $set = {};
      for (const key of profileKeys) {
        if (key === "role") {
          if (
            user.role &&
            ["owner", "admin", "coordinator", "staff"].includes(user.role) &&
            !member.role
          ) {
            $set.role = user.role === "viewer" ? "staff" : user.role;
          }
          continue;
        }
        const memberValue = member[key];
        const userValue = user[key];
        const memberMissing =
          memberValue == null ||
          memberValue === "" ||
          (Array.isArray(memberValue) && memberValue.length === 0);
        if (memberMissing && userValue != null && userValue !== "") {
          $set[key] = userValue;
        }
      }

      if (Object.keys($set).length) {
        await members.updateOne({ _id: member._id }, { $set });
        membersUpdated++;
      }
    }

    // Also backfill any existing members whose profile is still only on users.
    const allMembers = await members.find({}).toArray();
    for (const member of allMembers) {
      let user = null;
      try {
        user = await users.findOne({ _id: new ObjectId(member.userId) });
      } catch {
        user = await users.findOne({ _id: member.userId });
      }
      if (!user) continue;

      const $set = {};
      for (const key of [
        "name",
        "phone",
        "bio",
        "language",
        "image",
        "calendarSources",
      ]) {
        const memberValue = member[key];
        const userValue = user[key];
        const memberMissing =
          memberValue == null ||
          memberValue === "" ||
          (Array.isArray(memberValue) && memberValue.length === 0);
        if (memberMissing && userValue != null && userValue !== "") {
          $set[key] = userValue;
        }
      }
      if (Object.keys($set).length) {
        await members.updateOne({ _id: member._id }, { $set });
        membersUpdated++;
      }
    }

    // Convert string member `_id` values to ObjectId (Better Auth / Mongo adapter).
    // Prior team migration inserted `_id: new ObjectId().toString()`.
    const stringIdMembers = await members
      .find({ _id: { $type: "string" } })
      .toArray();

    for (const member of stringIdMembers) {
      const oldId = member._id;
      const newId = toObjectId(oldId);
      const { _id, ...rest } = member;

      // Delete first: org_user_unique would reject insert-before-delete because
      // ObjectId and string _id are different documents with the same org+user.
      const existingObjectId = await members.findOne({ _id: newId });
      if (existingObjectId) {
        await members.deleteOne({ _id: oldId });
        membersIdConverted++;
      } else {
        await members.deleteOne({ _id: oldId });
        await members.insertOne({ _id: newId, ...rest });
        membersIdConverted++;
      }

      // Remap FK refs only when the string form changed (invalid/non-hex ids).
      if (String(newId) !== String(oldId)) {
        const collections = [
          "appointments",
          "waitlist",
          "weekly-schedules",
          "busy-events",
        ];
        for (const name of collections) {
          const exists = (await db.listCollections({ name }).toArray()).length;
          if (!exists) continue;
          await db
            .collection(name)
            .updateMany({ memberId: oldId }, { $set: { memberId: String(newId) } });
        }
      }
    }

    const unsetResult = await users.updateMany(
      {},
      {
        $unset: {
          organizationId: "",
          role: "",
          permissions: "",
          phone: "",
          bio: "",
          language: "",
          calendarSources: "",
        },
      },
    );
    usersCleaned = unsetResult.modifiedCount;

    console.log(
      `Member profile migration: created=${membersCreated}, updated=${membersUpdated}, idConverted=${membersIdConverted}, usersCleaned=${usersCleaned}`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down() {
    // Irreversible: profile fields were copied onto members; restoring users
    // would require guessing which member profile was canonical.
  },
};
