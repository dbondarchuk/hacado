module.exports = {
  /**
   * Store email and text as separate channels on appointment notifications.
   * A text channel only stays on when the previous text switch was on.
   * Free-text follow-ups are dropped; those notifications use the built-in reminder.
   *
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async up(db) {
    const notifications = db.collection("appointment-notifications");
    const cursor = notifications.find({
      emailEnabled: { $exists: false },
      textEnabled: { $exists: false },
    });

    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) continue;

      const channel = doc.channel;
      const emailEnabled = channel === "email";
      const textEnabled = channel === "text-message" && doc.enabled === true;
      const $set = { emailEnabled, textEnabled };

      if (emailEnabled && doc.templateId) {
        $set.emailTemplateId = doc.templateId;
      }

      if (textEnabled && doc.smsKind !== "followUp" && doc.templateId) {
        $set.textTemplateId = doc.templateId;
      }

      await notifications.updateOne(
        { _id: doc._id },
        {
          $set,
          $unset: {
            channel: "",
            templateId: "",
            enabled: "",
            smsKind: "",
            followUpText: "",
          },
        },
      );

      updated += 1;
    }

    console.log(
      `Split appointment notification channels on ${updated} notification(s)`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async down(db) {
    const notifications = db.collection("appointment-notifications");
    const cursor = notifications.find({
      $or: [
        { emailEnabled: { $exists: true } },
        { textEnabled: { $exists: true } },
      ],
    });

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) continue;

      const email = doc.emailEnabled === true;
      const text = doc.textEnabled === true;
      const channel = text && !email ? "text-message" : "email";
      const templateId =
        channel === "text-message" ? doc.textTemplateId : doc.emailTemplateId;

      const $set = { channel };
      if (templateId) $set.templateId = templateId;
      if (channel === "text-message") $set.enabled = true;

      await notifications.updateOne(
        { _id: doc._id },
        {
          $set,
          $unset: {
            emailEnabled: "",
            textEnabled: "",
            emailTemplateId: "",
            textTemplateId: "",
          },
        },
      );
    }
  },
};
