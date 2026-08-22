module.exports = {
  /**
   * Migrate customerAuth `allowPhoneOtp` → `otpChannels`.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const session = client.startSession();

    const configuration = db.collection("configuration");
    const cursor = configuration.find({ key: "customerAuth" });

    let updated = 0;

    // eslint-disable-next-line no-constant-condition
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc?.value || typeof doc.value !== "object") continue;

      const value = { ...doc.value };
      const existingChannels = value.otpChannels;

      if (
        existingChannels !== "email" &&
        existingChannels !== "phone" &&
        existingChannels !== "email_or_phone"
      ) {
        value.otpChannels = value.allowPhoneOtp ? "email_or_phone" : "email";
      }

      delete value.allowPhoneOtp;

      await configuration.updateOne(
        { _id: doc._id },
        { $set: { value } },
        { session },
      );
      updated += 1;
    }

    console.log(
      `Migrated customerAuth allowPhoneOtp → otpChannels on ${updated} configuration document(s)`,
    );
  },

  /**
   * Restore customerAuth `allowPhoneOtp` from `otpChannels`.
   * Phone / email_or_phone → allowPhoneOtp true; email → false.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    const session = client.startSession();

    const configuration = db.collection("configuration");
    const cursor = configuration.find({ key: "customerAuth" });

    let updated = 0;

    // eslint-disable-next-line no-constant-condition
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc?.value || typeof doc.value !== "object") continue;

      const value = { ...doc.value };
      const channels = value.otpChannels;
      value.allowPhoneOtp =
        channels === "phone" || channels === "email_or_phone";
      delete value.otpChannels;

      await configuration.updateOne(
        { _id: doc._id },
        { $set: { value } },
        { session },
      );
      updated += 1;
    }

    console.log(
      `Restored customerAuth allowPhoneOtp from otpChannels on ${updated} configuration document(s)`,
    );
  },
};
