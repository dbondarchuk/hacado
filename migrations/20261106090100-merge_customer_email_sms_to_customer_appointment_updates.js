const OLD_EMAIL_APP = "customer-email-notification";
const OLD_SMS_APP = "customer-text-message-notification";
const NEW_APP = "customer-appointment-updates";

const OLD_EMAIL_PREFIX = `app_${OLD_EMAIL_APP}_admin`;
const OLD_SMS_PREFIX = `app_${OLD_SMS_APP}_admin`;
const NEW_PREFIX = `app_${NEW_APP}_admin`;

const SHARED_KEYS = [
  "pending",
  "confirmed",
  "declined",
  "canceled",
  "noShow",
  "rescheduled",
];

const HANDLER_SUFFIXES = [
  "handlers.newRequest",
  "handlers.pending",
  "handlers.confirmed",
  "handlers.declined",
  "handlers.canceled",
  "handlers.noShow",
  "handlers.rescheduled",
];

const STATUS_TEXT_SUFFIXES = [
  "statusText.successfully_set_up",
  "statusText.error_processing_configuration",
];

const isEmailOn = (channel) => {
  if (!channel) return false;
  if (channel.enabled === false) return false;

  return Boolean(channel.templateId);
};

const isTextOn = (channel) => channel?.enabled === true;

const replaceHandledBy = async (logs, fromPrefix, toPrefix, channel) => {
  for (const suffix of HANDLER_SUFFIXES) {
    const fromKey = `${fromPrefix}.${suffix}`;
    const toKey = `${toPrefix}.${suffix}`;
    const channelFilter = channel ? { channel } : {};

    await logs.updateMany(
      { handledBy: fromKey, ...channelFilter },
      { $set: { handledBy: toKey } },
    );

    await logs.updateMany(
      { "handledBy.key": fromKey, ...channelFilter },
      { $set: { "handledBy.key": toKey } },
    );
  }
};

const replaceStatusText = async (connectedApps, fromPrefix, toPrefix) => {
  for (const suffix of STATUS_TEXT_SUFFIXES) {
    const fromKey = `${fromPrefix}.${suffix}`;
    const toKey = `${toPrefix}.${suffix}`;

    await connectedApps.updateMany(
      { statusText: fromKey },
      { $set: { statusText: toKey } },
    );

    await connectedApps.updateMany(
      { "statusText.key": fromKey },
      { $set: { "statusText.key": toKey } },
    );
  }
};

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   */
  async up(db, client) {
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const connectedApps = db.collection("connected-apps");
        const logs = db.collection("communication-logs");

        const legacyApps = await connectedApps
          .find({ name: { $in: [OLD_EMAIL_APP, OLD_SMS_APP] } })
          .toArray();

        const groups = new Map();

        for (const app of legacyApps) {
          const key = `${app.organizationId}`;
          const group = groups.get(key) || {
            organizationId: app.organizationId,
            email: null,
            sms: null,
          };

          if (app.name === OLD_EMAIL_APP) group.email = app;
          if (app.name === OLD_SMS_APP) group.sms = app;
          groups.set(key, group);
        }

        for (const group of groups.values()) {
          const survivor = group.email || group.sms;
          const discarded =
            group.email && group.sms
              ? group.email._id === survivor._id
                ? group.sms
                : group.email
              : null;

          const emailTemplates = group.email?.data?.templates || {};
          const smsTemplates = group.sms?.data?.templates || {};
          const calendarEvent = group.email?.data?.event || {};

          const events = {};

          for (const key of SHARED_KEYS) {
            const emailChannel = emailTemplates[key];
            const textChannel = smsTemplates[key];
            const emailEnabled = isEmailOn(emailChannel);
            const textEnabled = isTextOn(textChannel);

            events[key] = {
              enabled: emailEnabled || textEnabled,
              emailEnabled,
              textEnabled,
              emailTemplateId: emailChannel?.templateId,
              textTemplateId: textChannel?.templateId,
            };
          }

          const data = {
            events,
            packageEmails: {
              pendingPackage: emailTemplates.pendingPackage || {
                enabled: false,
              },
              confirmedPackage: emailTemplates.confirmedPackage || {
                enabled: false,
              },
            },
            event: calendarEvent,
          };

          await connectedApps.updateOne(
            { _id: survivor._id },
            {
              $set: {
                name: NEW_APP,
                data,
                status: "connected",
                statusText: `${NEW_PREFIX}.statusText.successfully_set_up`,
              },
            },
          );

          if (discarded) {
            await connectedApps.deleteOne({ _id: discarded._id });
          }
        }

        await replaceHandledBy(logs, OLD_EMAIL_PREFIX, NEW_PREFIX, "email");
        await replaceHandledBy(
          logs,
          OLD_SMS_PREFIX,
          NEW_PREFIX,
          "text-message",
        );
        // Leftover keys without a matching channel still move to the new app.
        await replaceHandledBy(logs, OLD_EMAIL_PREFIX, NEW_PREFIX);
        await replaceHandledBy(logs, OLD_SMS_PREFIX, NEW_PREFIX);
        await replaceStatusText(connectedApps, OLD_EMAIL_PREFIX, NEW_PREFIX);
        await replaceStatusText(connectedApps, OLD_SMS_PREFIX, NEW_PREFIX);
      });
    } finally {
      await session.endSession();
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   */
  async down(db, client) {
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const connectedApps = db.collection("connected-apps");
        const logs = db.collection("communication-logs");
        const merged = await connectedApps.find({ name: NEW_APP }).toArray();

        for (const app of merged) {
          const events = app.data?.events || {};
          const emailTemplates = {};
          const smsTemplates = {};

          for (const key of SHARED_KEYS) {
            const event = events[key] || {};

            emailTemplates[key] = {
              enabled: event.emailEnabled === true,
              templateId: event.emailTemplateId,
            };
            smsTemplates[key] = {
              enabled: event.textEnabled === true,
              templateId: event.textTemplateId,
            };
          }

          emailTemplates.pendingPackage =
            app.data?.packageEmails?.pendingPackage;
          emailTemplates.confirmedPackage =
            app.data?.packageEmails?.confirmedPackage;

          await connectedApps.updateOne(
            { _id: app._id },
            {
              $set: {
                name: OLD_EMAIL_APP,
                data: {
                  templates: emailTemplates,
                  event: app.data?.event,
                },
                statusText: `${OLD_EMAIL_PREFIX}.statusText.successfully_set_up`,
              },
            },
          );

          await connectedApps.insertOne({
            organizationId: app.organizationId,
            name: OLD_SMS_APP,
            status: "connected",
            statusText: `${OLD_SMS_PREFIX}.statusText.successfully_set_up`,
            data: { templates: smsTemplates },
            target: "company",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Handler suffixes overlap between the old email and SMS apps, so split
        // by channel when rolling back. Any leftover NEW_PREFIX keys fall back
        // to the email prefix.
        await replaceHandledBy(logs, NEW_PREFIX, OLD_EMAIL_PREFIX, "email");
        await replaceHandledBy(
          logs,
          NEW_PREFIX,
          OLD_SMS_PREFIX,
          "text-message",
        );
        await replaceHandledBy(logs, NEW_PREFIX, OLD_EMAIL_PREFIX);
        await replaceStatusText(connectedApps, NEW_PREFIX, OLD_EMAIL_PREFIX);
        await replaceStatusText(connectedApps, NEW_PREFIX, OLD_SMS_PREFIX);
      });
    } finally {
      await session.endSession();
    }
  },
};
