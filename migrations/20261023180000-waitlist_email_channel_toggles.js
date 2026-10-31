module.exports = {
  /**
   * Store explicit email toggles for customer waitlist notifications.
   * A saved template means that email was being sent.
   *
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async up(db) {
    const connectedApps = db.collection("connected-apps");
    const cursor = connectedApps.find({
      name: "customer-waitlist-notifications",
    });
    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const data = doc?.data;
      if (!data || typeof data !== "object") continue;

      const $set = {};
      if (typeof data.customerNewEntryEmailEnabled !== "boolean") {
        $set["data.customerNewEntryEmailEnabled"] = Boolean(
          data.customerNewEntryTemplateId,
        );
      }

      if (typeof data.slotOpenedEmailEnabled !== "boolean") {
        $set["data.slotOpenedEmailEnabled"] = Boolean(
          data.notifyOnSlotOpened !== false && data.slotOpenedEmailTemplateId,
        );
      }

      if (Object.keys($set).length === 0) continue;

      await connectedApps.updateOne({ _id: doc._id }, { $set });
      updated += 1;
    }

    console.log(
      `Set customer waitlist email toggles on ${updated} connected app(s)`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async down(db) {
    const result = await db.collection("connected-apps").updateMany(
      { name: "customer-waitlist-notifications" },
      {
        $unset: {
          "data.customerNewEntryEmailEnabled": "",
          "data.slotOpenedEmailEnabled": "",
        },
      },
    );

    console.log(
      `Removed customer waitlist email toggles from ${result.modifiedCount} connected app(s)`,
    );
  },
};
