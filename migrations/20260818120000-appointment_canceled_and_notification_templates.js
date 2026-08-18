const CUSTOMER_NOTIFICATION_APP_NAMES = [
  "customer-email-notification",
  "customer-text-message-notification",
];

module.exports = {
  /**
   * Backfill customer-canceled appointments onto the new `canceled` status,
   * and copy declined customer notification templates onto `templates.canceled`
   * when missing (does not copy onto no-show).
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    const latestCustomerDeclines = await db
      .collection("appointments-history")
      .aggregate([
        { $match: { type: "statusChanged" } },
        { $sort: { dateTime: -1, _id: -1 } },
        {
          $group: {
            _id: "$appointmentId",
            latest: { $first: "$$ROOT" },
          },
        },
        {
          $match: {
            "latest.data.by": "customer",
            "latest.data.newStatus": "declined",
          },
        },
      ])
      .toArray();

    const appointmentIds = latestCustomerDeclines.map((doc) => doc._id);
    let appointmentsUpdated = 0;
    if (appointmentIds.length > 0) {
      const result = await db.collection("appointments").updateMany(
        { _id: { $in: appointmentIds }, status: "declined" },
        { $set: { status: "canceled" } },
      );
      appointmentsUpdated = result.modifiedCount;
    }

    console.log(
      `[canceled status backfill] Updated ${appointmentsUpdated} appointment(s) from declined to canceled (${appointmentIds.length} customer-cancel history match(es)).`,
    );

    const templatesResult = await db.collection("connected-apps").updateMany(
      {
        name: { $in: CUSTOMER_NOTIFICATION_APP_NAMES },
        "data.templates.declined.templateId": {
          $exists: true,
          $nin: [null, ""],
        },
        $or: [
          { "data.templates.canceled": { $exists: false } },
          { "data.templates.canceled.templateId": { $exists: false } },
          { "data.templates.canceled.templateId": null },
          { "data.templates.canceled.templateId": "" },
        ],
      },
      [
        {
          $set: {
            "data.templates.canceled": {
              templateId: "$data.templates.declined.templateId",
            },
          },
        },
      ],
    );

    console.log(
      `[canceled template backfill] Copied declined templateId onto templates.canceled for ${templatesResult.modifiedCount} connected app(s).`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down() {
    console.log(
      "[canceled status backfill] Skipping down: appointment status and template copies are not reversed.",
    );
  },
};
