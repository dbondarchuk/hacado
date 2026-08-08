/**
 * Convert dense main-era `weekly-schedules` weeks into company-scoped
 * `weekly-schedule-exceptions` used by the multiuser weekly-schedule app.
 *
 * - Empty day shifts become `holidays` (main: cleared = closed for everyone).
 * - Non-empty days become sparse `days` hour overrides.
 * - Leaves `weekly-schedules` in place (log counts only); safe to re-run
 *   (skips weeks that already have a matching company exception).
 *
 * Supersedes the weekly-schedules half of 20260723140200 (memberId stamp on
 * the old collection is unused by the new exception model).
 */

const { ObjectId } = require("mongodb");

const OLD_COLLECTION = "weekly-schedules";
const NEW_COLLECTION = "weekly-schedule-exceptions";

/** Matches packages/utils getDateFromWeekIdentifier (Mon 1970-01-05 epoch). */
const WEEK_EPOCH_MS = Date.UTC(1970, 0, 5);

function weekToDateRange(week) {
  const mondayMs = WEEK_EPOCH_MS + Number(week) * 7 * 24 * 60 * 60 * 1000;
  const sundayMs = mondayMs + 6 * 24 * 60 * 60 * 1000;
  return {
    startDate: new Date(mondayMs).toISOString().slice(0, 10),
    endDate: new Date(sundayMs).toISOString().slice(0, 10),
  };
}

function scheduleToExceptionFields(schedule) {
  const days = {};
  const holidays = [];

  for (const entry of schedule || []) {
    const weekDay = Number(entry.weekDay);
    if (!(weekDay >= 1 && weekDay <= 7)) continue;

    const shifts = Array.isArray(entry.shifts) ? entry.shifts : [];
    if (shifts.length === 0) {
      holidays.push(weekDay);
    } else {
      days[weekDay] = shifts.map((shift) => ({
        start: shift.start,
        end: shift.end,
      }));
    }
  }

  holidays.sort((a, b) => a - b);
  return { days, holidays };
}

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   */
  async up(db) {
    const oldExists =
      (await db.listCollections({ name: OLD_COLLECTION }).toArray()).length > 0;
    if (!oldExists) {
      console.log(`Skip: ${OLD_COLLECTION} collection does not exist`);
      return;
    }

    const oldCol = db.collection(OLD_COLLECTION);
    const newCol = db.collection(NEW_COLLECTION);
    const apps = db.collection("connected-apps");

    const orgByAppId = new Map();
    async function resolveOrganizationId(doc) {
      if (doc.organizationId) return String(doc.organizationId);
      const appId = String(doc.appId);
      if (orgByAppId.has(appId)) return orgByAppId.get(appId);

      const app =
        (await apps.findOne({ _id: appId })) ||
        (await apps.findOne({ _id: doc.appId }));
      const organizationId = app?.organizationId
        ? String(app.organizationId)
        : null;
      orgByAppId.set(appId, organizationId);
      return organizationId;
    }

    let migrated = 0;
    let skippedExisting = 0;
    let skippedInvalid = 0;

    const cursor = oldCol.find({});
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc?.appId || doc.week == null) {
        skippedInvalid += 1;
        continue;
      }

      const organizationId = await resolveOrganizationId(doc);
      if (!organizationId) {
        skippedInvalid += 1;
        continue;
      }

      const week = Number(doc.week);
      if (!Number.isFinite(week)) {
        skippedInvalid += 1;
        continue;
      }

      const { startDate, endDate } = weekToDateRange(week);
      const { days, holidays } = scheduleToExceptionFields(doc.schedule);

      if (Object.keys(days).length === 0 && holidays.length === 0) {
        skippedInvalid += 1;
        continue;
      }

      const appId = String(doc.appId);
      const existing = await newCol.findOne({
        appId,
        scope: "company",
        startDate,
        endDate,
        memberId: { $exists: false },
        $or: [
          { repeatEveryWeeks: { $exists: false } },
          { repeatEveryWeeks: { $lt: 1 } },
        ],
      });

      if (existing) {
        skippedExisting += 1;
        continue;
      }

      await newCol.insertOne({
        _id: new ObjectId().toString(),
        organizationId,
        appId,
        scope: "company",
        startDate,
        endDate,
        days,
        ...(holidays.length ? { holidays } : {}),
      });
      migrated += 1;
    }

    try {
      await newCol.createIndex(
        { appId: 1, scope: 1, startDate: 1, endDate: 1 },
        { name: "appId_scope_startDate_endDate_1" },
      );
    } catch (err) {
      console.warn(`Index create on ${NEW_COLLECTION}:`, err.message);
    }

    console.log(
      `weekly-schedules → exceptions: migrated=${migrated}, skippedExisting=${skippedExisting}, skippedInvalid=${skippedInvalid} (old collection left intact)`,
    );
  },

  async down() {
    console.log(
      "Skipping down: cannot safely delete migrated weekly-schedule-exceptions without marking provenance.",
    );
  },
};
