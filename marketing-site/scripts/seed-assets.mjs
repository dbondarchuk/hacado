/**
 * Upload marketing-site public images as organization assets (S3 + Mongo),
 * then rewrite structure JSON image paths to `/assets/{filename}`.
 */
import {
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_ASSETS = path.join(__dirname, "../public/assets");
const ASSETS_COLLECTION = "assets";

const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

/**
 * @typedef {{
 *   region: string,
 *   accessKeyId: string,
 *   secretAccessKey: string,
 *   endpoint?: string,
 *   bucket: string,
 *   forcePathStyle: boolean,
 * }} S3Config
 */

/**
 * Map public `/assets/...` paths to org asset filenames (folders preserved).
 * - `/assets/svg/check.svg` → `svg/check.svg`
 * - `/assets/generated/hero.png` → `marketing/generated/hero.png`
 * - `/assets/photos/...`, `/assets/logos/...` → under `marketing/`
 *
 * @param {string} sourcePath e.g. /assets/generated/hero-workspace.png
 */
export function marketingAssetFilename(sourcePath) {
  const normalized = sourcePath
    .replace(/^\/assets\/?/, "")
    .replace(/\\/g, "/")
    .replace(/ /g, "_");
  if (!normalized || normalized.includes("..")) {
    throw new Error(`Invalid asset path: ${sourcePath}`);
  }
  if (normalized.startsWith("svg/")) {
    return normalized;
  }
  return `marketing/${normalized}`;
}

/** @param {string} sourcePath */
export function resolvePublicFile(sourcePath) {
  const relative = sourcePath.replace(/^\/assets\/?/, "").replace(/\\/g, "/");
  return path.join(PUBLIC_ASSETS, ...relative.split("/"));
}

/** @param {Buffer} buf */
function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

/** @param {string} filePath */
function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

/** Matches `/assets/...` paths, including those embedded in HTML. */
const ASSET_PATH_RE = /\/assets\/(?!placeholder)[^\s"'<>?]+/g;

/**
 * @param {string} value
 * @returns {string[]}
 */
function extractAssetPaths(value) {
  const matches = value.match(ASSET_PATH_RE);
  if (!matches) return [];
  return matches.map((p) => p.split("?")[0]);
}

/**
 * @param {unknown} value
 * @param {Set<string>} out
 */
function collectAssetPaths(value, out) {
  if (typeof value === "string") {
    for (const p of extractAssetPaths(value)) out.add(p);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectAssetPaths(item, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectAssetPaths(v, out);
  }
}

/**
 * @param {unknown} value
 * @param {Map<string, string>} pathMap
 * @returns {unknown}
 */
export function rewriteAssetPaths(value, pathMap) {
  if (typeof value === "string") {
    if (!value.includes("/assets/")) return value;
    // Exact path (optionally with query)
    const bare = value.split("?")[0];
    const mappedExact = pathMap.get(bare);
    if (mappedExact && (value === bare || value.startsWith(`${bare}?`))) {
      const qs = value.includes("?") ? value.slice(value.indexOf("?")) : "";
      return `${mappedExact}${qs}`;
    }
    // Embedded in HTML / longer strings
    return value.replace(ASSET_PATH_RE, (match) => {
      const pathOnly = match.split("?")[0];
      return pathMap.get(pathOnly) || match;
    });
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteAssetPaths(item, pathMap));
  }
  if (value && typeof value === "object") {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = rewriteAssetPaths(v, pathMap);
    }
    return out;
  }
  return value;
}

/** @param {S3Config} config */
export function createS3Client(config) {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint || undefined,
    forcePathStyle: config.forcePathStyle,
  });
}

/**
 * @param {S3Client} client
 * @param {string} bucket
 */
export async function validateS3Connection(client, bucket) {
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
}

/**
 * @param {S3Client} client
 * @param {S3Config} config
 * @param {string} organizationId
 * @param {string} filename
 * @param {Buffer} body
 * @param {string} mimeType
 */
async function putObject(client, config, organizationId, filename, body, mimeType) {
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: `${organizationId}/${filename}`,
      Body: body,
      ContentLength: body.length,
      ContentType: mimeType,
    }),
  );
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} organizationId
 * @param {S3Client} client
 * @param {S3Config} config
 * @param {{ header?: unknown, headers?: unknown[], footer: unknown, pages: unknown[] }} structure
 * @returns {Promise<{ header: unknown, headers: unknown[], footer: unknown, pages: unknown[], uploaded: number, reused: number, updated: number }>}
 */
export async function uploadAndRewriteStructure(
  db,
  organizationId,
  client,
  config,
  structure,
) {
  const paths = new Set();
  collectAssetPaths(structure, paths);

  /** @type {Map<string, string>} */
  const pathMap = new Map();
  let uploaded = 0;
  let reused = 0;
  let updated = 0;
  const assets = db.collection(ASSETS_COLLECTION);
  const now = new Date();

  const sorted = [...paths].sort();
  for (const sourcePath of sorted) {
    const filePath = resolvePublicFile(sourcePath);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing public file for ${sourcePath}: ${filePath}`);
    }
    const body = fs.readFileSync(filePath);
    const hash = sha256(body);
    const mimeType = mimeFor(filePath);
    const filename = marketingAssetFilename(sourcePath);

    const byName = await assets.findOne({
      organizationId,
      filename,
    });

    if (byName && byName.hash === hash) {
      pathMap.set(sourcePath, `/assets/${byName.filename}`);
      reused += 1;
      console.log(`  reuse (name+hash) ${sourcePath} → /assets/${filename}`);
      continue;
    }

    const byHash = await assets.findOne({
      organizationId,
      hash,
      appointmentId: { $exists: false },
      customerId: { $exists: false },
    });

    // Only reuse by hash when the existing filename already matches the
    // canonical folder layout (avoid locking into old flat marketing-* names).
    if (byHash && !byName && byHash.filename === filename) {
      pathMap.set(sourcePath, `/assets/${byHash.filename}`);
      reused += 1;
      console.log(
        `  reuse (hash) ${sourcePath} → /assets/${byHash.filename}`,
      );
      continue;
    }

    await putObject(client, config, organizationId, filename, body, mimeType);

    if (byName) {
      await assets.updateOne(
        { _id: byName._id },
        {
          $set: {
            hash,
            size: body.length,
            mimeType,
            uploadedAt: now,
            description: "Marketing site",
          },
        },
      );
      updated += 1;
      console.log(`  updated ${sourcePath} → /assets/${filename}`);
    } else {
      await assets.insertOne({
        _id: new ObjectId().toString(),
        organizationId,
        filename,
        mimeType,
        size: body.length,
        hash,
        uploadedAt: now,
        description: "Marketing site",
      });
      uploaded += 1;
      console.log(`  uploaded ${sourcePath} → /assets/${filename}`);
    }

    pathMap.set(sourcePath, `/assets/${filename}`);
  }

  const headersSource = Array.isArray(structure.headers)
    ? structure.headers
    : structure.header
      ? [structure.header]
      : [];
  const headers = headersSource.map((h) => rewriteAssetPaths(h, pathMap));

  return {
    header: headers[0],
    headers,
    footer: rewriteAssetPaths(structure.footer, pathMap),
    pages: structure.pages.map((p) => rewriteAssetPaths(p, pathMap)),
    uploaded,
    reused,
    updated,
  };
}

