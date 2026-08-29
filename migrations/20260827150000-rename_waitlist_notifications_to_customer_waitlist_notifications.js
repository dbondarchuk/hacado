module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const connectedApps = db.collection("connected-apps");
        const logs = db.collection("communication-logs");

        const legacyApps = await connectedApps
          .find({ name: "waitlist-notifications" })
          .toArray();

        for (const app of legacyApps) {
          if (app.data?.notifyOnNewEntry) {
            await connectedApps.updateMany(
              {
                organizationId: app.organizationId,
                name: "waitlist",
              },
              {
                $set: { "data.notifyMemberOnNewEntry": true },
              },
            );
          }

          const nextData = {};
          if (
            app.data?.notifyCustomerOnNewEntry &&
            app.data?.customerNewEntryTemplateId
          ) {
            nextData.customerNewEntryTemplateId =
              app.data.customerNewEntryTemplateId;
          }

          await connectedApps.updateOne(
            { _id: app._id },
            {
              $set: {
                name: "customer-waitlist-notifications",
                data: nextData,
                statusText:
                  "app_customer-waitlist-notifications_admin.statusText.successfully_set_up",
              },
            },
          );
        }

        await logs.updateMany(
          {
            "handledBy.key":
              "app_waitlist-notifications_admin.handlers.newWaitlistEntry",
          },
          {
            $set: {
              "handledBy.key":
                "app_customer-waitlist-notifications_admin.handlers.newWaitlistEntry",
            },
          },
        );
      });
    } finally {
      await session.endSession();
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const connectedApps = db.collection("connected-apps");
        const logs = db.collection("communication-logs");

        await connectedApps.updateMany(
          { name: "customer-waitlist-notifications" },
          [
            {
              $set: {
                name: "waitlist-notifications",
                statusText:
                  "app_waitlist-notifications_admin.statusText.successfully_set_up",
                data: {
                  notifyOnNewEntry: false,
                  notifyCustomerOnNewEntry: {
                    $cond: [
                      { $ifNull: ["$data.customerNewEntryTemplateId", false] },
                      true,
                      false,
                    ],
                  },
                  customerNewEntryTemplateId:
                    "$data.customerNewEntryTemplateId",
                },
              },
            },
          ],
        );

        await logs.updateMany(
          {
            "handledBy.key":
              "app_customer-waitlist-notifications_admin.handlers.newWaitlistEntry",
          },
          {
            $set: {
              "handledBy.key":
                "app_waitlist-notifications_admin.handlers.newWaitlistEntry",
            },
          },
        );
      });
    } finally {
      await session.endSession();
    }
  },
};
