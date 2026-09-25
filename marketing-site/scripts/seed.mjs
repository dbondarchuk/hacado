/**
 * Seed the Hacado marketing site into page-builder collections.
 *
 * Upserts:
 *   - page-headers named "Main Header" and "Hero Header"
 *   - page-footers named "Main Footer"
 *   - pages by slug (home page slug is "home"), each with its `headerName`
 *   - marketing images as org assets (S3 + assets collection), rewriting
 *     `/assets/...` source paths to `/assets/svg/...` or `/assets/marketing/...`
 *   - invalidates Redis page-route cache (`org:pages:routes:{orgId}`) so new
 *     slugs are visible immediately
 *
 * Usage (from marketing-site):
 *   yarn seed
 *   node scripts/seed.mjs <organizationSlug>
 *   node scripts/seed.mjs <slug> --env-file=../.env --yes --generate
 *   node scripts/seed.mjs <slug> --mongo-url=... --db-name=...
 *
 * Env file:
 *   --env-file=path   load this file (override). Also loads repo /.env and
 *                     apps/admin/.env.local when present.
 *
 * S3 (env / flags):
 *   S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET
 *   optional: S3_ENDPOINT, S3_FORCE_PATH_STYLE=true
 *   flags: --s3-region= --s3-access-key= --s3-secret-key= --s3-bucket=
 *          --s3-endpoint= --s3-force-path-style
 *
 * Redis (env / flags) — required to invalidate page-route cache:
 *   REDIS_HOST, REDIS_PORT, REDIS_DB, REDIS_USERNAME, REDIS_PASSWORD
 *   flags: --redis-host= --redis-port= --redis-db=
 *          --redis-username= --redis-password=
 *
 * Prompts for organization slug, MongoDB, S3, and Redis when not passed / --yes.
 * Validates S3 (HeadBucket) and Redis (PING) before writing.
 *
 * Regenerates structure JSON first only if --generate is passed.
 */
import dotenv from "dotenv";
import Redis from "ioredis";
import { MongoClient, ObjectId } from "mongodb";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import {
  createS3Client,
  uploadAndRewriteStructure,
  validateS3Connection,
} from "./seed-assets.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STRUCTURE = path.join(__dirname, "structure");

const PAGES_COLLECTION = "pages";
const HEADERS_COLLECTION = "page-headers";
const FOOTERS_COLLECTION = "page-footers";
const ORGS_COLLECTION = "organizations";
const PAGE_ROUTES_REDIS_PREFIX = "org:pages:routes:";

/** @param {string} filePath */
function loadEnvFile(filePath, { override = true } = {}) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Env file not found: ${resolved}`);
  }
  const result = dotenv.config({ path: resolved, override });
  if (result.error) throw result.error;
  console.log(`Loaded env from ${resolved}`);
}

/** @param {string} dir */
function loadEnvIfPresent(dir) {
  for (const name of [".env", ".env.local"]) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) dotenv.config({ path: p, override: true });
  }
}

/**
 * @typedef {{
 *   organizationSlug: string | null,
 *   mongoUrl: string | null,
 *   dbName: string | null,
 *   skipGenerate: boolean,
 *   generate: boolean,
 *   yes: boolean,
 *   envFile: string | null,
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

/**
 * @typedef {{
 *   host: string,
 *   port: number,
 *   db: number,
 *   username?: string,
 *   password?: string,
 * }} RedisConfig
 */

/** @param {string[]} argv */
function parseArgs(argv) {
  /** @type {CliOpts} */
  const out = {
    organizationSlug: null,
    mongoUrl: null,
    dbName: null,
    skipGenerate: false,
    generate: false,
    yes: false,
    envFile: null,
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
    if (a === "--skip-generate") {
      out.skipGenerate = true;
      continue;
    }
    if (a === "--generate") {
      out.generate = true;
      continue;
    }
    if (a === "--yes" || a === "-y") {
      out.yes = true;
      continue;
    }
    if (a.startsWith("--env-file=")) {
      out.envFile = a.slice("--env-file=".length);
      continue;
    }
    if (a === "--env-file") {
      out.envFile = argv[++i] ?? null;
      continue;
    }
    if (a.startsWith("--mongo-url=")) {
      out.mongoUrl = a.slice("--mongo-url=".length);
      continue;
    }
    if (a === "--mongo-url") {
      out.mongoUrl = argv[++i] ?? null;
      continue;
    }
    if (a.startsWith("--db-name=")) {
      out.dbName = a.slice("--db-name=".length);
      continue;
    }
    if (a === "--db-name") {
      out.dbName = argv[++i] ?? null;
      continue;
    }
    if (a.startsWith("--s3-region=")) {
      out.s3Region = a.slice("--s3-region=".length);
      continue;
    }
    if (a === "--s3-region") {
      out.s3Region = argv[++i] ?? null;
      continue;
    }
    if (a.startsWith("--s3-access-key=")) {
      out.s3AccessKey = a.slice("--s3-access-key=".length);
      continue;
    }
    if (a === "--s3-access-key") {
      out.s3AccessKey = argv[++i] ?? null;
      continue;
    }
    if (a.startsWith("--s3-secret-key=")) {
      out.s3SecretKey = a.slice("--s3-secret-key=".length);
      continue;
    }
    if (a === "--s3-secret-key") {
      out.s3SecretKey = argv[++i] ?? null;
      continue;
    }
    if (a.startsWith("--s3-bucket=")) {
      out.s3Bucket = a.slice("--s3-bucket=".length);
      continue;
    }
    if (a === "--s3-bucket") {
      out.s3Bucket = argv[++i] ?? null;
      continue;
    }
    if (a.startsWith("--s3-endpoint=")) {
      out.s3Endpoint = a.slice("--s3-endpoint=".length);
      continue;
    }
    if (a === "--s3-endpoint") {
      out.s3Endpoint = argv[++i] ?? null;
      continue;
    }
    if (a === "--s3-force-path-style") {
      out.s3ForcePathStyle = true;
      continue;
    }
    if (a.startsWith("--s3-force-path-style=")) {
      out.s3ForcePathStyle =
        a.slice("--s3-force-path-style=".length).toLowerCase() === "true";
      continue;
    }
    if (a.startsWith("--redis-host=")) {
      out.redisHost = a.slice("--redis-host=".length);
      continue;
    }
    if (a === "--redis-host") {
      out.redisHost = argv[++i] ?? null;
      continue;
    }
    if (a.startsWith("--redis-port=")) {
      out.redisPort = a.slice("--redis-port=".length);
      continue;
    }
    if (a === "--redis-port") {
      out.redisPort = argv[++i] ?? null;
      continue;
    }
    if (a.startsWith("--redis-db=")) {
      out.redisDb = a.slice("--redis-db=".length);
      continue;
    }
    if (a === "--redis-db") {
      out.redisDb = argv[++i] ?? null;
      continue;
    }
    if (a.startsWith("--redis-username=")) {
      out.redisUsername = a.slice("--redis-username=".length);
      continue;
    }
    if (a === "--redis-username") {
      out.redisUsername = argv[++i] ?? null;
      continue;
    }
    if (a.startsWith("--redis-password=")) {
      out.redisPassword = a.slice("--redis-password=".length);
      continue;
    }
    if (a === "--redis-password") {
      out.redisPassword = argv[++i] ?? null;
      continue;
    }
    if (!a.startsWith("-") && !out.organizationSlug) {
      out.organizationSlug = a;
    }
  }
  return out;
}

function generateStructure() {
  console.log("Generating page-builder structure JSON…");
  const result = spawnSync(
    "npx",
    ["--yes", "tsx", path.join(__dirname, "generate.ts")],
    { stdio: "inherit", shell: true, cwd: __dirname },
  );
  if (result.status !== 0) {
    throw new Error("generate.ts failed");
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadStructure() {
  const indexPath = path.join(STRUCTURE, "index.json");
  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `Missing ${indexPath}. Run generate.mjs first or omit --skip-generate.`,
    );
  }
  const index = readJson(indexPath);
  const headerEntries = Array.isArray(index.headers)
    ? index.headers
    : [{ name: index.headerName, file: index.header }];
  const headers = headerEntries.map((h) =>
    readJson(path.join(STRUCTURE, h.file)),
  );
  const footer = readJson(path.join(STRUCTURE, index.footer));
  const pages = index.pages.map((p) => {
    const page = readJson(path.join(STRUCTURE, p.file));
    return {
      ...page,
      headerName: page.headerName ?? p.headerName ?? index.headerName,
    };
  });
  return {
    headers,
    header: headers[0],
    footer,
    pages,
    defaultHeaderName: index.headerName ?? headers[0]?.name,
  };
}

/** @param {string} id */
function orgIdMatch(id) {
  const or = [{ organizationId: id }];
  if (ObjectId.isValid(id)) {
    or.push({ organizationId: new ObjectId(id) });
  }
  return { $or: or };
}

async function upsertHeader(col, organizationId, header, now) {
  const existing = await col.findOne({
    ...orgIdMatch(organizationId),
    name: header.name,
  });
  const doc = {
    ...header,
    organizationId,
    updatedAt: now,
  };
  if (existing) {
    await col.updateOne({ _id: existing._id }, { $set: doc });
    return String(existing._id);
  }
  const _id = new ObjectId().toString();
  await col.insertOne({ ...doc, _id });
  return _id;
}

async function upsertFooter(col, organizationId, footer, now) {
  const existing = await col.findOne({
    ...orgIdMatch(organizationId),
    name: footer.name,
  });
  const doc = {
    ...footer,
    organizationId,
    updatedAt: now,
  };
  if (existing) {
    await col.updateOne({ _id: existing._id }, { $set: doc });
    return String(existing._id);
  }
  const _id = new ObjectId().toString();
  await col.insertOne({ ...doc, _id });
  return _id;
}

async function upsertPage(col, organizationId, page, headerId, footerId, now) {
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
    ...(page.doNotCombine ? { doNotCombine: page.doNotCombine } : {}),
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
  const _id = new ObjectId().toString();
  await col.insertOne({ ...doc, _id, createdAt: now });
  return { id: _id, action: "created" };
}

/** @param {RedisConfig} config */
function createRedisClient(config) {
  return new Redis({
    host: config.host,
    port: config.port,
    db: config.db,
    password: config.password || undefined,
    username: config.username || undefined,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
}

/** @param {RedisConfig} config */
async function validateRedisConnection(config) {
  const redis = createRedisClient(config);
  try {
    await redis.connect();
    const pong = await redis.ping();
    if (pong !== "PONG") {
      throw new Error(`Unexpected Redis PING response: ${pong}`);
    }
  } finally {
    redis.disconnect();
  }
}

/**
 * Invalidate CachedPagesService route table so newly seeded slugs resolve.
 * @param {string} organizationId
 * @param {RedisConfig} config
 */
async function invalidatePageRouteCache(organizationId, config) {
  const redis = createRedisClient(config);
  try {
    await redis.connect();
    const key = `${PAGE_ROUTES_REDIS_PREFIX}${organizationId}`;
    const n = await redis.del(key);
    console.log(
      n
        ? `Invalidated Redis page-route cache (${key}).`
        : `Redis page-route cache key absent (${key}); nothing to clear.`,
    );
  } finally {
    redis.disconnect();
  }
}

/**
 * @param {import('node:readline/promises').Interface} rl
 * @param {CliOpts} opts
 */
async function resolveS3Config(rl, opts) {
  const defaults = {
    region: process.env.S3_REGION || "local",
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
    endpoint: process.env.S3_ENDPOINT || "http://localhost:8080",
    bucket: process.env.S3_BUCKET || "assets",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  };

  let region = opts.s3Region?.trim() || "";
  let accessKeyId = opts.s3AccessKey?.trim() || "";
  let secretAccessKey = opts.s3SecretKey?.trim() || "";
  let bucket = opts.s3Bucket?.trim() || "";
  let endpoint = opts.s3Endpoint?.trim() || "";
  let forcePathStyle =
    opts.s3ForcePathStyle != null
      ? opts.s3ForcePathStyle
      : defaults.forcePathStyle;

  if (!opts.yes) {
    if (!region) {
      region = (
        await rl.question(
          `S3 region${defaults.region ? ` [${defaults.region}]` : ""}: `,
        )
      ).trim();
    }
    if (!accessKeyId) {
      accessKeyId = (
        await rl.question(
          `S3 access key${defaults.accessKeyId ? " [from env]" : ""}: `,
        )
      ).trim();
    }
    if (!secretAccessKey) {
      secretAccessKey = (
        await rl.question(
          `S3 secret key${defaults.secretAccessKey ? " [from env]" : ""}: `,
        )
      ).trim();
    }
    if (!bucket) {
      bucket = (await rl.question(`S3 bucket [${defaults.bucket}]: `)).trim();
    }
    if (!endpoint) {
      endpoint = (
        await rl.question(
          `S3 endpoint (optional, use space for AWS) [${defaults.endpoint}]: `,
        )
      ).trim();
    }
  }

  region = region || defaults.region;
  accessKeyId = accessKeyId || defaults.accessKeyId;
  secretAccessKey = secretAccessKey || defaults.secretAccessKey;
  bucket = bucket || defaults.bucket;
  endpoint = endpoint === " " ? undefined : endpoint || defaults.endpoint;

  if (!region || !bucket) {
    throw new Error(
      "S3 region, and bucket are required (prompt, flags, or S3_* env).",
    );
  }

  return {
    region,
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint: endpoint || undefined,
    forcePathStyle,
  };
}

/**
 * @param {import('node:readline/promises').Interface} rl
 * @param {CliOpts} opts
 * @returns {Promise<RedisConfig>}
 */
async function resolveRedisConfig(rl, opts) {
  const envHost = process.env.REDIS_HOST || "";
  // Docker compose hostnames are not reachable from the host machine.
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

  let host = opts.redisHost?.trim() || "";
  let port = opts.redisPort?.trim() || "";
  let db = opts.redisDb?.trim() || "";
  let username = opts.redisUsername?.trim() || "";
  let password = opts.redisPassword?.trim() || "";

  if (!opts.yes) {
    if (!host) {
      host = (
        await rl.question(`Redis host [${defaults.host}]: `)
      ).trim();
    }
    if (!port) {
      port = (
        await rl.question(`Redis port [${defaults.port}]: `)
      ).trim();
    }
    if (!db) {
      db = (await rl.question(`Redis DB index [${defaults.db}]: `)).trim();
    }
    if (!username) {
      username = (
        await rl.question(
          `Redis username (optional${defaults.username ? " [from env]" : ""}): `,
        )
      ).trim();
    }
    if (!password) {
      password = (
        await rl.question(
          `Redis password (optional${defaults.password ? " [from env]" : ""}): `,
        )
      ).trim();
    }
  }

  host = host || defaults.host;
  port = port || defaults.port;
  db = db || defaults.db;
  username = username || defaults.username;
  password = password || defaults.password;

  if (!host) {
    throw new Error(
      "Redis host is required (prompt, --redis-host, or REDIS_HOST).",
    );
  }

  const portNum = Number(port);
  const dbNum = Number(db);
  if (!Number.isFinite(portNum) || portNum <= 0) {
    throw new Error(`Invalid Redis port: ${port}`);
  }
  if (!Number.isFinite(dbNum) || dbNum < 0) {
    throw new Error(`Invalid Redis DB index: ${db}`);
  }

  return {
    host,
    port: portNum,
    db: dbNum,
    username: username || undefined,
    password: password || undefined,
  };
}

async function main() {
  const opts = parseArgs(process.argv);

  // Default env from monorepo, then optional --env-file (highest priority).
  loadEnvIfPresent(path.resolve(__dirname, "../.."));
  loadEnvIfPresent(path.resolve(__dirname, "../../apps/admin"));
  if (opts.envFile?.trim()) {
    loadEnvFile(opts.envFile.trim(), { override: true });
  }

  const rl = readline.createInterface({ input, output });

  try {
    let slug = opts.organizationSlug?.trim() || "";
    if (!slug) {
      slug = (await rl.question("Organization slug: ")).trim();
    }
    if (!slug) {
      console.error("Organization slug is required.");
      process.exit(1);
    }

    const defaultUri = process.env.MONGODB_URI || "";
    const defaultDb = process.env.MONGODB_DB || "hacado";

    let mongoUrl = opts.mongoUrl?.trim() || "";
    if (!mongoUrl && !opts.yes) {
      const hint = defaultUri ? ` [${defaultUri}]` : "";
      mongoUrl = (await rl.question(`MongoDB URL (optional${hint}): `)).trim();
    }
    mongoUrl = mongoUrl || defaultUri;
    if (!mongoUrl) {
      console.error(
        "MongoDB URL is required (prompt, --mongo-url, or MONGODB_URI).",
      );
      process.exit(1);
    }

    let dbName = opts.dbName?.trim() || "";
    if (!dbName && !opts.yes) {
      dbName = (
        await rl.question(`Database name (optional [${defaultDb}]): `)
      ).trim();
    }
    dbName = dbName || defaultDb;

    const s3Config = await resolveS3Config(rl, opts);
    const s3 = createS3Client(s3Config);
    console.log(
      `Validating S3 bucket "${s3Config.bucket}" (${s3Config.region}${s3Config.endpoint ? ` @ ${s3Config.endpoint}` : ""})…`,
    );
    try {
      await validateS3Connection(s3, s3Config.bucket);
    } catch (err) {
      console.error(
        "S3 connection failed. Fix credentials/bucket before seeding.",
      );
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
    console.log("S3 OK.");

    const redisConfig = await resolveRedisConfig(rl, opts);
    console.log(
      `Validating Redis ${redisConfig.host}:${redisConfig.port}/${redisConfig.db}…`,
    );
    try {
      await validateRedisConnection(redisConfig);
    } catch (err) {
      console.error(
        "Redis connection failed. Fix host/port/auth before seeding (page-route cache must be cleared).",
      );
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
    console.log("Redis OK.");

    if (opts.generate && !opts.skipGenerate) {
      generateStructure();
    }

    const structure = loadStructure();
    console.log(
      `Loaded ${structure.pages.length} pages, ${structure.headers.length} headers (${structure.headers
        .map((h) => `"${h.name}"`)
        .join(", ")}), footer "${structure.footer.name}".`,
    );
    console.log(`Connecting ${mongoUrl} / ${dbName} as org slug "${slug}"…`);

    const client = new MongoClient(mongoUrl);
    await client.connect();
    try {
      const db = client.db(dbName);
      const org = await db.collection(ORGS_COLLECTION).findOne({ slug });
      if (!org) {
        console.error(`No organization with slug "${slug}".`);
        process.exit(1);
      }
      const organizationId = String(org._id);
      const now = new Date();

      console.log("Uploading / resolving marketing assets…");
      const rewritten = await uploadAndRewriteStructure(
        db,
        organizationId,
        s3,
        s3Config,
        structure,
      );
      console.log(
        `Assets: ${rewritten.uploaded} uploaded, ${rewritten.updated} updated, ${rewritten.reused} reused.`,
      );

      /** @type {Record<string, string>} */
      const headerIdsByName = {};
      for (const header of rewritten.headers) {
        const headerId = await upsertHeader(
          db.collection(HEADERS_COLLECTION),
          organizationId,
          header,
          now,
        );
        headerIdsByName[header.name] = headerId;
        console.log(`Header "${header.name}" → ${headerId}`);
      }

      const footerId = await upsertFooter(
        db.collection(FOOTERS_COLLECTION),
        organizationId,
        rewritten.footer,
        now,
      );
      console.log(`Footer "${rewritten.footer.name}" → ${footerId}`);

      const fallbackHeaderId =
        headerIdsByName[structure.defaultHeaderName] ??
        Object.values(headerIdsByName)[0];

      let created = 0;
      let updated = 0;
      for (const page of rewritten.pages) {
        const headerId =
          headerIdsByName[page.headerName] ?? fallbackHeaderId;
        const result = await upsertPage(
          db.collection(PAGES_COLLECTION),
          organizationId,
          page,
          headerId,
          footerId,
          now,
        );
        if (result.action === "created") created += 1;
        else updated += 1;
        console.log(
          `  ${result.action} /${page.slug} (header: ${page.headerName ?? structure.defaultHeaderName})`,
        );
      }

      await invalidatePageRouteCache(organizationId, redisConfig);

      console.log(
        `Done. ${created} created, ${updated} updated. headers=${JSON.stringify(headerIdsByName)} footerId=${footerId}`,
      );
    } finally {
      await client.close();
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
