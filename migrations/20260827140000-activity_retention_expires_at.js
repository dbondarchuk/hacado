/**
 * Activity retention indexes, org `activityRetentionDays` backfill, and
 * `expiresAt` on existing activities.
 *
 * Idempotent: orgs that already have `activityRetentionDays` (including
 * explicit `null`) are left alone. Fees-exempt orgs do not get the field.
 * Only activity documents missing `expiresAt` are updated. Permanent audit
 * types and unlimited orgs are left without `expiresAt`.
 *
 * Keep permanent-type lists in sync with `noExpiry: true` on
 * event definitions (payment, syncedPayment, billing, member audit,
 * invitations, organization domain, subscription, apps, gift-card purchases).
 *
 * @param db {import('mongodb').Db}
 */

const ACTIVITIES_COLLECTION = "activities";
const ORGANIZATIONS_COLLECTION = "organizations";
const ORG_CREATED_AT_INDEX = "organizationId_1_createdAt_-1";
const EXPIRES_AT_TTL_INDEX = "expiresAt_1_ttl";
const CURSOR_BATCH = 500;

const PERMANENT_PREFIXES = [
  "payment.",
  "syncedPayment.",
  "billing.",
  "gift-card-studio.purchase.",
];

const PERMANENT_TYPES = new Set([
  "member.roleChanged",
  "member.created",
  "member.deactivated",
  "member.reactivated",
  "invitation.created",
  "invitation.canceled",
  "organization.domainChanged",
  "subscription.statusChanged",
  "app.installed",
  "app.uninstalled",
  "app.connected",
  "app.failed",
]);

const PLAN_RETENTION_DAYS = {
  free: 30,
  solo: 90,
  studio: 365,
};

const LEGACY_PLAN_SLUG_ALIASES = {
  pro: "solo",
  team: "studio",
};

const MISSING_EXPIRES_AT = {
  $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }],
};

function isPermanentActivityType(eventType) {
  if (!eventType) return false;
  if (PERMANENT_TYPES.has(eventType)) return true;
  return PERMANENT_PREFIXES.some((prefix) => eventType.startsWith(prefix));
}

function getBillingPlanProductIdMap() {
  const map = new Map();
  const raw = process.env.POLAR_BILLING_PLANS?.trim();
  if (!raw) return map;
  for (const part of raw.split(",")) {
    const [rawSlug, productId] = part.split(":").map((s) => s.trim());
    if (!rawSlug || !productId) continue;
    const slug = ["free", "solo", "studio"].includes(rawSlug)
      ? rawSlug
      : LEGACY_PLAN_SLUG_ALIASES[rawSlug];
    if (slug) map.set(productId, slug);
  }
  return map;
}

function fallbackRetentionDaysForOrg(org, productIdToTier) {
  const productId =
    typeof org.polarSubscriptionProductId === "string"
      ? org.polarSubscriptionProductId.trim()
      : "";
  if (!productId) return PLAN_RETENTION_DAYS.free;
  const tier = productIdToTier.get(productId) || "solo";
  return PLAN_RETENTION_DAYS[tier] ?? PLAN_RETENTION_DAYS.free;
}

function resolveMigrationOrganizationRetentionDays(org, productIdToTier) {
  if (!org || org.feesExempt === true) return null;
  if (Object.prototype.hasOwnProperty.call(org, "activityRetentionDays")) {
    return org.activityRetentionDays;
  }
  return fallbackRetentionDaysForOrg(org, productIdToTier);
}

const MISSING_ORG_RETENTION = {
  activityRetentionDays: { $exists: false },
  feesExempt: { $ne: true },
};

async function persistMissingOrganizationActivityRetentionDays(
  organizations,
  productIdToTier,
) {
  const noProduct = await organizations.updateMany(
    {
      ...MISSING_ORG_RETENTION,
      $or: [
        { polarSubscriptionProductId: { $exists: false } },
        { polarSubscriptionProductId: null },
        { polarSubscriptionProductId: "" },
      ],
    },
    { $set: { activityRetentionDays: PLAN_RETENTION_DAYS.free } },
  );

  console.log(
    `Set activityRetentionDays=${PLAN_RETENTION_DAYS.free} on ${noProduct.modifiedCount} org(s) with no plan product`,
  );

  let knownUpdated = 0;
  for (const [productId, tier] of productIdToTier) {
    const days = PLAN_RETENTION_DAYS[tier];
    if (days == null) continue;
    const result = await organizations.updateMany(
      {
        ...MISSING_ORG_RETENTION,
        polarSubscriptionProductId: productId,
      },
      { $set: { activityRetentionDays: days } },
    );
    knownUpdated += result.modifiedCount;
  }

  console.log(
    `Set activityRetentionDays from known Polar products on ${knownUpdated} org(s)`,
  );

  const unknown = await organizations.updateMany(MISSING_ORG_RETENTION, {
    $set: { activityRetentionDays: PLAN_RETENTION_DAYS.solo },
  });

  console.log(
    `Set activityRetentionDays=${PLAN_RETENTION_DAYS.solo} on ${unknown.modifiedCount} org(s) with unknown plan product`,
  );
}

function calculateExpiresAt(createdAt, retentionDays) {
  if (
    retentionDays == null ||
    !Number.isFinite(retentionDays) ||
    retentionDays <= 0
  ) {
    return undefined;
  }
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  return new Date(date.getTime() + retentionDays * 24 * 60 * 60 * 1000);
}

module.exports = {
  async up(db) {
    const activities = db.collection(ACTIVITIES_COLLECTION);
    const organizations = db.collection(ORGANIZATIONS_COLLECTION);

    if (!(await activities.indexExists(ORG_CREATED_AT_INDEX))) {
      await activities.createIndex(
        { organizationId: 1, createdAt: -1 },
        { name: ORG_CREATED_AT_INDEX },
      );
      console.log(
        `Created index ${ORG_CREATED_AT_INDEX} on ${ACTIVITIES_COLLECTION}`,
      );
    }

    if (!(await activities.indexExists(EXPIRES_AT_TTL_INDEX))) {
      await activities.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: EXPIRES_AT_TTL_INDEX },
      );

      console.log(
        `Created TTL index ${EXPIRES_AT_TTL_INDEX} on ${ACTIVITIES_COLLECTION}`,
      );
    }

    const productIdToTier = getBillingPlanProductIdMap();
    await persistMissingOrganizationActivityRetentionDays(
      organizations,
      productIdToTier,
    );

    const orgRetentionCache = new Map();
    let resolverCalls = 0;

    const retentionFor = async (organizationId) => {
      if (orgRetentionCache.has(organizationId)) {
        return orgRetentionCache.get(organizationId);
      }
      resolverCalls += 1;
      let org = null;
      try {
        org = await organizations.findOne(
          { _id: organizationId },
          {
            projection: {
              feesExempt: 1,
              activityRetentionDays: 1,
              polarSubscriptionProductId: 1,
            },
          },
        );
      } catch (error) {
        console.error(
          `Failed to load organization ${organizationId} for activity retention:`,
          error,
        );
        orgRetentionCache.set(organizationId, null);
        return null;
      }

      const days = resolveMigrationOrganizationRetentionDays(
        org,
        productIdToTier,
      );

      orgRetentionCache.set(organizationId, days);
      return days;
    };

    const cursor = activities
      .find(MISSING_EXPIRES_AT, {
        projection: {
          _id: 1,
          organizationId: 1,
          eventType: 1,
          createdAt: 1,
        },
      })
      .batchSize(CURSOR_BATCH);

    let scanned = 0;
    let updated = 0;
    let skippedPermanent = 0;
    let skippedUnlimited = 0;
    let errors = 0;
    let batch = [];

    const flush = async () => {
      if (!batch.length) return;
      const result = await activities.bulkWrite(batch, { ordered: false });
      updated += result.modifiedCount;

      console.log(
        `Flushed ${batch.length} activity expiresAt update(s); modified=${result.modifiedCount}; totalUpdated=${updated}`,
      );

      batch = [];
    };

    for await (const doc of cursor) {
      scanned += 1;
      try {
        if (isPermanentActivityType(doc.eventType)) {
          skippedPermanent += 1;
          continue;
        }

        const days = await retentionFor(doc.organizationId);
        if (days == null) {
          skippedUnlimited += 1;
          continue;
        }

        const expiresAt = calculateExpiresAt(doc.createdAt, days);
        if (!expiresAt) {
          skippedUnlimited += 1;
          continue;
        }

        batch.push({
          updateOne: {
            filter: {
              _id: doc._id,
              $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }],
            },
            update: { $set: { expiresAt } },
          },
        });

        if (batch.length >= CURSOR_BATCH) {
          await flush();
        }
      } catch (error) {
        errors += 1;
        console.error(
          `Failed to backfill activity ${doc._id} (org=${doc.organizationId}, type=${doc.eventType}):`,
          error,
        );
      }
    }

    await flush();

    console.log(
      `Activity expiresAt backfill complete: scanned=${scanned} updated=${updated} skippedPermanent=${skippedPermanent} skippedUnlimited=${skippedUnlimited} orgResolverCalls=${resolverCalls} errors=${errors}`,
    );
  },

  async down(db) {
    const activities = db.collection(ACTIVITIES_COLLECTION);
    for (const name of [ORG_CREATED_AT_INDEX, EXPIRES_AT_TTL_INDEX]) {
      if (await activities.indexExists(name)) {
        await activities.dropIndex(name);
        console.log(`Dropped index ${name} on ${ACTIVITIES_COLLECTION}`);
      }
    }

    console.log(
      "Skipping unset of expiresAt and activityRetentionDays: backfill is not safely reversible.",
    );
  },
};
