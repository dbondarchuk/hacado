module.exports = {
  /**
   * Store explicit toggles for customer appointment emails.
   * A saved template means that email was being sent.
   *
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async up(db) {
    const connectedApps = db.collection("connected-apps");
    const cursor = connectedApps.find({
      name: "customer-email-notification",
    });
    const keys = [
      "pending",
      "confirmed",
      "pendingPackage",
      "confirmedPackage",
      "declined",
      "canceled",
      "noShow",
      "rescheduled",
    ];
    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const data = doc?.data;
      if (!data || typeof data !== "object") continue;

      const $set = {};
      const templates = data.templates;
      if (templates && typeof templates === "object") {
        for (const key of keys) {
          const channel = templates[key];
          if (!channel || typeof channel !== "object") continue;
          if (typeof channel.enabled === "boolean") continue;
          $set[`data.templates.${key}.enabled`] = Boolean(channel.templateId);
        }
      }

      const event = data.event;
      if (
        event &&
        typeof event === "object" &&
        typeof event.enabled !== "boolean"
      ) {
        $set["data.event.enabled"] = Boolean(event.templateId);
      }

      if (Object.keys($set).length === 0) continue;

      await connectedApps.updateOne({ _id: doc._id }, { $set });
      updated += 1;
    }

    console.log(
      `Set customer email notification toggles on ${updated} connected app(s)`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async down(db) {
    const result = await db.collection("connected-apps").updateMany(
      { name: "customer-email-notification" },
      {
        $unset: {
          "data.templates.pending.enabled": "",
          "data.templates.confirmed.enabled": "",
          "data.templates.pendingPackage.enabled": "",
          "data.templates.confirmedPackage.enabled": "",
          "data.templates.declined.enabled": "",
          "data.templates.canceled.enabled": "",
          "data.templates.noShow.enabled": "",
          "data.templates.rescheduled.enabled": "",
          "data.event.enabled": "",
        },
      },
    );

    console.log(
      `Removed customer email notification toggles from ${result.modifiedCount} connected app(s)`,
    );
  },
};
