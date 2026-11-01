#!/usr/bin/env node
/**
 * Machine-translate all complete locale catalogs for one or more languages.
 *
 * Usage:
 *   node scripts/translate-locale-batch.mjs fr es
 *   node scripts/translate-locale-batch.mjs fr --provider=google --concurrency=8
 *
 * Skips partial locales (en-CA, fr-CA, es-MX). Deduplicates identical English
 * strings across files so each unique phrase is translated once per language.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { isPartialLocale } from "../src/locale-catalog.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, "../src/locales");
const APPS_DIR = path.join(__dirname, "../../app-store/src/apps");
const DEFAULT_PROVIDER = "google";
const MAX_RETRIES = 8;
const RETRY_WAIT_MS = 15_000;
const MAX_CHUNK = 900;

const args = process.argv.slice(2);
const provider =
  args.find((a) => a.startsWith("--provider="))?.slice("--provider=".length) ||
  DEFAULT_PROVIDER;

const concurrency = Number(
  args
    .find((a) => a.startsWith("--concurrency="))
    ?.slice("--concurrency=".length) || 3,
);

const languages = args.filter((a) => !a.startsWith("--"));

if (languages.length === 0) {
  console.error(
    "Usage: node scripts/translate-locale-batch.mjs <lang> [lang...] [--provider=google|mymemory] [--concurrency=N]",
  );

  process.exit(1);
}

for (const language of languages) {
  if (isPartialLocale(language)) {
    console.error(
      `Refusing to batch-translate partial locale "${language}". Overlay keys must be curated.`,
    );

    process.exit(1);
  }
}

if (!["google", "mymemory"].includes(provider)) {
  console.error(`Unsupported provider "${provider}".`);
  process.exit(1);
}

function isEmptyRootObject(obj) {
  return (
    !obj ||
    (typeof obj === "object" &&
      !Array.isArray(obj) &&
      Object.keys(obj).length === 0)
  );
}

function loadSourceObject(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.trim()) return null;
  if (filePath.endsWith(".json")) {
    return JSON.parse(raw);
  }

  const doc = parseYaml(raw);
  if (
    doc != null &&
    typeof doc === "object" &&
    !Array.isArray(doc) &&
    !isEmptyRootObject(doc)
  ) {
    return doc;
  }

  return null;
}

function listEnFiles() {
  const files = [];
  for (const f of fs.readdirSync(path.join(LOCALES_DIR, "en"))) {
    if (!/\.(yaml|yml|json)$/.test(f) || f.startsWith("_")) continue;

    files.push({
      kind: "core",
      enPath: path.join(LOCALES_DIR, "en", f),
      relative: f,
    });
  }

  if (fs.existsSync(APPS_DIR)) {
    for (const appName of fs.readdirSync(APPS_DIR).sort()) {
      const enDir = path.join(APPS_DIR, appName, "translations", "en");
      if (!fs.existsSync(enDir)) continue;

      for (const f of fs.readdirSync(enDir)) {
        if (!/\.(yaml|yml|json)$/.test(f) || f.startsWith("_")) continue;

        files.push({
          kind: "app",
          appName,
          enPath: path.join(enDir, f),
          relative: f,
        });
      }
    }
  }

  return files;
}

function collectStrings(node, out) {
  if (typeof node === "string") {
    const trimmed = node.trim();
    if (trimmed) out.add(trimmed);
    return;
  }

  if (node && typeof node === "object" && !Array.isArray(node)) {
    for (const value of Object.values(node)) {
      collectStrings(value, out);
    }
  }
}

function mapStrings(node, translateMap) {
  if (typeof node === "string") {
    const trimmed = node.trim();
    if (!trimmed) return node;

    return translateMap.get(trimmed) ?? node;
  }

  if (node && typeof node === "object" && !Array.isArray(node)) {
    const result = {};
    for (const [key, value] of Object.entries(node)) {
      result[key] = mapStrings(value, translateMap);
    }

    return result;
  }

  return node;
}

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
  // Nested ICU shields embed ___PH_N___ inside outer token values, so expand
  // repeatedly until stable (a single replace pass leaves inner markers).
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

function providerLanguageCode(language) {
  return String(language).split("-")[0] || language;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Unofficial Google Translate client IDs — rotate on 429 in case quotas are per-client. */
const GOOGLE_CLIENTS = ["dict-chrome-ex", "te", "webapp", "t", "gtx"];

/** Shared across workers so a 429 pauses everyone, not just one request. */
const rateGate = {
  coolUntil: 0,
  nextSlot: 0,
  minIntervalMs: provider === "mymemory" ? 250 : 150,
  googleClientIndex: 0,
};

function currentGoogleClient() {
  return GOOGLE_CLIENTS[rateGate.googleClientIndex % GOOGLE_CLIENTS.length];
}

function rotateGoogleClient() {
  rateGate.googleClientIndex =
    (rateGate.googleClientIndex + 1) % GOOGLE_CLIENTS.length;

  return currentGoogleClient();
}

async function waitForRateGate() {
  const now = Date.now();
  const startAt = Math.max(now, rateGate.coolUntil, rateGate.nextSlot);
  rateGate.nextSlot = startAt + rateGate.minIntervalMs;
  if (startAt > now) {
    await sleep(startAt - now);
  }
}

function tripRateLimit(status, attempt) {
  const nextClient = rotateGoogleClient();
  // Shorter cool-down when we still have unused clients to try.
  const rotatedFresh = rateGate.googleClientIndex !== 0 || attempt === 1;
  const backoff = rotatedFresh
    ? Math.min(RETRY_WAIT_MS, 5_000 * attempt)
    : RETRY_WAIT_MS * attempt;

  rateGate.coolUntil = Math.max(rateGate.coolUntil, Date.now() + backoff);
  rateGate.minIntervalMs = Math.min(rateGate.minIntervalMs + 25, 600);
  console.log(
    `\nRate limited (${status}), switching client → ${nextClient}, cooling ${backoff}ms (interval=${rateGate.minIntervalMs}ms)...`,
  );
}

async function retryingFetch(buildUrl, parseResponse) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await waitForRateGate();
      const url = typeof buildUrl === "function" ? buildUrl() : buildUrl;
      const response = await fetch(url);
      if (response.status === 429 || response.status === 503) {
        tripRateLimit(response.status, attempt);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      return parseResponse(json);
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;

      const backoff = RETRY_WAIT_MS * attempt;
      console.log(`\nRetry ${attempt}/${MAX_RETRIES}: ${error.message}`);
      await sleep(backoff);
    }
  }

  throw new Error("Translation request failed after retries.");
}

async function fetchFromGoogle(text, language) {
  return retryingFetch(
    () =>
      `https://translate.googleapis.com/translate_a/single?client=${encodeURIComponent(currentGoogleClient())}&sl=en&tl=${encodeURIComponent(language)}&dt=t&q=${encodeURIComponent(text)}`,
    (data) => {
      if (!Array.isArray(data) || !Array.isArray(data[0])) {
        throw new Error("Bad response shape");
      }

      const translated = data[0]
        .map((row) => (Array.isArray(row) ? row[0] : ""))
        .join("");

      if (!translated) throw new Error("Empty translation");

      return translated;
    },
  );
}

async function fetchFromMyMemory(text, language) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(language)}`;
  return retryingFetch(url, (data) => {
    const translated = data?.responseData?.translatedText;
    if (typeof translated !== "string" || !translated) {
      throw new Error("Empty translation");
    }

    return translated;
  });
}

function loadCache(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(filePath, cacheObject) {
  fs.writeFileSync(filePath, JSON.stringify(cacheObject, null, 2), "utf8");
}

async function translateOne(text, language, cache, cachePath) {
  const cacheKey = `en|${language}|${provider}|${text}`;
  if (cache[cacheKey]) return cache[cacheKey];

  const { shielded, tokens } = shieldTranslatableTokens(text);
  const targetLang = providerLanguageCode(language);
  let translated = "";
  for (let i = 0; i < shielded.length; i += MAX_CHUNK) {
    const chunk = shielded.slice(i, i + MAX_CHUNK);
    const part =
      provider === "mymemory"
        ? await fetchFromMyMemory(chunk, targetLang)
        : await fetchFromGoogle(chunk, targetLang);

    translated += part;
  }

  translated = unshieldTranslatableTokens(translated, tokens);
  cache[cacheKey] = translated;
  return translated;
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );

  return results;
}

function localeOutPath(file, language) {
  if (file.kind === "core") {
    return path.join(
      LOCALES_DIR,
      language,
      file.relative.replace(/\.json$/, ".yaml"),
    );
  }

  const stem = file.relative.replace(/\.(json|yaml|yml)$/, "");
  return path.join(
    APPS_DIR,
    file.appName,
    "translations",
    language,
    `${stem}.yaml`,
  );
}

function writeLocale(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    `${stringifyYaml(value, { lineWidth: 0 })}\n`,
    "utf8",
  );
}

function buildTranslateMap(strings, language, cache) {
  const translateMap = new Map();
  for (const text of strings) {
    translateMap.set(text, cache[`en|${language}|${provider}|${text}`] ?? text);
  }

  return translateMap;
}

/** Flush all locale YAML from the current cache (untranslated keys stay English). */
function flushLocaleFiles(parsedFiles, language, strings, cache) {
  const translateMap = buildTranslateMap(strings, language, cache);
  for (const { file, data } of parsedFiles) {
    writeLocale(localeOutPath(file, language), mapStrings(data, translateMap));
  }
}

const FLUSH_EVERY = 50;

const enFiles = listEnFiles();
const uniqueStrings = new Set();
const parsedFiles = [];

for (const file of enFiles) {
  const data = loadSourceObject(file.enPath);
  if (!data) continue;

  parsedFiles.push({ file, data });
  collectStrings(data, uniqueStrings);
}

console.log(
  `Found ${parsedFiles.length} files, ${uniqueStrings.size} unique English strings.`,
);

for (const language of languages) {
  const cachePath = path.join(
    __dirname,
    `en-${language}.translation-cache.json`,
  );

  const cache = loadCache(cachePath);
  const strings = [...uniqueStrings];
  const pending = strings.filter(
    (s) => !cache[`en|${language}|${provider}|${s}`],
  );

  console.log(
    `\n=== ${language}: ${pending.length} to translate (${strings.length - pending.length} cached) ===`,
  );

  // Seed / refresh locale files from whatever is already cached so a crash
  // never leaves the language folder empty.
  flushLocaleFiles(parsedFiles, language, strings, cache);
  console.log(
    `Wrote ${parsedFiles.length} ${language} locale file(s) (initial flush).`,
  );

  let done = 0;
  let flushErrors = 0;
  await mapPool(pending, concurrency, async (text) => {
    try {
      await translateOne(text, language, cache, cachePath);
    } catch (error) {
      console.error(`\nFailed "${text.slice(0, 80)}...": ${error.message}`);
      saveCache(cachePath, cache);
      flushLocaleFiles(parsedFiles, language, strings, cache);
      throw error;
    }

    done++;
    if (done % 25 === 0 || done === pending.length) {
      process.stdout.write(`\rTranslated ${done}/${pending.length}`);
      saveCache(cachePath, cache);
    }

    if (done % FLUSH_EVERY === 0 || done === pending.length) {
      try {
        flushLocaleFiles(parsedFiles, language, strings, cache);
      } catch (error) {
        flushErrors++;
        console.error(`\nFlush failed: ${error.message}`);
      }
    }
  });

  if (pending.length > 0) {
    process.stdout.write("\n");
    saveCache(cachePath, cache);
    flushLocaleFiles(parsedFiles, language, strings, cache);
  }

  console.log(
    `Wrote ${parsedFiles.length} ${language} locale file(s).${flushErrors ? ` (${flushErrors} flush error(s))` : ""}`,
  );
}

console.log("\nBatch translation complete.");
