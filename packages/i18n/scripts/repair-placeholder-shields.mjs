#!/usr/bin/env node
/**
 * Repair locale YAML / translation cache entries corrupted by non-recursive
 * placeholder unshielding (leftover ___PH_N___ markers).
 *
 * Usage:
 *   node --experimental-strip-types scripts/repair-placeholder-shields.mjs
 *   node --experimental-strip-types scripts/repair-placeholder-shields.mjs fr es
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, "../src/locales");
const APPS_DIR = path.join(__dirname, "../../app-store/src/apps");
const PH_RE = /___PH_\d+___/;

const languages = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const targets = languages.length > 0 ? languages : ["fr", "es"];

function shieldTranslatableTokens(text) {
  const tokens = [];
  const push = (match) => {
    const id = `___PH_${tokens.length}___`;
    tokens.push(match);
    return id;
  };

  let shielded = String(text).replace(
    /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?\s*\/?>/g,
    push,
  );

  let previous;
  do {
    previous = shielded;
    shielded = shielded.replace(/\{[^{}]+\}/g, push);
  } while (shielded !== previous);

  return { shielded, tokens };
}

function unshieldTranslatableTokens(text, tokens) {
  let result = String(text);
  let previous;
  do {
    previous = result;
    result = result.replace(/___PH_(\d+)___/g, (_, index) => {
      const token = tokens[Number(index)];
      return token === undefined ? `___PH_${index}___` : token;
    });
  } while (result !== previous);

  return result;
}

function repairValue(english, corrupted) {
  if (!PH_RE.test(corrupted)) return corrupted;

  const { tokens } = shieldTranslatableTokens(english);
  const repaired = unshieldTranslatableTokens(corrupted, tokens);
  if (PH_RE.test(repaired)) {
    // Fall back to English structure if markers remain unmatched.
    return english;
  }

  return repaired;
}

function repairTree(enNode, localeNode) {
  let changed = 0;
  if (typeof enNode === "string" && typeof localeNode === "string") {
    if (!PH_RE.test(localeNode)) return { value: localeNode, changed: 0 };

    const next = repairValue(enNode, localeNode);
    return { value: next, changed: next === localeNode ? 0 : 1 };
  }

  if (
    enNode &&
    typeof enNode === "object" &&
    !Array.isArray(enNode) &&
    localeNode &&
    typeof localeNode === "object" &&
    !Array.isArray(localeNode)
  ) {
    const result = { ...localeNode };
    for (const key of Object.keys(enNode)) {
      if (!(key in result)) continue;

      const repaired = repairTree(enNode[key], result[key]);
      result[key] = repaired.value;
      changed += repaired.changed;
    }

    return { value: result, changed };
  }

  return { value: localeNode, changed: 0 };
}

function loadYaml(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.trim()) return null;

  return parseYaml(raw);
}

function writeYaml(filePath, value) {
  fs.writeFileSync(
    filePath,
    `${stringifyYaml(value, { lineWidth: 0 })}\n`,
    "utf8",
  );
}

function listPairedFiles(language) {
  const pairs = [];
  const enCore = path.join(LOCALES_DIR, "en");
  const locCore = path.join(LOCALES_DIR, language);
  if (fs.existsSync(enCore) && fs.existsSync(locCore)) {
    for (const f of fs.readdirSync(enCore)) {
      if (!/\.(yaml|yml)$/.test(f) || f.startsWith("_")) continue;

      const enPath = path.join(enCore, f);
      const locPath = path.join(locCore, f);
      if (fs.existsSync(locPath)) pairs.push({ enPath, locPath });
    }
  }

  if (fs.existsSync(APPS_DIR)) {
    for (const appName of fs.readdirSync(APPS_DIR)) {
      const enDir = path.join(APPS_DIR, appName, "translations", "en");
      const locDir = path.join(APPS_DIR, appName, "translations", language);
      if (!fs.existsSync(enDir) || !fs.existsSync(locDir)) continue;

      for (const f of fs.readdirSync(enDir)) {
        if (!/\.(yaml|yml)$/.test(f) || f.startsWith("_")) continue;

        const enPath = path.join(enDir, f);
        const locPath = path.join(locDir, f);
        if (fs.existsSync(locPath)) pairs.push({ enPath, locPath });
      }
    }
  }

  return pairs;
}

function repairCache(language) {
  const cachePath = path.join(
    __dirname,
    `en-${language}.translation-cache.json`,
  );

  if (!fs.existsSync(cachePath)) return 0;

  const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  let changed = 0;
  for (const [key, value] of Object.entries(cache)) {
    if (typeof value !== "string" || !PH_RE.test(value)) continue;

    // Cache keys: en|<lang>|<provider>|<english source>
    const match = key.match(/^en\|[^|]+\|[^|]+\|(.*)$/s);
    if (!match) continue;

    const english = match[1];
    const repaired = repairValue(english, value);
    if (repaired !== value) {
      cache[key] = repaired;
      changed++;
    }
  }

  if (changed > 0) {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf8");
  }

  return changed;
}

let filesChanged = 0;
let stringsChanged = 0;
let cacheChanged = 0;

for (const language of targets) {
  const cacheFixes = repairCache(language);
  cacheChanged += cacheFixes;
  console.log(`${language}: repaired ${cacheFixes} cache entr(y/ies)`);

  for (const { enPath, locPath } of listPairedFiles(language)) {
    const enData = loadYaml(enPath);
    const locData = loadYaml(locPath);
    if (!enData || !locData) continue;

    const { value, changed } = repairTree(enData, locData);
    if (changed > 0) {
      writeYaml(locPath, value);
      filesChanged++;
      stringsChanged += changed;
      console.log(
        `  fixed ${changed} in ${path.relative(path.join(__dirname, "../.."), locPath)}`,
      );
    }
  }
}

console.log(
  `\nDone. ${stringsChanged} string(s) in ${filesChanged} file(s); ${cacheChanged} cache entr(y/ies).`,
);
