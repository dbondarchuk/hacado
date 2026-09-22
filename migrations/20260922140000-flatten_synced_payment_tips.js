const { ObjectId } = require("mongodb");

const PAYMENTS = "payments";
const SYNCED_PAYMENTS = "synced-payments";
const LOG = "[synced-tip-flatten]";

/**
 * @param {number} value
 */
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * @param {import('mongodb').Document} payment
 */
function isSyncedTipPayment(payment) {
  return (
    payment.source === "synced" &&
    payment.type === "tips" &&
    payment.method === "in-person-card"
  );
}

/**
 * @param {import('mongodb').Document} payment
 */
function isFlattenedSyncedPayment(payment) {
  return (
    payment.source === "synced" &&
    payment.method === "in-person-card" &&
    typeof payment.tipAmount === "number" &&
    payment.tipAmount > 0 &&
    payment.type !== "tips"
  );
}

/**
 * Merge separate synced tip payment rows into the service payment as tipAmount.
 *
 * Before: paymentIds = [servicePayment, tipPayment]
 * After:  paymentIds = [servicePayment] with amount = service + tip, tipAmount = tip
 *
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 * @returns {Promise<void>}
 */
async function up(db, client) {
  const payments = db.collection(PAYMENTS);
  const syncedPayments = db.collection(SYNCED_PAYMENTS);
  const now = new Date();

  let recordsScanned = 0;
  let recordsUpdated = 0;
  let tipsMerged = 0;
  let tipOnlyConverted = 0;
  let tipRowsDeleted = 0;
  let skippedAlreadyFlat = 0;
  let skippedNoTips = 0;

  const cursor = syncedPayments.find({
    paymentIds: { $exists: true, $type: "array", $ne: [] },
  });

  while (await cursor.hasNext()) {
    const record = await cursor.next();
    recordsScanned += 1;

    const paymentIds = Array.isArray(record.paymentIds)
      ? record.paymentIds.filter(Boolean)
      : [];
    if (!paymentIds.length) {
      continue;
    }

    const linked = await payments
      .find({
        _id: { $in: paymentIds },
        organizationId: record.organizationId,
      })
      .toArray();

    const tipRows = linked.filter(isSyncedTipPayment);
    const serviceRows = linked.filter((payment) => !isSyncedTipPayment(payment));

    if (!tipRows.length) {
      skippedNoTips += 1;
      continue;
    }

    if (serviceRows.some((payment) => isFlattenedSyncedPayment(payment))) {
      skippedAlreadyFlat += 1;
      continue;
    }

    const tipTotal = round2(
      tipRows.reduce((sum, tip) => sum + (Number(tip.amount) || 0), 0),
    );
    if (tipTotal <= 0) {
      skippedNoTips += 1;
      continue;
    }

    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        if (serviceRows.length > 0) {
          const primary = serviceRows[0];
          const nextAmount = round2((Number(primary.amount) || 0) + tipTotal);

          await payments.updateOne(
            { _id: primary._id },
            {
              $set: {
                amount: nextAmount,
                tipAmount: tipTotal,
                updatedAt: now,
              },
            },
            { session },
          );

          const remainingIds = [
            primary._id,
            ...serviceRows.slice(1).map((payment) => payment._id),
          ];

          await payments.deleteMany(
            { _id: { $in: tipRows.map((tip) => tip._id) } },
            { session },
          );

          await syncedPayments.updateOne(
            { _id: record._id },
            {
              $set: {
                paymentIds: remainingIds,
                updatedAt: now,
              },
            },
            { session },
          );

          tipsMerged += tipRows.length;
          tipRowsDeleted += tipRows.length;
          recordsUpdated += 1;
          return;
        }

        // Tip-only synced charge (service amount was 0): convert tip row into
        // a single flattened payment matching the new createPayments shape.
        const tipPrimary = tipRows[0];
        const extraTipIds = tipRows.slice(1).map((tip) => tip._id);
        const paymentType = record.paymentType || "payment";
        const nextAmount = tipTotal;

        await payments.updateOne(
          { _id: tipPrimary._id },
          {
            $set: {
              amount: nextAmount,
              tipAmount: tipTotal,
              type: paymentType,
              description: "syncedPayment",
              updatedAt: now,
            },
          },
          { session },
        );

        if (extraTipIds.length) {
          await payments.deleteMany({ _id: { $in: extraTipIds } }, { session });
          tipRowsDeleted += extraTipIds.length;
        }

        await syncedPayments.updateOne(
          { _id: record._id },
          {
            $set: {
              paymentIds: [tipPrimary._id],
              updatedAt: now,
            },
          },
          { session },
        );

        tipOnlyConverted += 1;
        recordsUpdated += 1;
      });
    } finally {
      await session.endSession();
    }
  }

  // Orphan synced tip rows (same externalId as a service payment, not listed
  // on the synced-payment paymentIds) — merge when we can find a sibling.
  const orphanTips = await payments
    .find({
      source: "synced",
      type: "tips",
      method: "in-person-card",
      externalId: { $exists: true, $nin: [null, ""] },
    })
    .toArray();

  let orphansMerged = 0;

  for (const tip of orphanTips) {
    const sibling = await payments.findOne({
      organizationId: tip.organizationId,
      externalId: tip.externalId,
      source: "synced",
      method: "in-person-card",
      type: { $ne: "tips" },
      _id: { $ne: tip._id },
    });

    if (!sibling) {
      continue;
    }

    if (isFlattenedSyncedPayment(sibling)) {
      // Sibling already carries tipAmount from the main pass; drop the orphan.
      await payments.deleteOne({ _id: tip._id });
      orphansMerged += 1;
      tipRowsDeleted += 1;
      continue;
    }

    const tipAmount = Number(tip.amount) || 0;
    if (tipAmount <= 0) {
      continue;
    }

    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await payments.updateOne(
          { _id: sibling._id },
          {
            $set: {
              amount: round2((Number(sibling.amount) || 0) + tipAmount),
              tipAmount: tipAmount,
              updatedAt: now,
            },
          },
          { session },
        );
        await payments.deleteOne({ _id: tip._id }, { session });

        await syncedPayments.updateMany(
          {
            organizationId: tip.organizationId,
            externalId: tip.externalId,
            paymentIds: tip._id,
          },
          {
            $pull: { paymentIds: tip._id },
            $set: { updatedAt: now },
          },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    orphansMerged += 1;
    tipRowsDeleted += 1;
  }

  console.log(
    `${LOG} up complete: scanned=${recordsScanned} updated=${recordsUpdated} tipsMerged=${tipsMerged} tipOnlyConverted=${tipOnlyConverted} orphansMerged=${orphansMerged} tipRowsDeleted=${tipRowsDeleted} skippedNoTips=${skippedNoTips} skippedAlreadyFlat=${skippedAlreadyFlat}`,
  );
}

/**
 * Split flattened synced tipAmount back into a separate tips payment row.
 *
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 * @returns {Promise<void>}
 */
async function down(db, client) {
  const payments = db.collection(PAYMENTS);
  const syncedPayments = db.collection(SYNCED_PAYMENTS);
  const now = new Date();

  let scanned = 0;
  let split = 0;
  let tipOnlyRestored = 0;
  let skipped = 0;

  const cursor = payments.find({
    source: "synced",
    method: "in-person-card",
    tipAmount: { $gt: 0 },
    type: { $ne: "tips" },
  });

  while (await cursor.hasNext()) {
    const payment = await cursor.next();
    scanned += 1;

    const tipAmount = round2(Number(payment.tipAmount) || 0);
    if (tipAmount <= 0) {
      skipped += 1;
      continue;
    }

    const serviceAmount = round2((Number(payment.amount) || 0) - tipAmount);
    const isTipOnly = serviceAmount <= 0;

    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        if (isTipOnly) {
          await payments.updateOne(
            { _id: payment._id },
            {
              $set: {
                amount: tipAmount,
                type: "tips",
                description: "syncedTip",
                updatedAt: now,
              },
              $unset: { tipAmount: "" },
            },
            { session },
          );
          tipOnlyRestored += 1;
          split += 1;
          return;
        }

        const tipPaymentId = new ObjectId().toString();
        const tipPayment = {
          _id: tipPaymentId,
          organizationId: payment.organizationId,
          amount: tipAmount,
          status: payment.status || "paid",
          paidAt: payment.paidAt || payment.createdAt || now,
          createdAt: payment.createdAt || now,
          updatedAt: now,
          appointmentId: payment.appointmentId,
          customerId: payment.customerId,
          description: "syncedTip",
          type: "tips",
          method: "in-person-card",
          source: "synced",
          disableUpdate: true,
          externalId: payment.externalId,
          appName: payment.appName,
          appId: payment.appId,
        };

        // Drop undefined fields so we don't store nullish keys.
        for (const key of Object.keys(tipPayment)) {
          if (tipPayment[key] === undefined) {
            delete tipPayment[key];
          }
        }

        await payments.insertOne(tipPayment, { session });

        await payments.updateOne(
          { _id: payment._id },
          {
            $set: {
              amount: serviceAmount,
              updatedAt: now,
            },
            $unset: { tipAmount: "" },
          },
          { session },
        );

        await syncedPayments.updateMany(
          {
            organizationId: payment.organizationId,
            paymentIds: payment._id,
          },
          {
            $addToSet: { paymentIds: tipPaymentId },
            $set: { updatedAt: now },
          },
          { session },
        );

        split += 1;
      });
    } finally {
      await session.endSession();
    }
  }

  console.log(
    `${LOG} down complete: scanned=${scanned} split=${split} tipOnlyRestored=${tipOnlyRestored} skipped=${skipped}`,
  );
}

module.exports = {
  up,
  down,
};
