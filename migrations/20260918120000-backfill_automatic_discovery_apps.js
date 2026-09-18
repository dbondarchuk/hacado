const { ObjectId } = require("mongodb");

const APP_NAMES = ["automatic-structured-data", "automatic-ai-discovery"];

module.exports = {
  /**
   * Auto-install Automatic Structured Data and Automatic AI Discovery for every
   * organization that does not already have them.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    const orgs = await db
      .collection("organizations")
      .find({}, { projection: { _id: 1 } })
      .toArray();

    const connectedApps = db.collection("connected-apps");
    const members = db.collection("members");

    let installed = 0;
    let skipped = 0;

    for (const org of orgs) {
      const organizationId = String(org._id);

      const admin = await members.findOne(
        {
          organizationId,
          $or: [{ role: "owner" }, { role: "admin" }],
        },
        { projection: { _id: 1 } },
      );

      const anyMember =
        admin ||
        (await members.findOne({ organizationId }, { projection: { _id: 1 } }));

      if (!anyMember) {
        skipped += APP_NAMES.length;
        console.warn(
          `Skipping org ${organizationId}: no member to own connected apps`,
        );

        continue;
      }

      const memberId = String(anyMember._id);

      for (const name of APP_NAMES) {
        const existing = await connectedApps.findOne({
          organizationId,
          name,
        });

        if (existing) {
          skipped++;
          continue;
        }

        await connectedApps.insertOne({
          _id: new ObjectId().toString(),
          organizationId,
          name,
          memberId,
          status: "connected",
          statusText: "apps.common.statusText.installed",
        });

        installed++;
      }
    }

    console.log(
      `Automatic discovery apps backfill: installed=${installed} skipped=${skipped}`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db) {
    const result = await db.collection("connected-apps").deleteMany({
      name: { $in: APP_NAMES },
      statusText: "apps.common.statusText.installed",
    });

    console.log(
      `Automatic discovery apps backfill down: deleted=${result.deletedCount}`,
    );
  },
};
