module.exports = {
  /**
   * Store explicit email toggles for customer package emails.
   * A saved template means that email was being sent.
   *
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async up(db) {
    const connectedApps = db.collection("connected-apps");
    const cursor = connectedApps.find({
      name: "customer-package-email-notification",
    });
    const keys = ["purchased", "exhausted", "cancelled", "expired"];
    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const templates = doc?.data?.templates;
      if (!templates || typeof templates !== "object") continue;

      const $set = {};
      for (const key of keys) {
        const channel = templates[key];
        if (!channel || typeof channel !== "object") continue;
        if (typeof channel.enabled === "boolean") continue;
        $set[`data.templates.${key}.enabled`] = Boolean(channel.templateId);
      }
      if (Object.keys($set).length === 0) continue;

      await connectedApps.updateOne({ _id: doc._id }, { $set });
      updated += 1;
    }

    console.log(
      `Set customer package email toggles on ${updated} connected app(s)`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async down(db) {
    const result = await db.collection("connected-apps").updateMany(
      { name: "customer-package-email-notification" },
      {
        $unset: {
          "data.templates.purchased.enabled": "",
          "data.templates.exhausted.enabled": "",
          "data.templates.cancelled.enabled": "",
          "data.templates.expired.enabled": "",
        },
      },
    );

    console.log(
      `Removed customer package email toggles from ${result.modifiedCount} connected app(s)`,
    );
  },
};
