/**
 * Shared helpers for seed-org.mjs
 */
import {
  DeleteObjectsCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import YAML from "yaml";
import {
  BASE_PACK_IDS,
  getWebsitePack,
  loadPackComposers,
  loadWebsitePacks,
  parsePackId,
  resolvePackId,
  suggestWebsitePackId,
  TEMPLATE_VARIANTS,
  WEBSITE_PACK_IDS,
} from "./seed-org-packs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

export const COLLECTIONS = {
  orgs: "organizations",
  users: "users",
  members: "members",
  accounts: "accounts",
  configuration: "configuration",
  options: "options",
  customers: "customers",
  appointments: "appointments",
  pages: "pages",
  headers: "page-headers",
  footers: "page-footers",
  assets: "assets",
};

export const PACK_IDS = WEBSITE_PACK_IDS;

const PAGE_ROUTES_REDIS_PREFIX = "org:pages:routes:";

/** Realistic staff names used when seeding org members. */
export const STAFF_NAMES = [
  { first: "Alex", last: "Lee" },
  { first: "Jordan", last: "Nguyen" },
  { first: "Sam", last: "Patel" },
  { first: "Taylor", last: "Garcia" },
  { first: "Casey", last: "Smith" },
  { first: "Riley", last: "Brown" },
  { first: "Morgan", last: "Wilson" },
  { first: "Quinn", last: "Kim" },
  { first: "Avery", last: "Martinez" },
  { first: "Jamie", last: "Chen" },
  { first: "Cameron", last: "Brooks" },
  { first: "Drew", last: "Hassan" },
];

export function staffPersonAt(index) {
  const person = STAFF_NAMES[index % STAFF_NAMES.length];
  const cycle = Math.floor(index / STAFF_NAMES.length);
  const first = person.first;
  const last = cycle === 0 ? person.last : `${person.last}${cycle + 1}`;
  return {
    first,
    last,
    name: `${first} ${last}`,
    emailLocal: `${first}.${last}`.toLowerCase().replace(/[^a-z0-9.]/g, ""),
    phone: fakePhoneAt(index),
  };
}

/** Format: +1 (555)010-0100 — 555 area code keeps numbers clearly fictional. */
export function fakePhoneAt(index) {
  const i = Math.abs(Number(index) || 0);
  const exchange = String(100 + (i % 900)).padStart(3, "0");
  const line = String(1000 + ((i * 17) % 9000)).padStart(4, "0");
  return `+1 (555)${exchange}-${line}`;
}

/** Prefixes cycled across seeded staff so titles look varied. */
const JOB_TITLE_PREFIXES = ["Senior", "", "Lead", "Junior", "Principal"];

/** Base-price adjustments by job-title prefix (absolute override = base + delta). */
const JOB_TITLE_PRICE_DELTAS = {
  Junior: -5,
  Senior: 5,
  Lead: 10,
  Principal: 15,
};

/** Duration adjustments in minutes (Junior slower, Principal faster). */
const JOB_TITLE_DURATION_DELTAS = {
  Junior: 30,
  Senior: -5,
  Lead: -10,
  Principal: -15,
};

/**
 * Build a display job title from the catalog profession label.
 * @param {number} index
 * @param {string} [professionLabel]
 */
export function staffJobTitleAt(index, professionLabel) {
  const base = String(professionLabel || "Specialist").trim() || "Specialist";
  const prefix = JOB_TITLE_PREFIXES[index % JOB_TITLE_PREFIXES.length];
  return prefix ? `${prefix} ${base}` : base;
}

/**
 * @param {string | null | undefined} jobTitle
 * @param {Record<string, number>} deltas
 * @returns {number}
 */
function jobTitleDelta(jobTitle, deltas) {
  const title = String(jobTitle || "");
  for (const [prefix, delta] of Object.entries(deltas)) {
    if (new RegExp(`\\b${prefix}\\b`, "i").test(title)) return delta;
  }
  return 0;
}

/**
 * @param {string | null | undefined} jobTitle
 * @returns {number}
 */
export function jobTitlePriceDelta(jobTitle) {
  return jobTitleDelta(jobTitle, JOB_TITLE_PRICE_DELTAS);
}

/**
 * @param {string | null | undefined} jobTitle
 * @returns {number}
 */
export function jobTitleDurationDelta(jobTitle) {
  return jobTitleDelta(jobTitle, JOB_TITLE_DURATION_DELTAS);
}

/**
 * Build option.staff entries with per-member price/duration overrides from job titles.
 * Untitled / base titles keep the service defaults (no override).
 * @param {Array<{ _id: string, jobTitle?: string | null }>} members
 * @param {number} basePrice
 * @param {number} [baseDuration]
 */
export function staffAssignmentsForMembers(members, basePrice, baseDuration) {
  const price = Number(basePrice) || 0;
  const duration = Number(baseDuration) || 0;
  return members.map((m) => {
    const priceDelta = jobTitlePriceDelta(m.jobTitle);
    const durationDelta = jobTitleDurationDelta(m.jobTitle);
    /** @type {{ memberId: string, priceOverride?: number, durationOverride?: number }} */
    const assignment = { memberId: String(m._id) };
    if (priceDelta !== 0) {
      assignment.priceOverride = Math.max(0, price + priceDelta);
    }
    if (durationDelta !== 0 && duration > 0) {
      assignment.durationOverride = Math.max(1, duration + durationDelta);
    }
    return assignment;
  });
}

/**
 * @param {Array<{ memberId: string, priceOverride?: number | null, durationOverride?: number | null }> | undefined} staff
 * @param {string} memberId
 */
function findStaffAssignment(staff, memberId) {
  return (staff || []).find((s) => String(s.memberId) === String(memberId));
}

/**
 * Effective service price for a member (priceOverride or base).
 * @param {number} basePrice
 * @param {Array<{ memberId: string, priceOverride?: number | null }> | undefined} staff
 * @param {string} memberId
 */
export function effectiveSeedStaffPrice(basePrice, staff, memberId) {
  const assignment = findStaffAssignment(staff, memberId);
  if (assignment?.priceOverride != null)
    return Number(assignment.priceOverride);
  return Number(basePrice) || 0;
}

/**
 * Effective service duration for a member (durationOverride or base).
 * @param {number} baseDuration
 * @param {Array<{ memberId: string, durationOverride?: number | null }> | undefined} staff
 * @param {string} memberId
 */
export function effectiveSeedStaffDuration(baseDuration, staff, memberId) {
  const assignment = findStaffAssignment(staff, memberId);
  if (assignment?.durationOverride != null) {
    return Number(assignment.durationOverride);
  }
  return Number(baseDuration) || 0;
}

/** @param {string} dir */
export function loadEnvIfPresent(dir) {
  const dotenv = require("dotenv");
  for (const name of [".env", ".env.local"]) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) dotenv.config({ path: p, override: true });
  }
}

/** @param {string} filePath */
export function loadEnvFile(filePath) {
  const dotenv = require("dotenv");
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Env file not found: ${resolved}`);
  }
  const result = dotenv.config({ path: resolved, override: true });
  if (result.error) throw result.error;
  console.log(`Loaded env from ${resolved}`);
}

export function newId() {
  return new ObjectId().toString();
}

export function slugify(title) {
  return String(title ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function orgIdMatch(id) {
  const or = [{ organizationId: id }];
  if (ObjectId.isValid(id)) or.push({ organizationId: new ObjectId(id) });
  return { $or: or };
}

/** Parse POLAR_BILLING_PLANS=free:prod_x,solo:prod_y,studio:prod_z */
export function polarProductIdForTier(tier) {
  const raw = process.env.POLAR_BILLING_PLANS?.trim();
  if (!raw) return null;
  for (const part of raw.split(",")) {
    const [slug, productId] = part.split(":").map((s) => s.trim());
    if (!slug || !productId) continue;
    const normalized =
      slug === "pro" ? "solo" : slug === "team" ? "studio" : slug;
    if (normalized === tier) return productId;
  }
  return null;
}

export function ensurePackMediaBundle() {
  return ensurePackComposeBundle();
}

/**
 * Bundle real website-pack composers + registry into `.pack-compose.mjs`
 * (Series A/B/C packs from page-builder templates).
 */
export function ensurePackComposeBundle() {
  const out = path.join(__dirname, ".pack-compose.mjs");
  const sources = [
    path.join(
      REPO_ROOT,
      "packages/page-builder/src/templates/layouts/registry.ts",
    ),
    path.join(
      REPO_ROOT,
      "packages/page-builder/src/templates/layouts/sections.ts",
    ),
    path.join(
      REPO_ROOT,
      "packages/page-builder/src/templates/layouts/media.ts",
    ),
    path.join(__dirname, "bundle-pack-compose.mjs"),
    path.join(__dirname, "seed-org-compose-entry.ts"),
  ];
  const newestSrc = Math.max(
    ...sources
      .filter((p) => fs.existsSync(p))
      .map((p) => fs.statSync(p).mtimeMs),
  );
  const outMtime = fs.existsSync(out) ? fs.statSync(out).mtimeMs : 0;
  if (outMtime < newestSrc) {
    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, "bundle-pack-compose.mjs")],
      {
        stdio: "inherit",
        cwd: REPO_ROOT,
      },
    );
    if (result.status !== 0) {
      throw new Error(
        "Failed to bundle website pack composers (.pack-compose.mjs)",
      );
    }
  }
  // Legacy registry-only bundle (pack metadata) for callers that still expect it.
  const registryOut = path.join(__dirname, ".pack-registry.mjs");
  const registrySrc = sources[0];
  if (
    !(
      fs.existsSync(registryOut) &&
      fs.statSync(registryOut).mtimeMs >= fs.statSync(registrySrc).mtimeMs
    )
  ) {
    runEsbuild([
      registrySrc,
      "--bundle",
      "--platform=node",
      "--format=esm",
      `--outfile=${registryOut}`,
    ]);
  }
  ensureInstallDefaultsBundle();
  return out;
}

/** @deprecated Prefer ensurePackComposeBundle() */
export function ensurePackRegistryBundle() {
  return ensurePackComposeBundle();
}

function runEsbuild(args) {
  let esbuildBin;
  try {
    esbuildBin = require.resolve("esbuild/bin/esbuild");
  } catch {
    esbuildBin = null;
  }
  const cmd = esbuildBin ? process.execPath : "npx";
  const fullArgs = esbuildBin
    ? [esbuildBin, ...args]
    : ["--yes", "esbuild", ...args];
  const result = spawnSync(cmd, fullArgs, {
    stdio: "inherit",
    cwd: REPO_ROOT,
    shell: !esbuildBin,
  });
  if (result.status !== 0) {
    throw new Error(`esbuild failed: ${args.join(" ")}`);
  }
}

export function ensureInstallDefaultsBundle() {
  const outDir = path.join(__dirname, ".install-defaults");
  const sources = [
    "home.ts",
    "book.ts",
    "footer.ts",
    "modify.ts",
    "service.ts",
    "page.ts",
  ];
  const srcDir = path.join(
    REPO_ROOT,
    "apps/admin/src/components/install/defaults",
  );
  fs.mkdirSync(outDir, { recursive: true });
  const newestSrc = Math.max(
    ...sources.map((f) => fs.statSync(path.join(srcDir, f)).mtimeMs),
  );
  const outFiles = sources.map((f) =>
    path.join(outDir, f.replace(/\.ts$/, ".mjs")),
  );
  const oldestOut = outFiles.every((f) => fs.existsSync(f))
    ? Math.min(...outFiles.map((f) => fs.statSync(f).mtimeMs))
    : 0;
  if (oldestOut >= newestSrc) return outDir;

  runEsbuild([
    ...sources.map((f) => path.join(srcDir, f)),
    "--bundle",
    "--platform=node",
    "--format=esm",
    `--outdir=${outDir}`,
    "--out-extension:.js=.mjs",
  ]);
  return outDir;
}

async function loadInstallDefaults() {
  ensureInstallDefaultsBundle();
  const dir = path.join(__dirname, ".install-defaults");
  const [home, book, footer, modify, service, page] = await Promise.all([
    import(pathToFileURL(path.join(dir, "home.mjs")).href),
    import(pathToFileURL(path.join(dir, "book.mjs")).href),
    import(pathToFileURL(path.join(dir, "footer.mjs")).href),
    import(pathToFileURL(path.join(dir, "modify.mjs")).href),
    import(pathToFileURL(path.join(dir, "service.mjs")).href),
    import(pathToFileURL(path.join(dir, "page.mjs")).href),
  ]);
  return {
    homeDefaultPage: home.homeDefaultPage,
    bookDefaultPage: book.bookDefaultPage,
    footerDefaultPage: footer.footerDefaultPage,
    modifyDefaultPage: modify.modifyDefaultPage,
    serviceDefaultPage: service.serviceDefaultPage,
    pageDefault: page.pageDefault,
  };
}

export function loadBuilderI18n() {
  const yamlPath = path.join(
    REPO_ROOT,
    "packages/i18n/src/locales/en/builder.yaml",
  );
  return YAML.parse(fs.readFileSync(yamlPath, "utf8"));
}

export function loadCatalog() {
  const dataPath = path.join(
    REPO_ROOT,
    "apps/admin/src/components/install/data/_catalog-data.json",
  );
  const enPath = path.join(
    REPO_ROOT,
    "apps/admin/src/components/install/data/_catalog-en-source.json",
  );
  return {
    data: JSON.parse(fs.readFileSync(dataPath, "utf8")),
    en: JSON.parse(fs.readFileSync(enPath, "utf8")),
  };
}

export function i18nGet(root, key) {
  let cur = root;
  const stripped = String(key).replace(/^builder\./, "");
  for (const part of stripped.split(".")) {
    if (cur == null || typeof cur !== "object") return null;
    cur = cur[part];
  }
  return typeof cur === "string" ? cur : null;
}

export function i18nGetOr(root, key, fallback = "") {
  return i18nGet(root, key) || fallback;
}

export function resolveTemplate(industry, template, variant = "a") {
  const packId = resolvePackId(template, variant, industry);
  const { base } = parsePackId(packId);
  if (!BASE_PACK_IDS.includes(base) && !WEBSITE_PACK_IDS.includes(packId)) {
    throw new Error(
      `Unknown template "${template}" / variant "${variant}". ` +
        `Base templates: ${BASE_PACK_IDS.join(", ")}. Variants: ${TEMPLATE_VARIANTS.join(", ")}.`,
    );
  }
  return packId;
}

export function pickIndustryServices(catalog, industry, profession, count) {
  const categoryId = industry;
  const category = catalog.data[categoryId];
  if (!category) {
    const ids = Object.keys(catalog.data).sort();
    throw new Error(
      `Unknown industry "${industry}". Available: ${ids.join(", ")}`,
    );
  }

  let professionId = profession;
  if (!professionId) {
    professionId =
      Object.keys(category).find(
        (id) => (category[id]?.services?.length ?? 0) >= count,
      ) || Object.keys(category)[0];
  }
  const prof = category[professionId];
  if (!prof) {
    throw new Error(
      `Unknown profession "${professionId}" in ${categoryId}. Available: ${Object.keys(category).join(", ")}`,
    );
  }

  const enProf = catalog.en[categoryId]?.[professionId];
  const services = (prof.services || []).slice(0, count).map((svc) => {
    const enSvc = enProf?.services?.[svc.id];
    const duration = svc.durations?.[0] ?? 60;
    const price =
      svc.prices?.[Math.floor((svc.prices.length - 1) / 2)] ??
      svc.prices?.[0] ??
      50;
    return {
      id: svc.id,
      name: enSvc?.name || svc.id,
      description: (enSvc?.description || `${enSvc?.name || svc.id}`).slice(
        0,
        1024,
      ),
      duration,
      price,
    };
  });

  if (!services.length) {
    throw new Error(`No services found for ${categoryId}/${professionId}`);
  }

  const professionLabel = enProf?.label || professionId;

  return { categoryId, professionId, professionLabel, services };
}

export function defaultSchedule() {
  const workShift = { start: "09:00", end: "17:00" };
  return {
    schedule: [
      { weekDay: 1, shifts: [workShift] },
      { weekDay: 2, shifts: [workShift] },
      { weekDay: 3, shifts: [workShift] },
      { weekDay: 4, shifts: [workShift] },
      { weekDay: 5, shifts: [workShift] },
      { weekDay: 6, shifts: [] },
      { weekDay: 7, shifts: [] },
    ],
  };
}

export function defaultBooking(catalogOptionIds, { autoConfirm = true } = {}) {
  return {
    allowPromoCode: "allow-if-has-active",
    payments: { enabled: false },
    cancellationsAndReschedules: {
      cancellations: {
        withDeposit: {
          enabled: true,
          defaultPolicy: { action: "fullRefund" },
        },
        withoutDeposit: {
          enabled: true,
          defaultPolicy: { action: "allowed" },
        },
      },
      reschedules: {
        enabled: true,
        defaultPolicy: { action: "allowed" },
      },
    },
    catalog: catalogOptionIds.map((id) => ({
      type: "option",
      id,
      optionId: id,
    })),
    slotStart: 15,
    maxWeeksInFuture: 12,
    minHoursBeforeBooking: 1,
    breakDuration: 15,
    autoConfirm,
  };
}

function inlineText(text) {
  return {
    type: "InlineText",
    id: `block-${newId()}`,
    data: {
      props: { text },
    },
  };
}

function inlineContainer(text) {
  return {
    type: "InlineContainer",
    id: `block-${newId()}`,
    data: {
      style: {
        padding: [
          {
            value: {
              top: { value: 0, unit: "rem" },
              bottom: { value: 0, unit: "rem" },
              left: { value: 0, unit: "rem" },
              right: { value: 0, unit: "rem" },
            },
          },
        ],
        display: [{ value: "inline-flex" }],
        flexDirection: [{ value: "row" }],
        alignItems: [{ value: "center" }],
        justifyContent: [{ value: "center" }],
        gap: [{ value: { value: 0.5, unit: "rem" } }],
      },
      props: {
        children: [inlineText(text)],
      },
    },
  };
}

function headingBlock(text, { level = "h1", align = "left" } = {}) {
  return {
    type: "Heading",
    id: `block-${newId()}`,
    data: {
      style: {
        textAlign: [{ value: align }],
        padding: [
          {
            value: {
              top: { value: 0.5, unit: "rem" },
              bottom: { value: 0.5, unit: "rem" },
              left: { value: 1.5, unit: "rem" },
              right: { value: 1.5, unit: "rem" },
            },
          },
        ],
      },
      props: {
        level,
        children: [inlineContainer(text)],
      },
    },
  };
}

function textBlock(text, { align = "left" } = {}) {
  return {
    type: "Text",
    id: `block-${newId()}`,
    data: {
      props: {
        // Plate nodes must NOT have `id` — the editor indexes any {id,type} as a block.
        value: [{ type: "p", children: [{ text: text || "" }] }],
      },
      style: {
        padding: [
          {
            value: {
              top: { value: 0.5, unit: "rem" },
              bottom: { value: 0.5, unit: "rem" },
              left: { value: 1.5, unit: "rem" },
              right: { value: 1.5, unit: "rem" },
            },
          },
        ],
        textAlign: [{ value: align }],
      },
    },
  };
}

function imageBlock(src, alt = "") {
  return {
    type: "Image",
    id: `block-${newId()}`,
    data: {
      style: {
        textAlign: [{ value: "center" }],
        objectFit: [{ value: "cover" }],
        maxWidth: [{ value: { value: 100, unit: "%" } }],
        padding: [
          {
            value: {
              top: { value: 0.5, unit: "rem" },
              bottom: { value: 0.5, unit: "rem" },
              left: { value: 1.5, unit: "rem" },
              right: { value: 1.5, unit: "rem" },
            },
          },
        ],
      },
      props: {
        src: src || "/assets/placeholder/400x200.jpg",
        alt,
        linkHref: null,
      },
    },
  };
}

function buttonBlock(label, url) {
  return {
    type: "Button",
    id: `block-${newId()}`,
    data: {
      style: {
        justifyContent: [{ value: "center" }],
        padding: [
          {
            value: {
              top: { value: 0.75, unit: "rem" },
              right: { value: 1.5, unit: "rem" },
              bottom: { value: 0.75, unit: "rem" },
              left: { value: 1.5, unit: "rem" },
            },
          },
        ],
      },
      props: {
        url: url || "/",
        target: "_self",
        children: [inlineContainer(label)],
      },
    },
  };
}

/** Page / footer document root — must be a PageLayout with id + type. */
function pageShell(children) {
  return {
    type: "PageLayout",
    id: `block-${newId()}`,
    data: {
      fontFamily: "PRIMARY",
      fullWidth: true,
      children: children.filter(Boolean),
      textColor: "var(--value-foreground-color)",
      backgroundColor: "var(--value-background-color)",
    },
  };
}

export function buildHeader() {
  return {
    name: "Default Header",
    showLogo: true,
    sticky: false,
    shadow: false,
    menu: [
      {
        type: "button",
        label: "About",
        url: "/about",
        variant: "ghost",
        size: "default",
      },
      {
        type: "button",
        label: "Manage appointment",
        url: "/book/modify",
        variant: "ghost",
        size: "default",
      },
      {
        type: "button",
        label: "Book",
        url: "/book",
        variant: "default",
        size: "default",
      },
    ],
  };
}

/** Fixed transparent header for full-bleed image/video heroes (solid on scroll). */
export function buildOverlayHeader() {
  const lightText = "0 0% 100%";
  const scrolledText = "var(--value-foreground-color)";
  return {
    name: "Overlay Header",
    showLogo: true,
    position: "fixed",
    sticky: false,
    shadow: false,
    backdropBlur: false,
    backgroundColor: "transparent",
    textColor: lightText,
    fullWidth: false,
    scrolled: {
      backgroundColor: "var(--value-background-color)",
      textColor: scrolledText,
      shadow: true,
      backdropBlur: true,
    },
    menu: [
      {
        type: "button",
        label: "About",
        url: "/about",
        variant: "ghost",
        size: "default",
        textColor: lightText,
        scrolled: { textColor: scrolledText },
      },
      {
        type: "button",
        label: "Manage appointment",
        url: "/book/modify",
        variant: "ghost",
        size: "default",
        textColor: lightText,
        scrolled: { textColor: scrolledText },
      },
      {
        type: "button",
        label: "Book",
        url: "/book",
        variant: "default",
        size: "default",
      },
    ],
  };
}

export function packUsesOverlayHeader(hero) {
  return ["centered", "overlay", "leftOverlay", "video"].includes(hero);
}

export function buildFooter(orgName, email) {
  // Kept for API compatibility; prefer buildPackPages footer from install defaults.
  return {
    name: "Default Footer",
    content: pageShell([
      headingBlock(orgName, { level: "h3", align: "center" }),
      textBlock(email, { align: "center" }),
      textBlock("Book online anytime.", { align: "center" }),
    ]),
  };
}

function walkBlocks(node, visit) {
  if (!node || typeof node !== "object") return;
  visit(node);
  if (Array.isArray(node)) {
    for (const item of node) walkBlocks(item, visit);
    return;
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") walkBlocks(value, visit);
  }
}

function remapPlacementRecord(record, idMap) {
  if (!record || typeof record !== "object") return;
  for (const [oldId, placement] of Object.entries(record)) {
    const mapped = idMap.get(oldId);
    if (!mapped || mapped === oldId) continue;
    delete record[oldId];
    record[mapped] = placement;
  }
}

/**
 * Remap block ids AND FluidLayout placement keys (placements are keyed by
 * child block id — rewriting ids alone drops the grid and collapses copy).
 */
function assignUniqueIds(root) {
  /** @type {Map<string, string>} */
  const idMap = new Map();

  walkBlocks(root, (node) => {
    if (
      !node ||
      typeof node !== "object" ||
      typeof node.type !== "string" ||
      typeof node.id !== "string"
    ) {
      return;
    }
    if (!(node.id.startsWith("block-") || node.id.startsWith("seed-block-"))) {
      return;
    }
    const nextId = `block-${newId()}`;
    idMap.set(node.id, nextId);
    node.id = nextId;
  });

  if (idMap.size === 0) return root;

  walkBlocks(root, (node) => {
    if (node?.type !== "FluidLayout" || !node.data?.props) return;
    remapPlacementRecord(node.data.props.placements, idMap);
    const overrides = node.data.props.placementOverrides;
    if (!overrides || typeof overrides !== "object") return;
    for (const tier of Object.values(overrides)) {
      remapPlacementRecord(tier, idMap);
    }
  });

  return root;
}

/** Rewrite remote/pack media URLs to uploaded org asset paths. */
function remapAssetUrls(content, assetUrls) {
  if (!assetUrls?.size) return content;
  const replace = (value) => {
    if (typeof value !== "string") return value;
    if (assetUrls.has(value)) return assetUrls.get(value);
    for (const [from, to] of assetUrls) {
      if (value.includes(from)) return value.split(from).join(to);
    }
    return value;
  };
  walkBlocks(content, (node) => {
    if (!node || typeof node !== "object") return;
    if (node.data?.props && typeof node.data.props.src === "string") {
      node.data.props.src = replace(node.data.props.src);
    }
    if (node.data?.props && typeof node.data.props.url === "string") {
      node.data.props.url = replace(node.data.props.url);
    }
    const bg = node.data?.style?.backgroundImage;
    if (Array.isArray(bg)) {
      for (const entry of bg) {
        const v = entry?.value;
        if (v?.type === "url" && typeof v.value === "string") {
          v.value = replace(v.value);
        }
      }
    }
  });
  return content;
}

function pageContentFromBlocks(children) {
  return {
    id: `block-${newId()}`,
    type: "PageLayout",
    data: {
      fontFamily: "PRIMARY",
      fullWidth: true,
      children: (children || []).filter(Boolean),
    },
  };
}

/**
 * Build website pages from real page-builder website packs (same composers
 * as install createInstallDefaultPages). Footer/modify stay on install defaults.
 */
export async function buildPackPages({
  packId,
  orgName,
  services,
  builderI18n,
  assetUrls,
}) {
  const compose = await loadPackComposers();
  const pack =
    compose.WEBSITE_PACKS?.[packId] ?? (await getWebsitePack(packId));
  if (!pack) throw new Error(`Unknown template pack: ${packId}`);

  const defaults = await loadInstallDefaults();
  const t = (key, fallbackOrOpts) => {
    const fallback =
      typeof fallbackOrOpts === "string"
        ? fallbackOrOpts
        : (fallbackOrOpts?.defaultValue ?? String(key));
    return i18nGetOr(builderI18n, key, fallback);
  };

  const layoutServices = services.map((svc) => {
    const slug = slugify(svc.name);
    return {
      id: svc.id,
      name: svc.name,
      description: String(svc.description || "")
        .replace(/\*\*/g, "")
        .trim(),
      slug,
      pageSlug: `service/${slug}`,
      imageUrl:
        assetUrls.get(pack.media?.generic) || pack.media?.generic || undefined,
    };
  });
  const layoutCtx = { services: layoutServices };

  const bookLabels = {
    bookNowLabel: "Book now",
    policiesText:
      "Need to change your appointment? Use Manage appointment in the header.",
    manageYourAppointment: "Manage appointment",
  };

  const footerLabels = {
    contactUsLabel: "Contact us",
    phoneLabel: "Phone",
    emailLabel: "Email",
    addressLabel: "Address",
    bookNowLabel: "Book now",
    cancelOrRescheduleLabel: "Manage appointment",
    policiesLabel: "Policies",
  };

  const finalize = (content) => {
    let next = assignUniqueIds(content);
    next = remapAssetUrls(next, assetUrls);
    return next;
  };

  const homeContent = finalize(
    pageContentFromBlocks(compose.composeHome(pack, t, layoutCtx)),
  );
  const bookContent = finalize(
    pageContentFromBlocks(compose.composeBooking(pack, t, layoutCtx)),
  );
  const aboutContent = finalize(
    pageContentFromBlocks(compose.composeAbout(pack, t, layoutCtx)),
  );
  const termsContent = finalize(
    pageContentFromBlocks(compose.composeTerms(pack, t, layoutCtx)),
  );

  let modifyContent = defaults.modifyDefaultPage(bookLabels);
  modifyContent = assignUniqueIds(modifyContent);

  let footerContent = defaults.footerDefaultPage(
    true,
    footerLabels,
    false,
    true,
    "My cabinet",
    "Manage appointment",
  );
  footerContent = assignUniqueIds(footerContent);

  const heroSubtitle = t(
    `builder.pageBuilder.pageTemplates.${packId}.home.heroSubtitle`,
    t(
      `builder.pageBuilder.pageTemplates.${packId}.home.heroTitle`,
      `Book with ${orgName}`,
    ),
  );

  const servicePages = layoutServices.map((svc, index) => {
    const content = finalize(
      pageContentFromBlocks(compose.composeService(pack, t, layoutCtx, svc)),
    );
    return {
      title: svc.name,
      slug: svc.pageSlug,
      description: String(services[index]?.description || "")
        .replace(/\*\*/g, "")
        .slice(0, 160),
      keywords: `${orgName}, ${svc.name}`,
      published: true,
      fullWidth: true,
      content,
    };
  });

  return {
    pack,
    useOverlayHeader: packUsesOverlayHeader(pack.hero),
    home: {
      title: "Home",
      slug: "home",
      description: `${orgName} — ${heroSubtitle}`,
      keywords: `${orgName}, booking, ${packId}`,
      published: true,
      fullWidth: true,
      content: homeContent,
    },
    booking: {
      title: "Book",
      slug: "book",
      description: `Book an appointment at ${orgName}`,
      keywords: `${orgName}, book, appointment`,
      published: true,
      fullWidth: true,
      content: bookContent,
    },
    modify: {
      title: "Manage appointment",
      slug: "book/modify",
      description: `Manage appointments at ${orgName}`,
      keywords: `${orgName}, modify, cancel, reschedule`,
      published: true,
      fullWidth: true,
      content: modifyContent,
    },
    about: {
      title: "About",
      slug: "about",
      description: `About ${orgName}`,
      keywords: `${orgName}, about`,
      published: true,
      fullWidth: true,
      content: aboutContent,
    },
    terms: {
      title: "Terms",
      slug: "terms",
      description: `Terms — ${orgName}`,
      keywords: `${orgName}, terms`,
      published: true,
      fullWidth: true,
      content: termsContent,
    },
    servicePages,
    footerContent,
  };
}

/** Collect remote http(s) image URLs from pack media. */
export async function collectPackRemoteUrls(packId) {
  const pack = await getWebsitePack(packId);
  const urls = new Set();
  if (!pack?.media) return urls;
  if (pack.media.generic?.startsWith("http")) urls.add(pack.media.generic);
  if (pack.media.before?.startsWith("http")) urls.add(pack.media.before);
  if (pack.media.after?.startsWith("http")) urls.add(pack.media.after);
  for (const item of pack.media.items || []) {
    if (item.src?.startsWith("http")) urls.add(item.src);
  }
  return urls;
}

/**
 * @param {S3Config} config
 */
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

export async function validateS3Connection(client, bucket) {
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
}

/**
 * Download remote images, upload to S3 as org assets, return Map<sourceUrl, /assets/filename>.
 */
export async function uploadRemoteImages({
  db,
  s3,
  bucket,
  organizationId,
  urls,
}) {
  const assets = db.collection(COLLECTIONS.assets);
  /** @type {Map<string, string>} */
  const map = new Map();
  let i = 0;
  for (const url of urls) {
    i += 1;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Skip image ${url}: HTTP ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const hash = createHash("sha256").update(buf).digest("hex");
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    const filename = `templates/${packSafeName(url)}-${hash.slice(0, 10)}.${ext}`;

    const existing = await assets.findOne({
      ...orgIdMatch(organizationId),
      filename,
      hash,
    });
    if (!existing) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: `${organizationId}/${filename}`,
          Body: buf,
          ContentType: contentType,
        }),
      );
      await assets.insertOne({
        _id: newId(),
        organizationId,
        filename,
        size: buf.length,
        mimeType: contentType,
        uploadedAt: new Date(),
        hash,
        description: `Seeded template image ${i}`,
      });
    }
    map.set(url, `/assets/${filename}`);
    console.log(`  asset ${filename}`);
  }
  return map;
}

function packSafeName(url) {
  try {
    const u = new URL(url);
    return (
      u.pathname
        .split("/")
        .filter(Boolean)
        .pop()
        ?.replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 40) || "img"
    );
  } catch {
    return "img";
  }
}

/** Upload local logo SVGs referenced as /pages/templates/logos/... */
export async function uploadLocalTemplateLogos({
  db,
  s3,
  bucket,
  organizationId,
  packId,
}) {
  const pack = await getWebsitePack(packId);
  const logos = pack?.media?.logos || [];
  const assets = db.collection(COLLECTIONS.assets);
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const logo of logos) {
    const src = logo.src;
    if (!src?.startsWith("/pages/templates/")) continue;
    const disk = path.join(
      REPO_ROOT,
      "apps/admin/public",
      src.replace(/^\//, ""),
    );
    if (!fs.existsSync(disk)) continue;
    const buf = fs.readFileSync(disk);
    const hash = createHash("sha256").update(buf).digest("hex");
    const filename = `templates/logos/${path.basename(disk)}`;
    const existing = await assets.findOne({
      ...orgIdMatch(organizationId),
      filename,
      hash,
    });
    if (!existing) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: `${organizationId}/${filename}`,
          Body: buf,
          ContentType: "image/svg+xml",
        }),
      );
      await assets.insertOne({
        _id: newId(),
        organizationId,
        filename,
        size: buf.length,
        mimeType: "image/svg+xml",
        uploadedAt: new Date(),
        hash,
      });
    }
    map.set(src, `/assets/${filename}`);
  }
  return map;
}

function loadRedisCtor() {
  try {
    return require(path.join(REPO_ROOT, "node_modules/ioredis")).default;
  } catch {
    throw new Error(
      "ioredis not found at repo root node_modules. Run yarn install from the monorepo root.",
    );
  }
}

export function createRedisClient(config) {
  const Redis = loadRedisCtor();
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

export async function validateRedisConnection(config) {
  const redis = createRedisClient(config);
  try {
    await redis.connect();
    const pong = await redis.ping();
    if (pong !== "PONG") throw new Error(`Unexpected Redis PING: ${pong}`);
  } finally {
    redis.disconnect();
  }
}

export async function invalidatePageRouteCache(organizationId, config) {
  await invalidateOrganizationRedisCache(organizationId, config, {
    slug: null,
  });
}

/**
 * Clear org-scoped Redis keys used by web/admin (page routes, config, hostnames).
 * @param {string} organizationId
 * @param {{ host: string, port: number, db: number, username?: string, password?: string }} config
 * @param {{ slug?: string | null, domain?: string | null }} [org]
 */
export async function invalidateOrganizationRedisCache(
  organizationId,
  config,
  org = {},
) {
  const redis = createRedisClient(config);
  try {
    await redis.connect();
    /** @type {string[]} */
    const keys = [`${PAGE_ROUTES_REDIS_PREFIX}${organizationId}`];

    if (org.slug?.trim()) {
      const slug = String(org.slug).trim().toLowerCase();
      keys.push(`org:hostname:${slug}`);
      const publicDomain = process.env.PUBLIC_DOMAIN?.trim();
      if (publicDomain) {
        keys.push(
          `org:hostname:${slug}.${publicDomain.split(":")[0].toLowerCase()}`,
        );
      }
    }
    if (org.domain?.trim()) {
      const host = String(org.domain).split(":")[0].trim().toLowerCase();
      if (host) keys.push(`org:hostname:${host}`);
    }

    // Configuration cache: org:config:{organizationId}:{key}
    const configPattern = `org:config:${organizationId}:*`;
    let cursor = "0";
    do {
      const [next, found] = await redis.scan(
        cursor,
        "MATCH",
        configPattern,
        "COUNT",
        100,
      );
      cursor = next;
      for (const key of found) keys.push(key);
    } while (cursor !== "0");

    const unique = [...new Set(keys)];
    if (!unique.length) {
      console.log("Redis: no org cache keys to invalidate.");
      return;
    }
    const n = await redis.del(...unique);
    console.log(
      `Invalidated ${n} Redis key(s) for org ${organizationId} (${unique.length} candidates).`,
    );
  } finally {
    redis.disconnect();
  }
}

/**
 * Clear Better Auth secondary-storage sessions for the given users.
 * Keys: `active-sessions-{userId}` + each session token.
 * @param {{ host: string, port: number, db: number, username?: string, password?: string }} config
 * @param {string[]} userIds
 */
export async function purgeUserSessionsFromRedis(config, userIds) {
  const ids = [...new Set((userIds || []).map(String).filter(Boolean))];
  if (!ids.length) {
    console.log("Redis: no user sessions to clear.");
    return;
  }

  const redis = createRedisClient(config);
  try {
    await redis.connect();
    /** @type {string[]} */
    const keys = [];
    for (const userId of ids) {
      const listKey = `active-sessions-${userId}`;
      keys.push(listKey);
      const raw = await redis.get(listKey);
      if (!raw) continue;
      try {
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) continue;
        for (const entry of list) {
          const token = typeof entry === "string" ? entry : entry?.token;
          if (token) keys.push(String(token));
        }
      } catch {
        // ignore malformed list
      }
    }
    const unique = [...new Set(keys)];
    const n = unique.length ? await redis.del(...unique) : 0;
    console.log(
      `Cleared ${n} Better Auth session key(s) in Redis for ${ids.length} user(s) (${unique.length} candidates).`,
    );
  } finally {
    redis.disconnect();
  }
}

/**
 * Generate non-overlapping appointments for members over [from, from+months].
 */
export function generateAppointmentSlots({
  members,
  options,
  from = new Date(),
  months = 2,
  breakMinutes = 15,
  timeZone = "UTC",
  perDayPerMember = 3,
}) {
  const end = new Date(from);
  end.setMonth(end.getMonth() + months);

  /** Customer names reuse the same realistic pool as staff, offset so they differ. */
  const customerNameOffset = STAFF_NAMES.length;

  /** @type {Array<{memberId:string, option:any, dateTime:Date, customer:{name:string,email:string,phone:string}}>} */
  const slots = [];

  /** @type {Map<string, Array<{start:number, end:number}>>} */
  const busy = new Map(members.map((m) => [m._id, []]));

  const day = new Date(from);
  day.setHours(0, 0, 0, 0);
  // start tomorrow if today is almost over
  if (day <= from) day.setDate(day.getDate() + 1);

  let customerSeq = 0;
  while (day < end) {
    const weekday = day.getDay(); // 0 Sun .. 6 Sat
    const luxonWeekDay = weekday === 0 ? 7 : weekday;
    if (luxonWeekDay >= 1 && luxonWeekDay <= 5) {
      for (const member of members) {
        let placed = 0;
        const dayBusy = busy.get(member._id);
        // candidate starts every 30m from 09:00
        for (
          let minutes = 9 * 60;
          minutes < 17 * 60 && placed < perDayPerMember;
          minutes += 30
        ) {
          const option = options[Math.floor(Math.random() * options.length)];
          const duration = effectiveSeedStaffDuration(
            option.duration || 60,
            option.staff,
            member._id,
          );
          const startMs = new Date(day);
          startMs.setHours(0, 0, 0, 0);
          const start = startMs.getTime() + minutes * 60_000;
          const endMs = start + duration * 60_000;
          const dayEnd = startMs.getTime() + 17 * 60 * 60_000;
          if (endMs > dayEnd) continue;

          const overlaps = dayBusy.some(
            (b) => start < b.end + breakMinutes * 60_000 && endMs > b.start,
          );
          if (overlaps) continue;

          dayBusy.push({ start, end: endMs });
          const person = staffPersonAt(customerNameOffset + customerSeq);
          customerSeq += 1;
          slots.push({
            memberId: member._id,
            option: { ...option, duration },
            dateTime: new Date(start),
            customer: {
              name: person.name,
              email: `${person.emailLocal}.${customerSeq}@example.com`,
              phone: fakePhoneAt(customerNameOffset + customerSeq),
            },
          });
          placed += 1;
          // skip ahead roughly one appointment
          minutes += Math.max(0, duration - 30);
        }
      }
    }
    day.setDate(day.getDate() + 1);
  }

  return slots.map((s) => ({ ...s, timeZone }));
}

function orgIdFilter(id) {
  if (ObjectId.isValid(id)) {
    return { $in: [id, new ObjectId(id)] };
  }
  return id;
}

function idInClause(ids) {
  /** @type {(string | import('mongodb').ObjectId)[]} */
  const values = [];
  for (const id of ids) {
    values.push(id);
    if (ObjectId.isValid(id)) values.push(new ObjectId(id));
  }
  return { $in: values };
}

/**
 * Purge an org by slug (Mongo + optional S3 + Redis), same approach as
 * scripts/purge-organization.mjs.
 *
 * @param {import('mongodb').Db} db
 * @param {string} slug
 * @param {{ client: import('@aws-sdk/client-s3').S3Client, bucket: string } | null} [s3]
 * @param {{ host: string, port: number, db: number, username?: string, password?: string } | null} [redis]
 * @returns {Promise<string | null>} purged organizationId, or null if not found
 */
export async function purgeOrganizationBySlug(
  db,
  slug,
  s3 = null,
  redis = null,
) {
  const org = await db.collection(COLLECTIONS.orgs).findOne({ slug });
  if (!org) {
    console.log(
      `No existing organization with slug "${slug}" — nothing to purge.`,
    );
    return null;
  }

  const organizationId = String(org._id);
  console.log(
    `Purging existing organization "${org.name || slug}" (${organizationId})…`,
  );

  if (redis) {
    await invalidateOrganizationRedisCache(organizationId, redis, {
      slug: org.slug || slug,
      domain: org.domain ?? null,
    });
  } else {
    console.log("Redis config not provided — skipping cache invalidation.");
  }

  const orgMatch = orgIdMatch(organizationId);
  const members = await db
    .collection(COLLECTIONS.members)
    .find(orgMatch)
    .project({ userId: 1 })
    .toArray();

  /** @type {Set<string>} */
  const userIds = new Set();
  for (const member of members) {
    if (member.userId != null) userIds.add(String(member.userId));
  }
  const legacyUsers = await db
    .collection(COLLECTIONS.users)
    .find(orgMatch)
    .project({ _id: 1 })
    .toArray();
  for (const user of legacyUsers) userIds.add(String(user._id));
  const userIdStrings = [...userIds];

  // Better Auth keeps live sessions in Redis secondary storage (not only Mongo).
  if (redis && userIdStrings.length > 0) {
    await purgeUserSessionsFromRedis(redis, userIdStrings);
  }

  const collectionNames = (await db.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => n && !n.startsWith("system."));

  /** @type {Record<string, number>} */
  const summary = {};

  for (const name of collectionNames) {
    if (name === "organizations" || name === "users") continue;
    const r = await db.collection(name).deleteMany(orgMatch);
    if (r.deletedCount > 0)
      summary[`${name} (organizationId)`] = r.deletedCount;
  }

  if (userIdStrings.length > 0) {
    const userIdClause = idInClause(userIdStrings);
    for (const name of ["sessions", "accounts", "verifications"]) {
      if (!collectionNames.includes(name)) continue;
      const r = await db.collection(name).deleteMany({ userId: userIdClause });
      if (r.deletedCount > 0) {
        summary[`${name} (userId)`] =
          (summary[`${name} (userId)`] ?? 0) + r.deletedCount;
      }
    }
  }

  // Always clear sessions tied to this org (even if member userIds were empty).
  if (collectionNames.includes("sessions")) {
    const r = await db.collection("sessions").deleteMany({
      $or: [
        { activeOrganizationId: organizationId },
        ...(ObjectId.isValid(organizationId)
          ? [{ activeOrganizationId: new ObjectId(organizationId) }]
          : []),
      ],
    });
    if (r.deletedCount > 0) {
      summary["sessions (activeOrganizationId)"] = r.deletedCount;
    }
  }

  if (userIdStrings.length > 0) {
    const usersDel = await db
      .collection(COLLECTIONS.users)
      .deleteMany({ _id: idInClause(userIdStrings) });
    summary["users (_id via members)"] = usersDel.deletedCount;
  }

  const orgDel = await db
    .collection(COLLECTIONS.orgs)
    .deleteOne({ _id: orgIdFilter(organizationId) });
  summary["organizations (_id)"] = orgDel.deletedCount;

  console.log("MongoDB purge summary:");
  for (const [k, v] of Object.entries(summary)) {
    if (v > 0) console.log(`  ${k}: ${v}`);
  }

  if (s3?.client && s3?.bucket) {
    await purgeOrganizationS3Prefix(s3.client, s3.bucket, organizationId);
  } else {
    console.log("S3 config not provided — skipping S3 object deletion.");
  }

  return organizationId;
}

/**
 * @param {import('@aws-sdk/client-s3').S3Client} client
 * @param {string} bucket
 * @param {string} organizationId
 */
async function purgeOrganizationS3Prefix(client, bucket, organizationId) {
  const prefix = `${organizationId}/`;
  let totalDeleted = 0;
  let continuationToken = undefined;

  do {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    const keys = (list.Contents ?? []).map((o) => o.Key).filter(Boolean);
    continuationToken = list.IsTruncated
      ? list.NextContinuationToken
      : undefined;

    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000);
      try {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: batch.map((Key) => ({ Key })),
              Quiet: true,
            },
          }),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          err instanceof TypeError &&
          (msg.includes("Expected object, got string") ||
            msg.includes("Deserialization error"))
        ) {
          console.warn(
            "S3 DeleteObjects response could not be parsed; continuing…",
          );
        } else {
          throw err;
        }
      }
      totalDeleted += batch.length;
    }
  } while (continuationToken);

  console.log(
    `S3: deleted ${totalDeleted} object(s) under s3://${bucket}/${prefix}*`,
  );
}

export {
  BASE_PACK_IDS,
  listPackIds,
  parsePackId,
  resolvePackId,
  TEMPLATE_VARIANTS,
} from "./seed-org-packs.mjs";
export { getWebsitePack, loadWebsitePacks, suggestWebsitePackId };
