/**
 * Seed a fully ready organization (MongoDB + S3) using website pack templates
 * and the install industry catalog.
 *
 * Usage (from repo root):
 *   node scripts/seed-org.mjs --name="Acme Spa" --slug=acme-spa \
 *     --email-domain=hacado.com --plan=studio --users=5 \
 *     --industry=beauty --profession=hair_stylist --template=salon \
 *     --variant=b --appointments --purge --yes
 *
 * Template variants (Series A/B/C from page-builder packs):
 *   --template=salon --variant=a|b|c   (default a)
 *   --template=salon_b                 (variant encoded in id)
 * Appointments only (existing org):
 *   node scripts/seed-org.mjs appointments --slug=acme-spa \
 *     --months=2 --yes
 *
 * --purge / --purge-existing: delete org with the same slug (Mongo + S3) before seeding.
 * Env / flags mirror marketing-site/scripts/seed.mjs:
 *   MONGODB_URI, MONGODB_DB
 *   S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_ENDPOINT, S3_FORCE_PATH_STYLE
 *   REDIS_HOST, REDIS_PORT, REDIS_DB, REDIS_USERNAME, REDIS_PASSWORD
 *   POLAR_BILLING_PLANS (optional; studio without product id uses feesExempt)
 *
 * Default password for seeded users: SeedOrg123!  (--password=)
 */
import { hashPassword } from "better-auth/crypto";
import { MongoClient } from "mongodb";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import {
  BASE_PACK_IDS,
  COLLECTIONS,
  TEMPLATE_VARIANTS,
  buildHeader,
  buildOverlayHeader,
  buildPackPages,
  collectPackRemoteUrls,
  createS3Client,
  defaultBooking,
  defaultSchedule,
  ensurePackMediaBundle,
  generateAppointmentSlots,
  invalidatePageRouteCache,
  listPackIds,
  loadBuilderI18n,
  loadCatalog,
  loadEnvFile,
  loadEnvIfPresent,
  loadWebsitePacks,
  getWebsitePack,
  newId,
  orgIdMatch,
  parsePackId,
  pickIndustryServices,
  polarProductIdForTier,
  purgeOrganizationBySlug,
  resolveTemplate,
  slugify,
  staffAssignmentsForMembers,
  staffPersonAt,
  staffJobTitleAt,
  effectiveSeedStaffDuration,
  effectiveSeedStaffPrice,
  uploadLocalTemplateLogos,
  uploadRemoteImages,
  validateRedisConnection,
  validateS3Connection,
} from "./seed-org-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

/**
 * @typedef {{
 *   mode: 'seed' | 'appointments',
 *   name: string | null,
 *   slug: string | null,
 *   emailDomain: string | null,
 *   plan: 'free' | 'solo' | 'studio' | null,
 *   users: number | null,
 *   industry: string | null,
 *   profession: string | null,
 *   template: string | null,
 *   variant: string | null,
 *   appointments: boolean,
 *   purge: boolean,
 *   months: number,
 *   password: string | null,
 *   timeZone: string | null,
 *   country: string | null,
 *   currency: string | null,
 *   language: string | null,
 *   yes: boolean,
 *   envFile: string | null,
 *   mongoUrl: string | null,
 *   dbName: string | null,
 *   s3Region: string | null,
 *   s3AccessKey: string | null,
 *   s3SecretKey: string | null,
 *   s3Bucket: string | null,
 *   s3Endpoint: string | null,
 *   s3ForcePathStyle: boolean | null,
 *   redisHost: string | null,
 *   redisPort: string | null,
 *   redisDb: string | null,
 *   redisUsername: string | null,
 *   redisPassword: string | null,
 * }} CliOpts
 */

/** @param {string[]} argv */
function parseArgs(argv) {
  /** @type {CliOpts} */
  const out = {
    mode: "seed",
    name: null,
    slug: null,
    emailDomain: null,
    plan: null,
    users: null,
    industry: null,
    profession: null,
    template: null,
    variant: null,
    appointments: false,
    purge: false,
    months: 2,
    password: null,
    timeZone: null,
    country: null,
    currency: null,
    language: null,
    yes: false,
    envFile: null,
    mongoUrl: null,
    dbName: null,
    s3Region: null,
    s3AccessKey: null,
    s3SecretKey: null,
    s3Bucket: null,
    s3Endpoint: null,
    s3ForcePathStyle: null,
    redisHost: null,
    redisPort: null,
    redisDb: null,
    redisUsername: null,
    redisPassword: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "appointments") {
      out.mode = "appointments";
      continue;
    }
    if (a === "--yes" || a === "-y") {
      out.yes = true;
      continue;
    }
    if (a === "--appointments") {
      out.appointments = true;
      continue;
    }
    if (a === "--no-appointments") {
      out.appointments = false;
      continue;
    }
    if (a === "--purge" || a === "--purge-existing") {
      out.purge = true;
      continue;
    }

    const take = (prefix) => {
      if (a.startsWith(`${prefix}=`)) return a.slice(prefix.length + 1);
      if (a === prefix) return argv[++i] ?? null;
      return undefined;
    };

    let v;
    if ((v = take("--name")) !== undefined) out.name = v;
    else if ((v = take("--slug")) !== undefined) out.slug = v;
    else if ((v = take("--email-domain")) !== undefined) out.emailDomain = v;
    else if ((v = take("--plan")) !== undefined)
      out.plan = /** @type {any} */ (v);
    else if ((v = take("--users")) !== undefined) out.users = Number(v);
    else if ((v = take("--industry")) !== undefined) out.industry = v;
    else if ((v = take("--profession")) !== undefined) out.profession = v;
    else if ((v = take("--template")) !== undefined) out.template = v;
    else if ((v = take("--variant")) !== undefined) out.variant = v;
    else if ((v = take("--months")) !== undefined) out.months = Number(v) || 2;
    else if ((v = take("--password")) !== undefined) out.password = v;
    else if ((v = take("--timezone")) !== undefined) out.timeZone = v;
    else if ((v = take("--country")) !== undefined) out.country = v;
    else if ((v = take("--currency")) !== undefined) out.currency = v;
    else if ((v = take("--language")) !== undefined) out.language = v;
    else if ((v = take("--env-file")) !== undefined) out.envFile = v;
    else if ((v = take("--mongo-url")) !== undefined) out.mongoUrl = v;
    else if ((v = take("--db-name")) !== undefined) out.dbName = v;
    else if ((v = take("--s3-region")) !== undefined) out.s3Region = v;
    else if ((v = take("--s3-access-key")) !== undefined) out.s3AccessKey = v;
    else if ((v = take("--s3-secret-key")) !== undefined) out.s3SecretKey = v;
    else if ((v = take("--s3-bucket")) !== undefined) out.s3Bucket = v;
    else if ((v = take("--s3-endpoint")) !== undefined) out.s3Endpoint = v;
    else if (a === "--s3-force-path-style") out.s3ForcePathStyle = true;
    else if (a.startsWith("--s3-force-path-style=")) {
      out.s3ForcePathStyle =
        a.slice("--s3-force-path-style=".length).toLowerCase() === "true";
    } else if ((v = take("--redis-host")) !== undefined) out.redisHost = v;
    else if ((v = take("--redis-port")) !== undefined) out.redisPort = v;
    else if ((v = take("--redis-db")) !== undefined) out.redisDb = v;
    else if ((v = take("--redis-username")) !== undefined)
      out.redisUsername = v;
    else if ((v = take("--redis-password")) !== undefined)
      out.redisPassword = v;
    else if (!a.startsWith("-") && !out.slug) out.slug = a;
  }
  return out;
}

async function promptIfNeeded(rl, opts, key, label, fallback = "") {
  if (opts[key]?.toString().trim()) return String(opts[key]).trim();
  if (opts.yes) return fallback;
  const hint = fallback ? ` [${fallback}]` : "";
  const answer = (await rl.question(`${label}${hint}: `)).trim();
  return answer || fallback;
}

async function resolveMongo(rl, opts) {
  const defaultUri = process.env.MONGODB_URI || "";
  const defaultDb = process.env.MONGODB_DB || "hacado";
  const mongoUrl = await promptIfNeeded(
    rl,
    opts,
    "mongoUrl",
    "MongoDB URL",
    defaultUri,
  );
  const dbName = await promptIfNeeded(
    rl,
    opts,
    "dbName",
    "Database name",
    defaultDb,
  );
  if (!mongoUrl) throw new Error("MongoDB URL is required");
  return { mongoUrl, dbName };
}

async function resolveS3(rl, opts) {
  const defaults = {
    region: process.env.S3_REGION || "local",
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
    endpoint: process.env.S3_ENDPOINT || "http://localhost:8080",
    bucket: process.env.S3_BUCKET || "assets",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  };

  const region = await promptIfNeeded(
    rl,
    opts,
    "s3Region",
    "S3 region",
    defaults.region,
  );
  const accessKeyId =
    opts.s3AccessKey?.trim() ||
    defaults.accessKeyId ||
    (opts.yes
      ? defaults.accessKeyId
      : (
          await rl.question(
            `S3 access key${defaults.accessKeyId ? " [from env]" : ""}: `,
          )
        ).trim() || defaults.accessKeyId);
  const secretAccessKey =
    opts.s3SecretKey?.trim() ||
    defaults.secretAccessKey ||
    (opts.yes
      ? defaults.secretAccessKey
      : (
          await rl.question(
            `S3 secret key${defaults.secretAccessKey ? " [from env]" : ""}: `,
          )
        ).trim() || defaults.secretAccessKey);
  const bucket = await promptIfNeeded(
    rl,
    opts,
    "s3Bucket",
    "S3 bucket",
    defaults.bucket,
  );
  let endpoint = opts.s3Endpoint?.trim();
  if (!endpoint && !opts.yes) {
    endpoint = (
      await rl.question(
        `S3 endpoint (optional, space for AWS) [${defaults.endpoint}]: `,
      )
    ).trim();
  }
  endpoint = endpoint === " " ? undefined : endpoint || defaults.endpoint;
  const forcePathStyle =
    opts.s3ForcePathStyle != null
      ? opts.s3ForcePathStyle
      : defaults.forcePathStyle;

  if (!region || !bucket) throw new Error("S3 region and bucket are required");
  return {
    region,
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint: endpoint || undefined,
    forcePathStyle,
  };
}

async function resolveRedis(rl, opts) {
  const envHost = process.env.REDIS_HOST || "";
  const defaultHost =
    !envHost || envHost === "redis" || envHost === "hacado-redis-1"
      ? "localhost"
      : envHost;
  const defaults = {
    host: defaultHost,
    port: process.env.REDIS_PORT || "6379",
    db: process.env.REDIS_DB || "0",
    username: process.env.REDIS_USERNAME || "",
    password: process.env.REDIS_PASSWORD || "",
  };
  const host = await promptIfNeeded(
    rl,
    opts,
    "redisHost",
    "Redis host",
    defaults.host,
  );
  const port = await promptIfNeeded(
    rl,
    opts,
    "redisPort",
    "Redis port",
    defaults.port,
  );
  const db = await promptIfNeeded(
    rl,
    opts,
    "redisDb",
    "Redis DB index",
    defaults.db,
  );
  const username = opts.redisUsername?.trim() || defaults.username;
  const password = opts.redisPassword?.trim() || defaults.password;
  return {
    host,
    port: Number(port),
    db: Number(db),
    username: username || undefined,
    password: password || undefined,
  };
}

async function upsertConfig(db, organizationId, key, value) {
  const col = db.collection(COLLECTIONS.configuration);
  const existing = await col.findOne({ ...orgIdMatch(organizationId), key });
  if (existing) {
    await col.updateOne({ _id: existing._id }, { $set: { value } });
    return;
  }
  await col.insertOne({ _id: newId(), organizationId, key, value });
}

async function upsertHeader(db, organizationId, header, now) {
  const col = db.collection(COLLECTIONS.headers);
  const existing = await col.findOne({
    ...orgIdMatch(organizationId),
    name: header.name,
  });
  const doc = { ...header, organizationId, updatedAt: now };
  if (existing) {
    await col.updateOne({ _id: existing._id }, { $set: doc });
    return String(existing._id);
  }
  const _id = newId();
  await col.insertOne({ ...doc, _id, createdAt: now });
  return _id;
}

async function upsertFooter(db, organizationId, footer, now) {
  const col = db.collection(COLLECTIONS.footers);
  const existing = await col.findOne({
    ...orgIdMatch(organizationId),
    name: footer.name,
  });
  const doc = { ...footer, organizationId, updatedAt: now };
  if (existing) {
    await col.updateOne({ _id: existing._id }, { $set: doc });
    return String(existing._id);
  }
  const _id = newId();
  await col.insertOne({ ...doc, _id, createdAt: now });
  return _id;
}

async function upsertPage(db, organizationId, page, headerId, footerId, now) {
  const col = db.collection(COLLECTIONS.pages);
  const existing = await col.findOne({
    ...orgIdMatch(organizationId),
    slug: page.slug,
  });
  const doc = {
    title: page.title,
    slug: page.slug,
    description: page.description,
    keywords: page.keywords,
    published: page.published !== false,
    publishDate: now,
    fullWidth: page.fullWidth !== false,
    headerId,
    footerId,
    content: page.content,
    organizationId,
    updatedAt: now,
  };
  if (existing) {
    await col.updateOne({ _id: existing._id }, { $set: doc });
    return { id: String(existing._id), action: "updated" };
  }
  const _id = newId();
  await col.insertOne({ ...doc, _id, createdAt: now });
  return { id: _id, action: "created" };
}

async function seedAppointmentsForOrg(
  db,
  { organizationId, months, timeZone },
) {
  const members = await db
    .collection(COLLECTIONS.members)
    .find({ ...orgIdMatch(organizationId), status: "active" })
    .toArray();
  if (!members.length) throw new Error("No active members for appointments");

  const booking = await db.collection(COLLECTIONS.configuration).findOne({
    ...orgIdMatch(organizationId),
    key: "booking",
  });
  const optionIds = (booking?.value?.catalog || [])
    .map((c) => c.optionId || c.id)
    .filter(Boolean);
  const options = await db
    .collection(COLLECTIONS.options)
    .find({
      ...orgIdMatch(organizationId),
      ...(optionIds.length ? { _id: { $in: optionIds } } : {}),
    })
    .toArray();
  if (!options.length) throw new Error("No services/options found for org");

  // Make all members eligible for all options (job-title price overrides).
  for (const opt of options) {
    const staff = staffAssignmentsForMembers(members, opt.price, opt.duration);
    await db
      .collection(COLLECTIONS.options)
      .updateOne({ _id: opt._id }, { $set: { staff, updatedAt: new Date() } });
    opt.staff = staff;
  }

  const slots = generateAppointmentSlots({
    members: members.map((m) => ({ _id: String(m._id) })),
    options: options.map((o) => ({
      _id: String(o._id),
      name: o.name,
      duration: o.duration || o.durationMin || 60,
      price: o.price,
      staff: o.staff,
      durationType: o.durationType || "fixed",
      isOnline: !!o.isOnline,
    })),
    months,
    timeZone: timeZone || "UTC",
    breakMinutes: booking?.value?.breakDuration ?? 15,
  });

  const customersCol = db.collection(COLLECTIONS.customers);
  const apptsCol = db.collection(COLLECTIONS.appointments);
  let inserted = 0;
  const now = new Date();

  for (const slot of slots) {
    const customerId = newId();
    await customersCol.insertOne({
      _id: customerId,
      organizationId,
      name: slot.customer.name,
      email: slot.customer.email,
      phone: slot.customer.phone,
      knownNames: [slot.customer.name],
      knownEmails: [slot.customer.email],
      knownPhones: [slot.customer.phone],
      requireDeposit: "inherit",
      createdAt: now,
      updatedAt: now,
    });

    const price = effectiveSeedStaffPrice(
      slot.option.price,
      slot.option.staff,
      slot.memberId,
    );
    const duration = effectiveSeedStaffDuration(
      slot.option.duration,
      slot.option.staff,
      slot.memberId,
    );

    await apptsCol.insertOne({
      _id: newId(),
      organizationId,
      status: "confirmed",
      createdAt: now,
      customerId,
      memberId: slot.memberId,
      dateTime: slot.dateTime,
      timeZone: slot.timeZone,
      totalDuration: duration,
      totalPrice: price,
      fields: {
        name: slot.customer.name,
        email: slot.customer.email,
        phone: slot.customer.phone,
      },
      option: {
        _id: slot.option._id,
        name: slot.option.name,
        durationType: slot.option.durationType,
        isOnline: slot.option.isOnline,
        duration,
        price,
      },
    });
    inserted += 1;
  }

  console.log(
    `Seeded ${inserted} appointments across ${members.length} members (${months} months).`,
  );
  return inserted;
}

async function seedOrg(db, s3Config, redisConfig, opts, resolved) {
  const {
    name,
    slug,
    emailDomain,
    plan,
    userCount,
    industry,
    profession,
    template,
    variant,
    password,
    timeZone,
    country,
    currency,
    language,
    withAppointments,
    months,
  } = resolved;

  const existing = await db.collection(COLLECTIONS.orgs).findOne({ slug });
  if (existing) {
    if (!opts.purge) {
      throw new Error(
        `Organization slug "${slug}" already exists (${existing._id}). Re-run with --purge to replace it, or use appointments mode.`,
      );
    }
    await purgeOrganizationBySlug(
      db,
      slug,
      {
        client: createS3Client(s3Config),
        bucket: s3Config.bucket,
      },
      redisConfig,
    );
  }

  ensurePackMediaBundle();
  await loadWebsitePacks();

  const catalog = loadCatalog();
  const serviceCount = plan === "free" ? 1 : 5;
  const picked = pickIndustryServices(
    catalog,
    industry,
    profession,
    serviceCount,
  );
  const packId = resolveTemplate(industry, template, variant);
  const { base: packBase, variant: packVariant } = parsePackId(packId);
  console.log(
    `Industry ${picked.categoryId}/${picked.professionId} → ${picked.services.length} services; template=${packId} (base=${packBase}, variant=${packVariant})`,
  );

  const now = new Date();
  const organizationId = newId();
  const productId = polarProductIdForTier(plan);
  const seats = plan === "studio" ? Math.max(userCount, 1) : 1;

  /** @type {Record<string, unknown>} */
  const orgDoc = {
    _id: organizationId,
    slug,
    name,
    createdAt: now,
    isInstalled: true,
    userSlots: {
      included: seats,
      additional: 0,
    },
    availableUsers: seats,
    userSlotGrants: [],
    allowAdditionalUsers: plan === "studio",
    polarSubscriptionStatus: "active",
  };

  if (productId) {
    orgDoc.polarSubscriptionProductId = productId;
    orgDoc.polarSubscriptionId = `seed-${plan}-${organizationId}`;
  } else if (plan === "studio") {
    orgDoc.feesExempt = true;
    console.log(
      "POLAR_BILLING_PLANS missing studio product — setting feesExempt for Studio access.",
    );
  } else if (plan === "free" || plan === "solo") {
    console.warn(
      `Warning: no Polar product id for plan "${plan}". Entitlements may fall back incorrectly until POLAR_BILLING_PLANS is set.`,
    );
  }

  await db.collection(COLLECTIONS.orgs).insertOne(orgDoc);
  console.log(`Created organization ${slug} (${organizationId})`);

  const passwordHash = await hashPassword(password);
  const members = [];
  const roles = ["owner", "admin", "coordinator", "staff"];

  for (let i = 0; i < userCount; i++) {
    const userId = newId();
    const memberId = newId();
    const role = i === 0 ? "owner" : roles[Math.min(i, roles.length - 1)];
    const person = staffPersonAt(i);
    const email =
      `${person.emailLocal}+${slug}@${emailDomain}`.toLowerCase();
    const displayName = person.name;
    const jobTitle = staffJobTitleAt(i, picked.professionLabel);

    await db.collection(COLLECTIONS.users).insertOne({
      _id: userId,
      email,
      name: displayName,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.collection(COLLECTIONS.accounts).insertOne({
      _id: newId(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    const member = {
      _id: memberId,
      organizationId,
      userId,
      role,
      createdAt: now,
      status: "active",
      email,
      name: displayName,
      jobTitle,
      phone: person.phone,
      language,
      calendarSources: [],
    };
    await db.collection(COLLECTIONS.members).insertOne(member);
    members.push(member);
    console.log(
      `  user ${displayName} <${email}> (${role}) — ${jobTitle}`,
    );
  }

  const optionIds = [];
  for (const svc of picked.services) {
    const optionId = newId();
    const staff = staffAssignmentsForMembers(members, svc.price, svc.duration);
    await db.collection(COLLECTIONS.options).insertOne({
      _id: optionId,
      organizationId,
      name: svc.name,
      description: svc.description,
      durationType: "fixed",
      duration: svc.duration,
      price: svc.price,
      requireDeposit: "inherit",
      isOnline: false,
      isAutoConfirm: "inherit",
      duplicateAppointmentCheck: { enabled: false },
      cancellationPolicy: {
        withDeposit: { type: "inherit" },
        withoutDeposit: { type: "inherit" },
      },
      reschedulePolicy: { type: "inherit" },
      staff,
      updatedAt: now,
    });
    optionIds.push(optionId);
    console.log(`  service ${svc.name} (${svc.duration}m / ${svc.price})`);
  }

  const ownerEmail = members[0].email;
  const generalIndustry =
    picked.categoryId === "misc" ? "other" : picked.categoryId;
  await upsertConfig(db, organizationId, "general", {
    name,
    industry: generalIndustry,
    email: ownerEmail,
    country,
    currency,
    timeZone,
  });
  console.log(`  general.industry=${generalIndustry}`);
  await upsertConfig(db, organizationId, "brand", {
    title: name,
    description: `${name} online booking`,
    keywords: name,
    language,
  });
  await upsertConfig(db, organizationId, "booking", defaultBooking(optionIds));
  await upsertConfig(db, organizationId, "schedule", defaultSchedule());
  const pack = await getWebsitePack(packId);
  await upsertConfig(db, organizationId, "styling", {
    colors: [
      { type: "primary", value: pack?.theme?.colors?.primary ?? "#0f766e" },
      { type: "secondary", value: pack?.theme?.colors?.dark ?? "#0f172a" },
      { type: "secondary-foreground", value: "#ffffff" },
    ],
    fonts: {
      primary: pack?.theme?.fonts?.primary ?? "Inter",
      secondary: pack?.theme?.fonts?.secondary ?? "Inter",
    },
  });

  const s3 = createS3Client(s3Config);
  console.log("Uploading template media to S3…");
  const remoteUrls = await collectPackRemoteUrls(packId);
  const assetUrls = await uploadRemoteImages({
    db,
    s3,
    bucket: s3Config.bucket,
    organizationId,
    urls: remoteUrls,
  });
  const logoUrls = await uploadLocalTemplateLogos({
    db,
    s3,
    bucket: s3Config.bucket,
    organizationId,
    packId,
  });
  for (const [k, v] of logoUrls) assetUrls.set(k, v);

  const builderI18n = loadBuilderI18n();
  const pages = await buildPackPages({
    packId,
    orgName: name,
    services: picked.services,
    builderI18n,
    assetUrls,
  });

  const headerId = await upsertHeader(db, organizationId, buildHeader(), now);
  const overlayHeaderId = await upsertHeader(
    db,
    organizationId,
    buildOverlayHeader(),
    now,
  );
  const footerId = await upsertFooter(
    db,
    organizationId,
    {
      name: "Default Footer",
      content: pages.footerContent,
    },
    now,
  );

  // Home uses overlay header when the pack hero is overlay-style (matches install).
  const homeHeaderId = pages.useOverlayHeader ? overlayHeaderId : headerId;
  const homeResult = await upsertPage(
    db,
    organizationId,
    pages.home,
    homeHeaderId,
    footerId,
    now,
  );
  console.log(
    `  page /${pages.home.slug} (${homeResult.action})${
      pages.useOverlayHeader ? " [overlay header]" : ""
    }`,
  );

  const otherPages = [
    pages.booking,
    pages.modify,
    pages.about,
    pages.terms,
    ...pages.servicePages,
  ];
  for (const page of otherPages) {
    const result = await upsertPage(
      db,
      organizationId,
      page,
      headerId,
      footerId,
      now,
    );
    console.log(`  page /${page.slug} (${result.action})`);
  }

  await invalidatePageRouteCache(organizationId, redisConfig);

  if (withAppointments) {
    await seedAppointmentsForOrg(db, {
      organizationId,
      months,
      timeZone,
    });
  }

  console.log("\nDone.");
  console.log(`  Org:      ${name} (${slug})`);
  console.log(`  Plan:     ${plan}`);
  console.log(`  Template: ${packId}`);
  console.log(`  Login:    ${ownerEmail} / ${password}`);
  if (userCount > 1) {
    console.log(`  Users:    ${userCount} (same password)`);
  }
}

async function main() {
  const opts = parseArgs(process.argv);

  loadEnvIfPresent(REPO_ROOT);
  loadEnvIfPresent(path.join(REPO_ROOT, "apps/admin"));
  if (opts.envFile?.trim()) loadEnvFile(opts.envFile.trim());

  ensurePackMediaBundle();

  const rl = readline.createInterface({ input, output });

  try {
    const { mongoUrl, dbName } = await resolveMongo(rl, opts);

    let s3Config = null;
    let redisConfig = null;
    if (opts.mode === "seed") {
      s3Config = await resolveS3(rl, opts);
      redisConfig = await resolveRedis(rl, opts);
      const s3 = createS3Client(s3Config);
      console.log("Validating S3…");
      await validateS3Connection(s3, s3Config.bucket);
      console.log("Validating Redis…");
      await validateRedisConnection(redisConfig);
    }

    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);

    try {
      if (opts.mode === "appointments") {
        const slug = await promptIfNeeded(
          rl,
          opts,
          "slug",
          "Organization slug",
        );
        if (!slug) throw new Error("Organization slug is required");
        const org = await db.collection(COLLECTIONS.orgs).findOne({ slug });
        if (!org) throw new Error(`Organization not found: ${slug}`);
        const months = opts.months || 2;
        const general = await db.collection(COLLECTIONS.configuration).findOne({
          ...orgIdMatch(String(org._id)),
          key: "general",
        });
        await seedAppointmentsForOrg(db, {
          organizationId: String(org._id),
          months,
          timeZone: general?.value?.timeZone || "UTC",
        });
        return;
      }

      const catalog = loadCatalog();
      const industryIds = Object.keys(catalog.data).sort();

      const name = await promptIfNeeded(rl, opts, "name", "Organization name");
      const slug = await promptIfNeeded(
        rl,
        opts,
        "slug",
        "Organization slug",
        slugify(name),
      );
      const emailDomain = await promptIfNeeded(
        rl,
        opts,
        "emailDomain",
        "Base email domain",
        "hacado.com",
      );
      let plan = /** @type {'free'|'solo'|'studio'} */ (
        await promptIfNeeded(
          rl,
          opts,
          "plan",
          "Plan (free|solo|studio)",
          "studio",
        )
      );
      if (!["free", "solo", "studio"].includes(plan)) {
        throw new Error(`Invalid plan: ${plan}`);
      }

      let userCount = opts.users;
      if (userCount == null) {
        const fallback = plan === "studio" ? "3" : "1";
        const raw = await promptIfNeeded(
          rl,
          opts,
          "users",
          "Number of users",
          fallback,
        );
        userCount = Number(raw) || 1;
      }
      if (plan !== "studio") userCount = 1;
      if (plan === "studio" && userCount < 1) userCount = 1;

      const industry = await promptIfNeeded(
        rl,
        opts,
        "industry",
        `Industry (${industryIds.join("|")})`,
        "beauty",
      );
      if (!catalog.data[industry]) {
        throw new Error(
          `Unknown industry "${industry}". Available: ${industryIds.join(", ")}`,
        );
      }

      let profession = opts.profession;
      if (!profession && !opts.yes) {
        const profIds = Object.keys(catalog.data[industry]).sort();
        profession = (
          await rl.question(
            `Profession (optional [${profIds[0]}]; available: ${profIds.join(", ")}): `,
          )
        ).trim();
      }

      const suggestedBase = resolveTemplate(
        industry,
        opts.template,
        opts.variant || "a",
      );
      const suggestedParsed = parsePackId(suggestedBase);
      const templateInput = await promptIfNeeded(
        rl,
        opts,
        "template",
        `Website template (${BASE_PACK_IDS.join("|")})`,
        suggestedParsed.base,
      );
      const variant = await promptIfNeeded(
        rl,
        opts,
        "variant",
        `Template variant (${TEMPLATE_VARIANTS.join("|")} — series A/B/C)`,
        suggestedParsed.variant,
      );
      if (
        !TEMPLATE_VARIANTS.includes(String(variant).toLowerCase()) &&
        !["1", "2", "3", "series-a", "series-b", "series-c"].includes(
          String(variant).toLowerCase(),
        )
      ) {
        throw new Error(
          `Unknown variant "${variant}". Use one of: ${TEMPLATE_VARIANTS.join(", ")}`,
        );
      }
      const packId = resolveTemplate(industry, templateInput, variant);
      const available = await listPackIds();
      if (!available.includes(packId)) {
        throw new Error(
          `Unknown pack "${packId}". Available: ${available.join(", ")}`,
        );
      }
      const template = templateInput;

      let withAppointments = opts.appointments;
      if (
        !opts.yes &&
        opts.appointments === false &&
        process.argv.every(
          (a) => a !== "--no-appointments" && a !== "--appointments",
        )
      ) {
        const ans = (await rl.question("Seed future appointments? [y/N]: "))
          .trim()
          .toLowerCase();
        withAppointments = ans === "y" || ans === "yes";
      }

      const password =
        opts.password?.trim() ||
        (opts.yes
          ? "SeedOrg123!"
          : (await rl.question("Password for users [SeedOrg123!]: ")).trim() ||
            "SeedOrg123!");

      const timeZone = await promptIfNeeded(
        rl,
        opts,
        "timeZone",
        "Timezone",
        "America/New_York",
      );
      const country = await promptIfNeeded(
        rl,
        opts,
        "country",
        "Country",
        "US",
      );
      const currency = await promptIfNeeded(
        rl,
        opts,
        "currency",
        "Currency",
        "USD",
      );
      const language = await promptIfNeeded(
        rl,
        opts,
        "language",
        "Language",
        "en",
      );
      const months = opts.months || 2;

      if (!name || !slug || !emailDomain) {
        throw new Error("name, slug, and email-domain are required");
      }

      console.log("\nSeeding with:");
      console.log(
        `  name=${name} slug=${slug} plan=${plan} users=${userCount}`,
      );
      console.log(
        `  industry=${industry} profession=${profession || "(auto)"} template=${template} variant=${variant} → ${packId}`,
      );
      console.log(
        `  appointments=${withAppointments} months=${months} purge=${opts.purge} email=*@${emailDomain}`,
      );

      await seedOrg(db, s3Config, redisConfig, opts, {
        name,
        slug,
        emailDomain,
        plan,
        userCount,
        industry,
        profession: profession || null,
        template,
        variant,
        password,
        timeZone,
        country,
        currency,
        language,
        withAppointments,
        months,
      });
    } finally {
      await client.close();
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err?.stack || err);
  process.exit(1);
});
