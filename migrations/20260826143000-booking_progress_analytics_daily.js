/**
 * Creates booking-progress-analytics-daily and backfills it from
 * per-session booking-tracking documents.
 *
 * Idempotency: rename `booking-tracking` → `booking-tracking-legacy`, rebuild
 * daily docs from that collection, then drop the renamed source. A rerun
 * either finds the leftover renamed collection (rebuilds daily from it) or
 * finds neither source (already finished).
 *
 * Historical `steps` timestamps are the only entered-step signal.
 * Optional wizard steps that were never recorded are not invented.
 *
 * @param db {import('mongodb').Db}
 * @returns {Promise<void>}
 */

const DAILY_COLLECTION = "booking-progress-analytics-daily";
const SOURCE_COLLECTION = "booking-tracking";
const SOURCE_RENAMED = "booking-tracking-legacy";
const CONFIG_COLLECTION = "configuration";
const UNIQUE_INDEX = "organizationId_1_date_1";
const CURSOR_BATCH = 500;

const STEPS_EXCLUDED_FROM_ENTERED = new Set([
  "OPTIONS_REQUESTED",
  "BOOKING_CONVERTED",
  "FORM_SUBMITTED",
]);

module.exports = {
  async up(db) {
    const daily = await ensureDailyCollection(db);
    const hasRenamedSource = await renameSourceCollection(db);
    if (!hasRenamedSource) {
      console.log("No booking-tracking collection to backfill");
      return;
    }

    // Rebuild from the renamed source so a retry cannot double-count $inc.
    const existingDaily = await daily.countDocuments();
    if (existingDaily > 0) {
      await daily.deleteMany({});
      console.log(
        `Cleared ${existingDaily} ${DAILY_COLLECTION} docs before rebuild`,
      );
    }

    await backfillFromRenamedSource(db, daily);
    //await db.collection(SOURCE_RENAMED).drop();
    console.log(`Dropped ${SOURCE_RENAMED}`);
  },

  /**
   * Index-only rollback. Source session documents are not restored.
   *
   * @param db {import('mongodb').Db}
   */
  async down(db) {
    if (!(await collectionExists(db, DAILY_COLLECTION))) {
      console.log(`No ${DAILY_COLLECTION} collection to rollback`);
      return;
    }

    const collection = db.collection(DAILY_COLLECTION);
    if (await collection.indexExists(UNIQUE_INDEX)) {
      await collection.dropIndex(UNIQUE_INDEX);
      console.log(`Dropped index ${UNIQUE_INDEX}`);
    }
  },
};

async function collectionExists(db, name) {
  const found = await db
    .listCollections({ name }, { nameOnly: true })
    .toArray();
  return found.length > 0;
}

async function ensureDailyCollection(db) {
  const collections = await db
    .listCollections({ name: DAILY_COLLECTION })
    .toArray();
  const daily =
    collections.length > 0
      ? db.collection(DAILY_COLLECTION)
      : await db.createCollection(DAILY_COLLECTION);

  if (!(await daily.indexExists(UNIQUE_INDEX))) {
    await daily.createIndex(
      { organizationId: 1, date: 1 },
      { name: UNIQUE_INDEX, unique: true },
    );
    console.log(`Created unique index ${UNIQUE_INDEX} on ${DAILY_COLLECTION}`);
  }

  return daily;
}

async function renameSourceCollection(db) {
  const hasSource = await collectionExists(db, SOURCE_COLLECTION);
  const hasRenamed = await collectionExists(db, SOURCE_RENAMED);

  if (hasSource && !hasRenamed) {
    await db.renameCollection(SOURCE_COLLECTION, SOURCE_RENAMED);
    console.log(`Renamed ${SOURCE_COLLECTION} → ${SOURCE_RENAMED}`);
    return true;
  }

  if (hasSource && hasRenamed) {
    await db.collection(SOURCE_COLLECTION).drop();
    console.log(`Dropped leftover ${SOURCE_COLLECTION}`);
  }

  return hasRenamed || hasSource;
}

async function backfillFromRenamedSource(db, daily) {
  const timeZoneByOrg = await loadOrganizationTimeZones(db);
  const source = db.collection(SOURCE_RENAMED);
  const cursor = source.find({}).sort({ _id: 1 }).batchSize(CURSOR_BATCH);

  let processed = 0;
  let skipped = 0;
  const now = new Date();

  while (await cursor.hasNext()) {
    const event = await cursor.next();
    if (!event) break;

    if (event.lastStep === "OPTIONS_REQUESTED") {
      skipped += 1;
      continue;
    }

    const timeZone = timeZoneByOrg.get(event.organizationId) || "UTC";
    const date = toAnalyticsDate(event.startedAt, timeZone);
    const inc = toInc(event);

    try {
      await daily.updateOne(
        { organizationId: event.organizationId, date },
        {
          $setOnInsert: {
            organizationId: event.organizationId,
            date,
            createdAt: now,
          },
          $inc: inc,
          $set: { updatedAt: now },
        },
        { upsert: true },
      );
    } catch (error) {
      if (error && error.code === 11000) {
        await daily.updateOne(
          { organizationId: event.organizationId, date },
          { $inc: inc, $set: { updatedAt: now } },
        );
      } else {
        throw error;
      }
    }

    processed += 1;
    if ((processed + skipped) % CURSOR_BATCH === 0) {
      console.log(
        `booking-progress backfill: processed=${processed} skipped=${skipped}`,
      );
    }
  }

  console.log(
    `booking-progress backfill complete: processed=${processed} skipped=${skipped}`,
  );
}

async function loadOrganizationTimeZones(db) {
  const map = new Map();
  const configs = await db
    .collection(CONFIG_COLLECTION)
    .find({ key: "general" })
    .project({ organizationId: 1, "value.timeZone": 1 })
    .toArray();
  for (const config of configs) {
    if (config.organizationId && config.value && config.value.timeZone) {
      map.set(config.organizationId, config.value.timeZone);
    }
  }
  return map;
}

function toAnalyticsDate(startedAt, timeZone) {
  let DateTime;
  try {
    DateTime = require("luxon").DateTime;
  } catch {
    const d = startedAt instanceof Date ? startedAt : new Date(startedAt);
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    );
  }

  const dt =
    startedAt instanceof Date
      ? DateTime.fromJSDate(startedAt, { zone: "utc" })
      : DateTime.fromISO(String(startedAt), { setZone: true });
  const zoned = dt.isValid ? dt.setZone(timeZone || "UTC") : DateTime.utc();
  const use = zoned.isValid ? zoned : DateTime.utc();
  return use.startOf("day").toJSDate();
}

function toInc(event) {
  const inc = { "metrics.started": 1 };
  const steps =
    event.steps && typeof event.steps === "object" ? event.steps : {};
  for (const step of Object.keys(steps)) {
    if (STEPS_EXCLUDED_FROM_ENTERED.has(step)) continue;
    inc[`metrics.entered.${step}`] = 1;
  }
  if (event.status === "converted") {
    inc["metrics.completed"] = 1;
    if (event.convertedTo) {
      inc[`metrics.convertedTo.${event.convertedTo}`] = 1;
    }
  } else if (
    event.status === "abandoned" &&
    event.lastStep &&
    !STEPS_EXCLUDED_FROM_ENTERED.has(event.lastStep)
  ) {
    inc[`metrics.stoppedAt.${event.lastStep}`] = 1;
  }
  return inc;
}
