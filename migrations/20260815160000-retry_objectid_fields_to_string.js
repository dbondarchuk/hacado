const {
  convertAuthObjectIdFields,
} = require("./20260723153000-objectid_fields_to_string");

module.exports = {
  /**
   * Re-run ObjectId → string conversion. The original migration used
   * `instanceof ObjectId`, which skipped real ObjectId fields on prod when
   * migrate-mongo and `require("mongodb")` loaded different bson copies.
   *
   * Idempotent: only documents still storing BSON ObjectId (`$type: "objectId"`)
   * are rewritten.
   *
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async up(db) {
    await convertAuthObjectIdFields(db);
  },

  async down() {
    // Irreversible.
  },
};
