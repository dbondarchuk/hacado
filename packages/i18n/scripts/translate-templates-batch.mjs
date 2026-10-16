#!/usr/bin/env node
/**
 * Machine-translate built-in communication templates (core + app-store)
 * from English TypeScript sources into other locales.
 *
 * Usage:
 *   node --experimental-strip-types scripts/translate-templates-batch.mjs fr es
 *   node --experimental-strip-types scripts/translate-templates-batch.mjs fr --concurrency=4
 *
 * Protects Mustache placeholders {{...}} / {{#...}} and simple HTML tags.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isPartialLocale } from "../src/locale-catalog.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../../..");
const DEFAULT_PROVIDER = "google";
const MAX_RETRIES = 8;
const RETRY_WAIT_MS = 15_000;
const ADDONS_DEFAULT_EN = "Addons selected: {{#addons}}{{name}}, {{/addons}}";

const GOOGLE_CLIENTS = ["dict-chrome-ex", "te", "webapp", "t", "gtx"];

const TEMPLATE_ROOTS = [
  path.join(ROOT, "apps/admin/src/components/admin/templates/templates"),
  ...fs
    .readdirSync(path.join(ROOT, "packages/app-store/src/apps"))
    .map((app) =>
      path.join(ROOT, "packages/app-store/src/apps", app, "templates"),
    )
    .filter((dir) => fs.existsSync(path.join(dir, "en"))),
];

const args = process.argv.slice(2);
const provider =
  args.find((a) => a.startsWith("--provider="))?.slice("--provider=".length) ||
  DEFAULT_PROVIDER;
const concurrency = Number(
  args
    .find((a) => a.startsWith("--concurrency="))
    ?.slice("--concurrency=".length) || 4,
);
const languages = args.filter((a) => !a.startsWith("--"));

if (languages.length === 0) {
  console.error(
    "Usage: node scripts/translate-templates-batch.mjs <lang> [lang...] [--concurrency=N]",
  );
  process.exit(1);
}

for (const language of languages) {
  if (isPartialLocale(language)) {
    console.error(
      `Refusing to batch-translate partial locale "${language}". Use base locales (fr, es).`,
    );
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function listEnTemplateFiles() {
  const files = [];
  for (const root of TEMPLATE_ROOTS) {
    const enDir = path.join(root, "en");
    if (!fs.existsSync(enDir)) continue;
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(".ts") && entry.name !== "index.ts") {
          files.push({
            enPath: full,
            relative: path.relative(enDir, full),
            root,
          });
        }
      }
    };
    walk(enDir);
  }
  return files;
}

function shieldTranslatableTokens(text) {
  const tokens = [];
  const push = (match) => {
    const id = `___PH_${tokens.length}___`;
    tokens.push(match);
    return id;
  };

  let shielded = String(text)
    // Mustache / Handlebars first (including sections)
    .replace(/\{\{[#^/!]?\s*[\s\S]*?\}\}/g, push)
    .replace(/<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?\s*\/?>/g, push);

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

const rateGate = {
  coolUntil: 0,
  nextSlot: 0,
  minIntervalMs: 150,
  googleClientIndex: 0,
};

function currentGoogleClient() {
  return GOOGLE_CLIENTS[rateGate.googleClientIndex % GOOGLE_CLIENTS.length];
}

function tripRateLimit(status, attempt) {
  rateGate.googleClientIndex =
    (rateGate.googleClientIndex + 1) % GOOGLE_CLIENTS.length;
  const backoff = Math.min(RETRY_WAIT_MS * attempt, 60_000);
  rateGate.coolUntil = Math.max(rateGate.coolUntil, Date.now() + backoff);
  rateGate.minIntervalMs = Math.min(rateGate.minIntervalMs + 25, 600);
  console.log(
    `\nRate limited (${status}), client → ${currentGoogleClient()}, cooling ${backoff}ms...`,
  );
}

async function waitForRateGate() {
  const now = Date.now();
  const startAt = Math.max(now, rateGate.coolUntil, rateGate.nextSlot);
  rateGate.nextSlot = startAt + rateGate.minIntervalMs;
  if (startAt > now) await sleep(startAt - now);
}

async function fetchFromGoogle(text, language) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await waitForRateGate();
    const url = `https://translate.googleapis.com/translate_a/single?client=${encodeURIComponent(currentGoogleClient())}&sl=en&tl=${encodeURIComponent(language)}&dt=t&q=${encodeURIComponent(text)}`;
    try {
      const response = await fetch(url);
      if (response.status === 429 || response.status === 503) {
        tripRateLimit(response.status, attempt);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data) || !Array.isArray(data[0])) {
        throw new Error("Bad response shape");
      }
      const translated = data[0]
        .map((row) => (Array.isArray(row) ? row[0] : ""))
        .join("");
      if (!translated) throw new Error("Empty translation");
      return translated;
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      await sleep(RETRY_WAIT_MS * attempt);
    }
  }
  throw new Error("Translation failed");
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

async function translateText(text, language, cache, cachePath) {
  const trimmed = String(text);
  if (!trimmed.trim() || !/[A-Za-z]/.test(trimmed)) return trimmed;

  const cacheKey = `tpl|en|${language}|${provider}|${trimmed}`;
  if (cache[cacheKey]) return cache[cacheKey];

  const { shielded, tokens } = shieldTranslatableTokens(trimmed);
  const translated = unshieldTranslatableTokens(
    await fetchFromGoogle(shielded, language.split("-")[0]),
    tokens,
  );
  cache[cacheKey] = translated;
  return translated;
}

/**
 * Translate string/template-literal values for known template fields.
 * Leaves ids, types, imports, and code structure untouched.
 */
async function translateTemplateSource(source, language, cache, cachePath) {
  let result = source.replace(
    /addonsSelectedBlock\(\s*\)/g,
    `addonsSelectedBlock(${JSON.stringify(ADDONS_DEFAULT_EN)})`,
  );

  const patterns = [
    // name/subject/text/value: "..."
    /(\b(?:name|subject|text|value)\s*:\s*)("(?:\\.|[^"\\])*")/g,
    // name/subject/text/value: '...'
    /(\b(?:name|subject|text|value)\s*:\s*)('(?:\\.|[^'\\])*')/g,
    // name/subject/text/value: `...`
    /(\b(?:name|subject|text|value)\s*:\s*)(`(?:\\.|[^`\\])*`)/g,
    // addonsSelectedBlock("...")
    /(\baddonsSelectedBlock\s*\(\s*)("(?:\\.|[^"\\])*")(\s*\))/g,
  ];

  for (const pattern of patterns) {
    const matches = [...result.matchAll(pattern)];
    // Replace from end to start so offsets stay valid
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const full = match[0];
      const prefix = match[1];
      const literal = match[2];
      const suffix = match[3] ?? "";
      const quote = literal[0];
      const inner = literal.slice(1, -1);
      // Skip non-translatable ids / types accidentally matched
      if (
        !/[A-Za-z]/.test(inner) ||
        /^(email|text-message|title|text|html)$/.test(inner)
      ) {
        continue;
      }
      const unescaped = inner
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\`/g, "`")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, "\\");
      const translated = await translateText(
        unescaped,
        language,
        cache,
        cachePath,
      );
      let escaped;
      if (quote === "`") {
        escaped = translated
          .replace(/\\/g, "\\\\")
          .replace(/`/g, "\\`")
          .replace(/\$\{/g, "\\${");
      } else if (quote === '"') {
        escaped = JSON.stringify(translated).slice(1, -1);
      } else {
        escaped = translated
          .replace(/\\/g, "\\\\")
          .replace(/'/g, "\\'")
          .replace(/\n/g, "\\n");
      }
      const replacement = `${prefix}${quote}${escaped}${quote}${suffix}`;
      result =
        result.slice(0, match.index) +
        replacement +
        result.slice(match.index + full.length);
    }
  }

  return result;
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

const enFiles = listEnTemplateFiles();
console.log(`Found ${enFiles.length} English template file(s).`);

for (const language of languages) {
  const cachePath = path.join(
    __dirname,
    `en-${language}.templates.translation-cache.json`,
  );
  const cache = loadCache(cachePath);
  console.log(`\n=== templates → ${language} ===`);

  let done = 0;
  await mapPool(enFiles, concurrency, async (file) => {
    const source = fs.readFileSync(file.enPath, "utf8");
    const translated = await translateTemplateSource(
      source,
      language,
      cache,
      cachePath,
    );
    const outPath = path.join(file.root, language, file.relative);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, translated, "utf8");
    done++;
    if (done % 5 === 0 || done === enFiles.length) {
      process.stdout.write(`\rWrote ${done}/${enFiles.length}`);
      saveCache(cachePath, cache);
    }
  });
  process.stdout.write("\n");
  saveCache(cachePath, cache);
  console.log(`Done ${language}.`);
}

console.log("\nTemplate translation complete.");
