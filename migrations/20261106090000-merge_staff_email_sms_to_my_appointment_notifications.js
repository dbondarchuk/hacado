const OLD_EMAIL_APP = "email-notification";
const OLD_SMS_APP = "text-message-notification";
const NEW_APP = "my-appointment-notifications";

const OLD_EMAIL_PREFIX = `app_${OLD_EMAIL_APP}_admin`;
const OLD_SMS_PREFIX = `app_${OLD_SMS_APP}_admin`;
const NEW_PREFIX = `app_${NEW_APP}_admin`;

const EVENT_KEYS = [
  "pending",
  "confirmed",
  "declined",
  "canceled",
  "noShow",
  "rescheduled",
];

const EMAIL_HANDLER_SUFFIXES = [
  "handlers.newRequest",
  "handlers.pending",
  "handlers.confirmed",
  "handlers.declined",
  "handlers.canceled",
  "handlers.noShow",
  "handlers.rescheduled",
];

const SMS_HANDLER_SUFFIXES = [
  "handlers.newRequest",
  "handlers.pending",
  "handlers.confirmed",
  "handlers.declined",
  "handlers.rescheduled",
  "handlers.autoReply",
];

const STATUS_TEXT_SUFFIXES = [
  "statusText.successfully_set_up",
  "statusText.error_processing_configuration",
];

const buildEvents = ({ emailOn, textOn }) => {
  const events = {};

  for (const key of EVENT_KEYS) {
    const emailEnabled = emailOn === true;
    const textEnabled = textOn === true;

    events[key] = {
      enabled: emailEnabled || textEnabled,
      emailEnabled,
      textEnabled,
    };
  }

  return events;
};

const replaceHandledBy = async (
  logs,
  fromPrefix,
  toPrefix,
  suffixes,
  channel,
) => {
  for (const suffix of suffixes) {
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

const memberRoleById = async (db, organizationId, memberId) => {
  if (!memberId) return null;

  const members = db.collection("members");
  const member = await members.findOne(
    { _id: memberId, organizationId },
    { projection: { role: 1 } },
  );

  if (member?.role) return member.role;

  const teamMembers = db.collection("team-members");
  const teamMember = await teamMembers.findOne(
    { _id: memberId, organizationId },
    { projection: { role: 1 } },
  );

  return teamMember?.role ?? null;
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
        const configurations = db.collection("configurations");

        const legacyApps = await connectedApps
          .find({ name: { $in: [OLD_EMAIL_APP, OLD_SMS_APP] } })
          .toArray();

        const groups = new Map();

        for (const app of legacyApps) {
          const key = `${app.organizationId}:${app.memberId || ""}`;
          const group = groups.get(key) || {
            organizationId: app.organizationId,
            memberId: app.memberId,
            email: null,
            sms: null,
          };

          if (app.name === OLD_EMAIL_APP) group.email = app;
          if (app.name === OLD_SMS_APP) group.sms = app;
          groups.set(key, group);
        }

        for (const group of groups.values()) {
          const role = await memberRoleById(
            db,
            group.organizationId,
            group.memberId,
          );
          // Mirrors app:installPrivileged and appointment readAll+updateAll.
          const canUseText = ["owner", "admin", "coordinator"].includes(role);
          const canProcessOthers = canUseText;
          const emailOn = Boolean(group.email);
          const textOn = Boolean(group.sms) && canUseText;
          const survivor = group.email || group.sms;
          const discarded =
            group.email && group.sms
              ? group.email._id === survivor._id
                ? group.sms
                : group.email
              : null;

          const emailData = group.email?.data || {};
          const smsData = group.sms?.data || {};

          const data = {
            email: emailData.email,
            phone: smsData.phone,
            processOtherMembersAppointments: canProcessOthers
              ? Boolean(
                  emailData.processOtherMembersAppointments ||
                    smsData.processOtherMembersAppointments,
                )
              : false,
            events: buildEvents({ emailOn, textOn }),
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
            await configurations.updateMany(
              {
                organizationId: group.organizationId,
                "defaultApps.textMessageResponderAppId": discarded._id,
              },
              {
                $set: {
                  "defaultApps.textMessageResponderAppId": survivor._id,
                },
              },
            );

            await connectedApps.deleteOne({ _id: discarded._id });
          }

          if (!canUseText && group.sms) {
            await configurations.updateMany(
              {
                organizationId: group.organizationId,
                "defaultApps.textMessageResponderAppId": survivor._id,
              },
              {
                $unset: { "defaultApps.textMessageResponderAppId": "" },
              },
            );
          }
        }

        await replaceHandledBy(
          logs,
          OLD_EMAIL_PREFIX,
          NEW_PREFIX,
          EMAIL_HANDLER_SUFFIXES,
          "email",
        );
        await replaceHandledBy(
          logs,
          OLD_SMS_PREFIX,
          NEW_PREFIX,
          SMS_HANDLER_SUFFIXES,
          "text-message",
        );
        // Leftover keys without a matching channel still move to the new app.
        await replaceHandledBy(
          logs,
          OLD_EMAIL_PREFIX,
          NEW_PREFIX,
          EMAIL_HANDLER_SUFFIXES,
        );
        await replaceHandledBy(
          logs,
          OLD_SMS_PREFIX,
          NEW_PREFIX,
          SMS_HANDLER_SUFFIXES,
        );
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
          const anyEmail = EVENT_KEYS.some(
            (key) => events[key]?.emailEnabled === true,
          );
          const anyText = EVENT_KEYS.some(
            (key) => events[key]?.textEnabled === true,
          );

          if (anyEmail) {
            await connectedApps.updateOne(
              { _id: app._id },
              {
                $set: {
                  name: OLD_EMAIL_APP,
                  data: {
                    email: app.data?.email,
                    processOtherMembersAppointments:
                      app.data?.processOtherMembersAppointments,
                  },
                  statusText: `${OLD_EMAIL_PREFIX}.statusText.successfully_set_up`,
                },
              },
            );

            if (anyText) {
              await connectedApps.insertOne({
                ...app,
                _id: undefined,
                name: OLD_SMS_APP,
                data: {
                  phone: app.data?.phone,
                  processOtherMembersAppointments:
                    app.data?.processOtherMembersAppointments,
                },
                statusText: `${OLD_SMS_PREFIX}.statusText.successfully_set_up`,
              });
            }
          } else if (anyText) {
            await connectedApps.updateOne(
              { _id: app._id },
              {
                $set: {
                  name: OLD_SMS_APP,
                  data: {
                    phone: app.data?.phone,
                    processOtherMembersAppointments:
                      app.data?.processOtherMembersAppointments,
                  },
                  statusText: `${OLD_SMS_PREFIX}.statusText.successfully_set_up`,
                },
              },
            );
          }
        }

        // Shared suffixes exist on both apps; split by channel on rollback.
        // Any leftover NEW_PREFIX keys fall back to the email prefix.
        await replaceHandledBy(
          logs,
          NEW_PREFIX,
          OLD_EMAIL_PREFIX,
          EMAIL_HANDLER_SUFFIXES,
          "email",
        );
        await replaceHandledBy(
          logs,
          NEW_PREFIX,
          OLD_SMS_PREFIX,
          SMS_HANDLER_SUFFIXES,
          "text-message",
        );
        await replaceHandledBy(
          logs,
          NEW_PREFIX,
          OLD_EMAIL_PREFIX,
          EMAIL_HANDLER_SUFFIXES,
        );
        await replaceStatusText(connectedApps, NEW_PREFIX, OLD_EMAIL_PREFIX);
        await replaceStatusText(connectedApps, NEW_PREFIX, OLD_SMS_PREFIX);
      });
    } finally {
      await session.endSession();
    }
  },
};
