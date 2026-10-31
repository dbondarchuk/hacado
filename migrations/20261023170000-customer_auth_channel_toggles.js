module.exports = {
  /**
   * Split customerAuth `otpChannels` into independent email and phone toggles.
   *
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async up(db) {
    const configuration = db.collection("configuration");
    const cursor = configuration.find({ key: "customerAuth" });
    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc?.value || typeof doc.value !== "object") continue;
      if (
        typeof doc.value.emailEnabled === "boolean" ||
        typeof doc.value.phoneEnabled === "boolean"
      ) {
        continue;
      }

      const channels = doc.value.otpChannels;
      const value = { ...doc.value };
      value.emailEnabled = channels !== "phone";
      value.phoneEnabled =
        channels === "phone" || channels === "email_or_phone";
      delete value.otpChannels;

      await configuration.updateOne({ _id: doc._id }, { $set: { value } });
      updated += 1;
    }

    console.log(
      `Migrated customerAuth otpChannels to channel toggles on ${updated} configuration document(s)`,
    );
  },

  /**
   * Restore customerAuth `otpChannels` from the email and phone toggles.
   *
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async down(db) {
    const configuration = db.collection("configuration");
    const cursor = configuration.find({ key: "customerAuth" });
    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc?.value || typeof doc.value !== "object") continue;
      if (
        typeof doc.value.emailEnabled !== "boolean" &&
        typeof doc.value.phoneEnabled !== "boolean"
      ) {
        continue;
      }

      const emailEnabled = doc.value.emailEnabled === true;
      const phoneEnabled = doc.value.phoneEnabled === true;
      const value = { ...doc.value };
      value.otpChannels =
        emailEnabled && phoneEnabled
          ? "email_or_phone"
          : phoneEnabled
            ? "phone"
            : "email";
      delete value.emailEnabled;
      delete value.phoneEnabled;

      await configuration.updateOne({ _id: doc._id }, { $set: { value } });
      updated += 1;
    }

    console.log(
      `Restored customerAuth otpChannels from channel toggles on ${updated} configuration document(s)`,
    );
  },
};
