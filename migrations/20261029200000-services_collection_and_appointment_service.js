/**
 * Rename the bookable catalog collection `options` → `services`,
 * and the stored appointment event field `option` → `service`.
 * Persisted appointment requests on payment intents use `serviceId`.
 *
 * @param db {import('mongodb').Db}
 */

const NESTED_APPOINTMENT_COLLECTIONS = [
  "communication-logs",
  "assets",
  "synced-payments",
];

/**
 * @param {import('mongodb').Db} db
 * @param {string} name
 */
async function collectionExists(db, name) {
  const found = await db.listCollections({ name }).hasNext();
  return found;
}

module.exports = {
  /**
   * @param {import('mongodb').Db} db
   */
  async up(db) {
    const hasOptions = await collectionExists(db, "options");
    const hasServices = await collectionExists(db, "services");
    if (hasOptions && hasServices) {
      throw new Error(
        "Cannot rename collection options to services: both collections exist",
      );
    }
    if (hasOptions) {
      await db.collection("options").rename("services");
    }

    if (await collectionExists(db, "appointments")) {
      const appointments = db.collection("appointments");
      const renamed = await appointments.updateMany(
        { option: { $exists: true }, service: { $exists: false } },
        { $rename: { option: "service" } },
      );
      const unset = await appointments.updateMany(
        { optionId: { $exists: true } },
        { $unset: { optionId: "" } },
      );
      console.log(
        `appointments: renamed option on ${renamed.modifiedCount}, unset optionId on ${unset.modifiedCount}`,
      );
    }

    for (const name of NESTED_APPOINTMENT_COLLECTIONS) {
      if (!(await collectionExists(db, name))) continue;
      const result = await db.collection(name).updateMany(
        {
          "appointment.option": { $exists: true },
          "appointment.service": { $exists: false },
        },
        { $rename: { "appointment.option": "appointment.service" } },
      );
      console.log(
        `${name}: renamed appointment.option on ${result.modifiedCount}`,
      );
    }

    if (await collectionExists(db, "payment-intents")) {
      const result = await db.collection("payment-intents").updateMany(
        {
          "request.optionId": { $exists: true },
          "request.serviceId": { $exists: false },
        },
        { $rename: { "request.optionId": "request.serviceId" } },
      );
      console.log(
        `payment-intents: renamed request.optionId on ${result.modifiedCount}`,
      );
    }
  },

  /**
   * @param {import('mongodb').Db} db
   */
  async down(db) {
    const hasOptions = await collectionExists(db, "options");
    const hasServices = await collectionExists(db, "services");
    if (hasOptions && hasServices) {
      throw new Error(
        "Cannot rename collection services to options: both collections exist",
      );
    }
    if (hasServices) {
      await db.collection("services").rename("options");
    }

    if (await collectionExists(db, "appointments")) {
      await db.collection("appointments").updateMany(
        { service: { $exists: true }, option: { $exists: false } },
        { $rename: { service: "option" } },
      );
    }

    for (const name of NESTED_APPOINTMENT_COLLECTIONS) {
      if (!(await collectionExists(db, name))) continue;
      await db.collection(name).updateMany(
        {
          "appointment.service": { $exists: true },
          "appointment.option": { $exists: false },
        },
        { $rename: { "appointment.service": "appointment.option" } },
      );
    }

    if (await collectionExists(db, "payment-intents")) {
      await db.collection("payment-intents").updateMany(
        {
          "request.serviceId": { $exists: true },
          "request.optionId": { $exists: false },
        },
        { $rename: { "request.serviceId": "request.optionId" } },
      );
    }
  },
};
