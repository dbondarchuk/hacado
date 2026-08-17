const crypto = require("crypto");

const PAYPAL_APP_NAME = "paypal";
const PAYMENTS_COLLECTION = "payments";
const INTENTS_COLLECTION = "payment-intents";
const CONNECTED_APPS_COLLECTION = "connected-apps";
const HISTORY_COLLECTION = "appointments-history";

const ALGORITHM = "aes-256-cbc";

const MIGRATION_NAME = "paypal_online_payment_external_id_to_capture";

function logSection(title) {
  console.log(`\n[paypal migration] ${title}`);
  console.log("[paypal migration] " + "-".repeat(Math.max(title.length, 40)));
}

/**
 * @param {Record<string, unknown>} details
 * @param {string} message
 */
function logInfo(details, message) {
  console.log("[paypal migration]", message, details);
}

/**
 * @param {"up" | "down"} direction
 */
function logMigrationStart(direction) {
  logSection(
    direction === "up"
      ? "Starting UP: order id → capture id on externalId"
      : "Starting DOWN: capture id → order id on externalId",
  );
  console.log(
    `[paypal migration] PayPal API: ${isPayPalProduction() ? "production" : "sandbox"}`,
  );
}

function logMigrationComplete(direction, summary) {
  logSection(
    direction === "up" ? "UP migration complete" : "DOWN migration complete",
  );
  for (const [key, value] of Object.entries(summary)) {
    console.log(`[paypal migration]   ${key}: ${value}`);
  }
}

/**
 * @param {string | null | undefined} data
 */
function decrypt(data) {
  if (!data) {
    return data;
  }

  let secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    console.warn(
      "SECRET_KEY is not set; using fallback key (dev-only behaviour).",
    );
    secretKey = "uw8iDFHFNjbIU8gPGMByTLiFfXJex7E1";
  }

  const key = crypto
    .createHash("sha512")
    .update(secretKey)
    .digest("hex")
    .substring(0, 32);

  const inputIV = data.slice(0, 32);
  const encrypted = data.slice(32);
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(key),
    Buffer.from(inputIV, "hex"),
  );
  let decrypted = decipher.update(encrypted, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
}

function isPayPalProduction() {
  if (process.env.PAYPAL_ENV === "production") {
    return true;
  }

  return false;
}

class PaypalMigrationClient {
  /**
   * @param {string} clientId
   * @param {string} secretKey
   * @param {boolean} isProduction
   */
  constructor(clientId, secretKey, isProduction) {
    this.clientId = clientId;
    this.secretKey = secretKey;
    this.baseUrl = isProduction
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
    this.accessToken = null;
  }

  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.clientId}:${this.secretKey}`).toString(
      "base64",
    );
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`PayPal token request failed with ${response.status}`);
    }

    const body = await response.json();
    this.accessToken = body.access_token;
    return this.accessToken;
  }

  /**
   * @param {string} path
   */
  async fetchPayPal(path) {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  /**
   * @param {string} orderId
   */
  async getCaptureIdFromOrder(orderId) {
    const order = await this.fetchPayPal(`/v2/checkout/orders/${orderId}`);
    return order?.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;
  }

  /**
   * @param {string} captureId
   */
  async getCapture(captureId) {
    return this.fetchPayPal(`/v2/payments/captures/${captureId}`);
  }
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} appId
 * @param {Map<string, PaypalMigrationClient | null>} cache
 */
async function getPayPalClientForApp(db, appId, cache) {
  if (cache.has(appId)) {
    return cache.get(appId);
  }

  const app = await db
    .collection(CONNECTED_APPS_COLLECTION)
    .findOne(
      { _id: appId, name: PAYPAL_APP_NAME },
      { projection: { data: 1 } },
    );

  if (!app?.data?.clientId || !app?.data?.secretKey) {
    cache.set(appId, null);
    return null;
  }

  const clientId = decrypt(app.data.clientId);
  const secretKey = decrypt(app.data.secretKey);
  if (!clientId || !secretKey) {
    cache.set(appId, null);
    return null;
  }

  const client = new PaypalMigrationClient(
    clientId,
    secretKey,
    isPayPalProduction(),
  );
  cache.set(appId, client);
  return client;
}

/**
 * @param {{ externalId?: string, data?: { orderId?: string } }} doc
 */
function isAlreadyMigrated(doc) {
  const orderId = doc.data?.orderId;
  return Boolean(orderId && doc.externalId && doc.externalId !== orderId);
}

/**
 * PayPal payment intents: old records store order id on externalId; newer
 * createOrder flow stores order id on data.orderId and may leave externalId
 * unset until capture.
 *
 * @param {{ externalId?: string, status?: string, data?: { orderId?: string } }} doc
 */
function needsIntentMigration(doc) {
  if (isAlreadyMigrated(doc)) {
    return false;
  }

  const orderId = doc.data?.orderId;

  if (orderId && doc.status === "paid" && !doc.externalId) {
    return true;
  }

  if (!doc.externalId) {
    return false;
  }

  if (!orderId || doc.externalId === orderId) {
    return true;
  }

  return false;
}

/**
 * @param {{ externalId?: string, data?: { orderId?: string } }} doc
 */
function needsPaymentMigration(doc) {
  if (!doc.externalId) {
    return false;
  }

  return !isAlreadyMigrated(doc);
}

/**
 * @param {PaypalMigrationClient} client
 * @param {{ externalId?: string, data?: { orderId?: string } }} doc
 */
async function resolveCaptureMigration(client, doc) {
  const existingOrderId = doc.data?.orderId;
  const externalId = doc.externalId;
  console.log("[paypal migration] Resolving capture migration:", {
    existingOrderId,
    externalId,
  });
  if (existingOrderId && externalId && externalId !== existingOrderId) {
    console.warn("[paypal migration] Could not get capture:", {
      existingOrderId,
      externalId,
      error: "existingOrderId and externalId do not match",
    });
    return null;
  }

  if (existingOrderId && (!externalId || externalId === existingOrderId)) {
    const captureId = await client.getCaptureIdFromOrder(existingOrderId);
    if (!captureId) {
      console.warn("[paypal migration] Could not get capture:", {
        captureId: existingOrderId,
        error: "captureId is not set",
      });
      return null;
    }
    return { orderId: existingOrderId, captureId };
  }

  if (!externalId) {
    console.warn("[paypal migration] Could not get capture:", {
      captureId: externalId,
      error: "externalId is not set",
    });
    return null;
  }

  const captureIdFromOrder = await client.getCaptureIdFromOrder(externalId);
  if (captureIdFromOrder) {
    console.log("[paypal migration] Resolved capture migration:", {
      orderId: externalId,
      captureId: captureIdFromOrder,
    });
    return { orderId: externalId, captureId: captureIdFromOrder };
  }

  const capture = await client.getCapture(externalId);
  if (!capture?.id) {
    console.warn("[paypal migration] Could not get capture:", {
      captureId: externalId,
      error: capture?.error,
    });
    return null;
  }

  const orderId =
    capture.supplementary_data?.related_ids?.order_id ?? externalId;
  console.log("[paypal migration] Resolved capture migration:", {
    orderId,
    captureId: capture.id,
  });

  return { orderId, captureId: capture.id };
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} collectionName
 * @param {import('mongodb').Filter<import('mongodb').Document>} query
 * @param {(doc: import('mongodb').Document) => boolean} shouldMigrate
 * @param {Map<string, string>} orderIdToCaptureId
 */
async function migratePayPalExternalIds(
  db,
  collectionName,
  query,
  shouldMigrate,
  orderIdToCaptureId,
) {
  logSection(`Migrating ${collectionName}`);

  const collection = db.collection(collectionName);
  const clientCache = new Map();

  const cursor = collection.find({
    appName: PAYPAL_APP_NAME,
    ...query,
  });

  let scanned = 0;
  let matched = 0;
  let migrated = 0;
  let skippedAlreadyMigrated = 0;
  let skippedNoCredentials = 0;
  let skippedUnresolved = 0;

  for await (const doc of cursor) {
    scanned += 1;

    if (!shouldMigrate(doc)) {
      skippedAlreadyMigrated += 1;
      continue;
    }

    matched += 1;

    const client = await getPayPalClientForApp(db, doc.appId, clientCache);
    if (!client) {
      skippedNoCredentials += 1;
      console.warn(
        "[paypal migration] Skipping record - PayPal credentials not found:",
        {
          collection: collectionName,
          id: doc._id,
          appId: doc.appId,
        },
      );
      continue;
    }

    let resolved;
    try {
      resolved = await resolveCaptureMigration(client, doc);
    } catch (error) {
      skippedUnresolved += 1;
      console.warn("[paypal migration] PayPal API lookup failed:", {
        collection: collectionName,
        id: doc._id,
        externalId: doc.externalId,
        orderId: doc.data?.orderId,
        error: error instanceof Error ? error.message : error,
      });
      continue;
    }

    if (!resolved?.captureId || !resolved.orderId) {
      skippedUnresolved += 1;
      console.warn("[paypal migration] Could not resolve capture id:", {
        collection: collectionName,
        id: doc._id,
        externalId: doc.externalId,
        orderId: doc.data?.orderId,
      });
      continue;
    }

    if (
      doc.externalId === resolved.captureId &&
      doc.data?.orderId === resolved.orderId
    ) {
      skippedAlreadyMigrated += 1;
      continue;
    }

    const previousExternalId = doc.externalId ?? "(none)";

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          externalId: resolved.captureId,
          "data.orderId": resolved.orderId,
          updatedAt: new Date(),
        },
      },
    );

    orderIdToCaptureId.set(resolved.orderId, resolved.captureId);
    if (doc.externalId && doc.externalId !== resolved.captureId) {
      orderIdToCaptureId.set(String(doc.externalId), resolved.captureId);
    }

    migrated += 1;
    console.log(
      `[paypal migration] Updated ${collectionName}/${doc._id}: externalId ${previousExternalId} → ${resolved.captureId}, data.orderId = ${resolved.orderId}`,
    );
  }

  console.log(
    `[paypal migration] ${collectionName} summary: scanned=${scanned}, matched=${matched}, migrated=${migrated}, already migrated=${skippedAlreadyMigrated}, no credentials=${skippedNoCredentials}, unresolved=${skippedUnresolved}`,
  );

  return {
    scanned,
    matched,
    migrated,
    skippedAlreadyMigrated,
    skippedNoCredentials,
    skippedUnresolved,
  };
}

/**
 * @param {import('mongodb').Db} db
 * @param {Map<string, string>} orderIdToCaptureId
 */
async function migrateAppointmentHistoryExternalIds(db, orderIdToCaptureId) {
  logSection("Updating appointments-history payment snapshots");

  if (orderIdToCaptureId.size === 0) {
    console.log(
      "[paypal migration] No order→capture mappings; skipping history updates",
    );
    return 0;
  }

  const history = db.collection(HISTORY_COLLECTION);
  let updated = 0;

  for (const [orderId, captureId] of orderIdToCaptureId.entries()) {
    const result = await history.updateMany(
      {
        "data.payment.appName": PAYPAL_APP_NAME,
        "data.payment.externalId": orderId,
      },
      {
        $set: {
          "data.payment.externalId": captureId,
        },
      },
    );
    if (result.modifiedCount > 0) {
      console.log(
        `[paypal migration] History: externalId ${orderId} → ${captureId} (${result.modifiedCount} snapshot(s))`,
      );
    }
    updated += result.modifiedCount;
  }

  console.log(
    `[paypal migration] appointments-history summary: updated ${updated} payment snapshot(s)`,
  );

  return updated;
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} collectionName
 * @param {import('mongodb').Filter<import('mongodb').Document>} extraFilter
 * @param {{ removeData: boolean }} options
 */
async function rollbackPayPalExternalIds(
  db,
  collectionName,
  extraFilter,
  { removeData },
) {
  logSection(`Rolling back ${collectionName}`);

  const collection = db.collection(collectionName);
  const captureToOrderId = new Map();

  const cursor = collection.find({
    appName: PAYPAL_APP_NAME,
    "data.orderId": { $exists: true, $nin: [null, ""] },
    externalId: { $exists: true, $nin: [null, ""] },
    $expr: { $ne: ["$externalId", "$data.orderId"] },
    ...extraFilter,
  });

  let scanned = 0;
  let rolledBack = 0;

  for await (const doc of cursor) {
    scanned += 1;
    const orderId = doc.data.orderId;
    const captureId = doc.externalId;

    /** @type {import('mongodb').UpdateFilter<import('mongodb').Document>} */
    const update = {
      $set: {
        externalId: orderId,
        updatedAt: new Date(),
      },
      $unset: removeData ? { data: "" } : { "data.orderId": "" },
    };

    await collection.updateOne({ _id: doc._id }, update);

    captureToOrderId.set(captureId, orderId);
    rolledBack += 1;

    console.log(
      `[paypal migration] Rolled back ${collectionName}/${doc._id}: externalId ${captureId} → ${orderId}${removeData ? ", removed data" : ", removed data.orderId"}`,
    );
  }

  console.log(
    `[paypal migration] ${collectionName} summary: scanned=${scanned}, rolled back=${rolledBack}`,
  );

  return captureToOrderId;
}

/**
 * @param {import('mongodb').Db} db
 * @param {Map<string, string>} captureToOrderId
 */
async function rollbackAppointmentHistoryExternalIds(db, captureToOrderId) {
  logSection("Rolling back appointments-history payment snapshots");

  if (captureToOrderId.size === 0) {
    console.log(
      "[paypal migration] No capture→order mappings; skipping history rollback",
    );
    return 0;
  }

  const history = db.collection(HISTORY_COLLECTION);
  let updated = 0;

  for (const [captureId, orderId] of captureToOrderId.entries()) {
    const result = await history.updateMany(
      {
        "data.payment.appName": PAYPAL_APP_NAME,
        "data.payment.externalId": captureId,
      },
      {
        $set: {
          "data.payment.externalId": orderId,
        },
      },
    );
    if (result.modifiedCount > 0) {
      console.log(
        `[paypal migration] History rollback: externalId ${captureId} → ${orderId} (${result.modifiedCount} snapshot(s))`,
      );
    }
    updated += result.modifiedCount;
  }

  console.log(
    `[paypal migration] appointments-history rollback summary: updated ${updated} payment snapshot(s)`,
  );

  return updated;
}

module.exports = {
  /**
   * Move PayPal online payment externalId from order id to capture id.
   * Previous order id is stored on data.orderId.
   *
   * Requires PayPal API access (connected app credentials + SECRET_KEY).
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    logMigrationStart("up");
    logInfo({ migration: MIGRATION_NAME }, "Running migration");

    const orderIdToCaptureId = new Map();

    const intentStats = await migratePayPalExternalIds(
      db,
      INTENTS_COLLECTION,
      {
        $or: [
          { externalId: { $exists: true, $nin: [null, ""] } },
          {
            status: "paid",
            "data.orderId": { $exists: true, $nin: [null, ""] },
          },
        ],
      },
      needsIntentMigration,
      orderIdToCaptureId,
    );

    const paymentStats = await migratePayPalExternalIds(
      db,
      PAYMENTS_COLLECTION,
      {
        method: "online",
        externalId: { $exists: true, $nin: [null, ""] },
      },
      needsPaymentMigration,
      orderIdToCaptureId,
    );

    const historyUpdated = await migrateAppointmentHistoryExternalIds(
      db,
      orderIdToCaptureId,
    );

    logMigrationComplete("up", {
      "payment-intents migrated": intentStats.migrated,
      "payments migrated": paymentStats.migrated,
      "history snapshots updated": historyUpdated,
      "order→capture mappings": orderIdToCaptureId.size,
    });
  },

  /**
   * Restore order id on externalId and drop migrated data.orderId.
   * Payment intents keep other data fields (e.g. request); payments drop data.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db) {
    logMigrationStart("down");
    logInfo({ migration: MIGRATION_NAME }, "Running rollback");

    const captureToOrderId = new Map();

    const intentCaptureToOrder = await rollbackPayPalExternalIds(
      db,
      INTENTS_COLLECTION,
      {},
      { removeData: false },
    );
    for (const [captureId, orderId] of intentCaptureToOrder) {
      captureToOrderId.set(captureId, orderId);
    }

    const paymentCaptureToOrder = await rollbackPayPalExternalIds(
      db,
      PAYMENTS_COLLECTION,
      { method: "online" },
      { removeData: true },
    );
    for (const [captureId, orderId] of paymentCaptureToOrder) {
      captureToOrderId.set(captureId, orderId);
    }

    const historyUpdated = await rollbackAppointmentHistoryExternalIds(
      db,
      captureToOrderId,
    );

    logMigrationComplete("down", {
      "payment-intents rolled back": intentCaptureToOrder.size,
      "payments rolled back": paymentCaptureToOrder.size,
      "history snapshots updated": historyUpdated,
    });
  },
};
