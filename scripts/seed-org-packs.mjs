/**
 * Website pack registry for seeding.
 * Loads real page-builder WEBSITE_PACKS + composers via `.pack-compose.mjs`
 * (built by seed-org-lib.ensurePackComposeBundle()).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Series labels: a = base pack id, b = `{id}_b`, c = `{id}_c`. */
export const TEMPLATE_VARIANTS = ["a", "b", "c"];

/** Base vertical pack ids (Series A). */
export const BASE_PACK_IDS = [
  "salon",
  "tattoo",
  "spa",
  "coach",
  "fitness",
  "photography",
  "clinic",
  "pet",
  "home_services",
  "professional",
];

/**
 * @param {string} baseId
 * @param {string} [variant]
 */
export function packIdForVariant(baseId, variant = "a") {
  const v = String(variant || "a").toLowerCase();
  if (v === "a" || v === "1" || v === "series-a") return baseId;
  if (v === "b" || v === "2" || v === "series-b") return `${baseId}_b`;
  if (v === "c" || v === "3" || v === "series-c") return `${baseId}_c`;
  throw new Error(
    `Unknown template variant "${variant}". Use one of: ${TEMPLATE_VARIANTS.join(", ")}`,
  );
}

/**
 * Split a pack id like `salon_b` → { base: "salon", variant: "b" }.
 * @param {string} packId
 */
export function parsePackId(packId) {
  const id = String(packId || "");
  if (id.endsWith("_b")) {
    return { base: id.slice(0, -2), variant: "b", packId: id };
  }
  if (id.endsWith("_c")) {
    return { base: id.slice(0, -2), variant: "c", packId: id };
  }
  return { base: id, variant: "a", packId: id };
}

/**
 * Normalize user input for --template / --variant into a concrete pack id.
 * @param {string | null | undefined} template
 * @param {string | null | undefined} variant
 * @param {string | null | undefined} industry
 */
export function resolvePackId(template, variant, industry) {
  let base = template?.trim() || "";
  let forcedVariant = null;

  if (base.endsWith("_b") || base.endsWith("_c")) {
    const parsed = parsePackId(base);
    base = parsed.base;
    forcedVariant = parsed.variant;
  }

  if (!base) {
    base = suggestWebsitePackId(industry);
  }

  const v = forcedVariant || variant || "a";
  return packIdForVariant(base, v);
}

export function suggestWebsitePackId(businessCategory) {
  const cat = (businessCategory ?? "").toLowerCase();
  const byCategory = {
    beauty: "salon",
    creative: "tattoo",
    wellness: "spa",
    coaching: "coach",
    fitness: "fitness",
    medical: "clinic",
    pet: "pet",
    "home-services": "home_services",
    professional: "professional",
    education: "professional",
    event: "professional",
    meetings: "professional",
    misc: "professional",
  };
  if (byCategory[cat]) return byCategory[cat];
  if (cat.includes("beauty") || cat.includes("salon")) return "salon";
  if (cat.includes("tattoo")) return "tattoo";
  if (cat.includes("spa") || cat.includes("wellness")) return "spa";
  if (cat.includes("coach")) return "coach";
  if (cat.includes("fitness")) return "fitness";
  if (cat.includes("photo")) return "photography";
  if (cat.includes("clinic") || cat.includes("medical")) return "clinic";
  if (cat.includes("pet")) return "pet";
  if (cat.includes("home")) return "home_services";
  return "professional";
}

/** @type {any | null} */
let cachedCompose = null;

async function loadComposeModule() {
  if (cachedCompose) return cachedCompose;
  const composePath = path.join(__dirname, ".pack-compose.mjs");
  if (!fs.existsSync(composePath)) {
    throw new Error(
      "Missing .pack-compose.mjs — call ensurePackComposeBundle() before using packs.",
    );
  }
  cachedCompose = await import(
    `${pathToFileURL(composePath).href}?t=${fs.statSync(composePath).mtimeMs}`
  );
  return cachedCompose;
}

export async function loadWebsitePacks() {
  const mod = await loadComposeModule();
  return mod.WEBSITE_PACKS;
}

export async function getWebsitePack(id) {
  const packs = await loadWebsitePacks();
  return packs[id] ?? null;
}

export async function listPackIds() {
  const packs = await loadWebsitePacks();
  return Object.keys(packs);
}

/** Real pack composers from page-builder. */
export async function loadPackComposers() {
  return loadComposeModule();
}

/** @deprecated Prefer listPackIds() after registry load; kept for CLI help before load. */
export const WEBSITE_PACK_IDS = [
  ...BASE_PACK_IDS,
  ...BASE_PACK_IDS.map((id) => `${id}_b`),
  ...BASE_PACK_IDS.map((id) => `${id}_c`),
];
