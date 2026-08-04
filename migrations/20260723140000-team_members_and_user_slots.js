const { ObjectId } = require("mongodb");

module.exports = {
  /**
   * Backfill Better Auth `members` for every organization and seed userSlots
   * on organization documents. Maps legacy `viewer` → `staff`.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    const members = db.collection("members");
    const users = db.collection("users");
    const organizations = db.collection("organizations");

    await members.createIndexes([
      {
        key: { organizationId: 1, userId: 1 },
        unique: true,
        name: "org_user_unique",
      },
      {
        key: { organizationId: 1, status: 1, role: 1 },
        name: "org_status_role",
      },
      {
        key: { organizationId: 1, status: 1, createdAt: 1 },
        name: "org_status_created",
      },
      { key: { userId: 1 }, name: "userId" },
    ]);

    const orgs = await organizations.find({}).toArray();
    let created = 0;
    let skipped = 0;
    let orgsUpdated = 0;

    for (const org of orgs) {
      const orgId = String(org._id);
      const orgUsers = await users
        .find({ organizationId: orgId })
        .sort({ createdAt: 1 })
        .toArray();

      if (!orgUsers.length) {
        skipped++;
        continue;
      }

      const owner =
        orgUsers.find((u) => u.role === "owner") ||
        orgUsers.find((u) => u.role === "admin") ||
        orgUsers[0];

      for (const user of orgUsers) {
        const userId = String(user._id);
        const existing = await members.findOne({
          organizationId: orgId,
          userId,
        });
        if (existing) {
          skipped++;
          continue;
        }

        let role = user.role === "viewer" ? "staff" : user.role;
        if (!["owner", "admin", "coordinator", "staff"].includes(role)) {
          role =
            String(user._id) === String(owner._id) ? "owner" : "staff";
        }
        if (String(user._id) === String(owner._id)) role = "owner";

        await members.insertOne({
          _id: new ObjectId().toString(),
          organizationId: orgId,
          userId,
          role,
          createdAt: user.createdAt || new Date(),
          status: "active",
        });
        created++;

        if (user.role === "viewer") {
          await users.updateOne({ _id: user._id }, { $set: { role: "staff" } });
        }
      }

      if (
        org.availableUsers == null ||
        !org.userSlots ||
        org.userSlots.included == null
      ) {
        await organizations.updateOne(
          { _id: org._id },
          {
            $set: {
              userSlots: {
                included: org.userSlots?.included ?? 1,
                additional: org.userSlots?.additional ?? 0,
              },
              availableUsers:
                org.availableUsers ??
                (org.userSlots?.included ?? 1) +
                  (org.userSlots?.additional ?? 0),
              userSlotGrants: org.userSlotGrants ?? [],
              allowAdditionalUsers: org.allowAdditionalUsers ?? false,
            },
          },
        );
        orgsUpdated++;
      }
    }

    console.log(
      `Team members: created=${created}, skipped=${skipped}, orgsUpdated=${orgsUpdated}`,
    );
  },

  /**
   * Not safely reversible once invitations / role changes may have occurred.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down() {
    console.log(
      "Skipping down: team members / userSlots backfill is not reversible.",
    );
  },
};
