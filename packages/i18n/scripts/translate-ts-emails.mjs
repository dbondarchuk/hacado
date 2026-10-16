#!/usr/bin/env node
/**
 * Translate TypeScript email copy (forms, email-notification, text-belt, admin system emails)
 * from English sources into fr and es.
 *
 * Shields {{mustache}}, ${expressions}, and HTML tags.
 *
 * Usage:
 *   node --experimental-strip-types scripts/translate-ts-emails.mjs fr es
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isPartialLocale } from "../src/locale-catalog.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../../..");
const MAX_RETRIES = 8;
const RETRY_WAIT_MS = 15_000;
const GOOGLE_CLIENTS = ["dict-chrome-ex", "te", "webapp", "t", "gtx"];

const args = process.argv.slice(2);
const concurrency = Number(
  args
    .find((a) => a.startsWith("--concurrency="))
    ?.slice("--concurrency=".length) || 4,
);
const languages = args.filter((a) => !a.startsWith("--"));

if (languages.length === 0) {
  console.error("Usage: node scripts/translate-ts-emails.mjs <lang> [lang...]");
  process.exit(1);
}

for (const language of languages) {
  if (isPartialLocale(language)) {
    console.error(`Refusing partial locale "${language}".`);
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const rateGate = {
  coolUntil: 0,
  nextSlot: 0,
  minIntervalMs: 120,
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
      if (!Array.isArray(data?.[0])) throw new Error("Bad response shape");
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

function saveCache(filePath, cache) {
  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2), "utf8");
}

function shield(text) {
  const tokens = [];
  const push = (match) => {
    const id = `___PH_${tokens.length}___`;
    tokens.push(match);
    return id;
  };
  let shielded = String(text)
    .replace(/\$\{[\s\S]*?\}/g, push)
    .replace(/\{\{[#^/!]?\s*[\s\S]*?\}\}/g, push)
    .replace(/\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]*)*/g, push)
    .replace(/<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?\s*\/?>/g, push);
  return { shielded, tokens };
}

function unshield(text, tokens) {
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

function shouldTranslate(text) {
  const trimmed = text.trim();
  if (!/[A-Za-z]/.test(trimmed)) return false;
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(trimmed)) return false;
  if (/^[@./]/.test(trimmed)) return false;
  if (/^https?:\/\//.test(trimmed) && !trimmed.includes(" ")) return false;
  return true;
}

async function translateLiteral(text, language, cache, cachePath) {
  if (!shouldTranslate(text)) return text;
  const key = `email-v2|en|${language}|${text}`;
  if (cache[key]) return cache[key];
  const { shielded, tokens } = shield(text);
  const translated = unshield(
    await fetchFromGoogle(shielded, language.split("-")[0]),
    tokens,
  );
  cache[key] = translated;
  return translated;
}

function splitImports(source) {
  const lines = source.split("\n");
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("import ")) lastImport = i;
  }
  if (lastImport < 0) return { head: "", body: source };
  return {
    head: lines.slice(0, lastImport + 1).join("\n") + "\n",
    body: lines.slice(lastImport + 1).join("\n"),
  };
}

function findLiterals(body) {
  const found = [];
  let i = 0;
  while (i < body.length) {
    const ch = body[i];
    if (ch !== '"' && ch !== "'" && ch !== "`") {
      i++;
      continue;
    }
    const quote = ch;
    let j = i + 1;
    let closed = false;
    while (j < body.length) {
      if (body[j] === "\\") {
        j += 2;
        continue;
      }
      if (quote === "`" && body[j] === "$" && body[j + 1] === "{") {
        let depth = 1;
        j += 2;
        while (j < body.length && depth > 0) {
          if (body[j] === "{") depth++;
          else if (body[j] === "}") depth--;
          j++;
        }
        continue;
      }
      if (body[j] === quote) {
        closed = true;
        break;
      }
      j++;
    }
    if (!closed) break;
    found.push({ start: i, end: j + 1, quote, raw: body.slice(i + 1, j) });
    i = j + 1;
  }
  return found;
}

function unescapeLiteral(raw, quote) {
  if (quote === "`") {
    return raw.replace(/\\`/g, "`").replace(/\\\\/g, "\\");
  }
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
}

function escapeLiteral(text, quote) {
  if (quote === "`") {
    return text.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
  }
  if (quote === '"') return JSON.stringify(text).slice(1, -1);
  return text.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

async function translateBody(body, language, cache, cachePath) {
  const literals = findLiterals(body);
  let result = body;
  for (let n = literals.length - 1; n >= 0; n--) {
    const lit = literals[n];
    const before = body.slice(Math.max(0, lit.start - 24), lit.start);
    if (
      /\btype\s*:\s*$/.test(before) ||
      /\[\s*$/.test(before) ||
      /DateFormat\s*:\s*$/.test(before)
    ) {
      continue;
    }
    const value = unescapeLiteral(lit.raw, lit.quote);
    if (/^yyyy/.test(value)) continue;
    const translated = await translateLiteral(
      value,
      language,
      cache,
      cachePath,
    );
    if (translated === value) continue;
    const escaped = escapeLiteral(translated, lit.quote);
    result =
      result.slice(0, lit.start) +
      lit.quote +
      escaped +
      lit.quote +
      result.slice(lit.end);
  }
  return result;
}

function renameExports(source, language) {
  const cap = language[0].toUpperCase() + language.slice(1);
  return source
    .replace(/\bEn([A-Z][A-Za-z0-9]*)/g, `${cap}$1`)
    .replace(/([A-Za-z0-9]+)En\b/g, `$1${cap}`);
}

function listJobs() {
  const jobs = [];
  const singleFiles = [
    "packages/app-store/src/apps/forms/emails/translations/en.ts",
    "packages/app-store/src/apps/email-notification/emails/translations/en.ts",
    "packages/app-store/src/apps/text-belt/emails/translations/en.ts",
    "packages/app-store/src/apps/text-message-notification/messages/translations/en.ts",
    "packages/app-store/src/apps/text-message-resender/messages/translations/en.ts",
    "packages/app-store/src/apps/gift-card-studio/translations/en/invoice.ts",
  ];
  for (const rel of singleFiles) {
    jobs.push({
      src: path.join(ROOT, rel),
      dest: (language) =>
        path.join(
          ROOT,
          rel
            .replace(/\/en\.ts$/, `/${language}.ts`)
            .replace(/\/en\//, `/${language}/`),
        ),
      rename: true,
    });
  }

  const adminEn = path.join(ROOT, "apps/admin/src/i18n/email/en");
  for (const file of fs.readdirSync(adminEn)) {
    if (!file.endsWith(".ts") || file === "index.ts") continue;
    jobs.push({
      src: path.join(adminEn, file),
      dest: (language) =>
        path.join(ROOT, "apps/admin/src/i18n/email", language, file),
      rename: false,
    });
  }
  return jobs;
}

async function mapPool(items, limit, worker) {
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      await worker(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
}

const jobs = listJobs();
console.log(`Found ${jobs.length} email source file(s).`);

for (const language of languages) {
  const cachePath = path.join(
    __dirname,
    `en-${language}.emails.translation-cache.json`,
  );
  const cache = loadCache(cachePath);
  console.log(`\n=== emails → ${language} ===`);
  let done = 0;
  await mapPool(jobs, concurrency, async (job) => {
    const source = fs.readFileSync(job.src, "utf8");
    const { head, body } = splitImports(source);
    const translatedBody = await translateBody(
      body,
      language,
      cache,
      cachePath,
    );
    let output = head + translatedBody;
    if (job.rename) output = renameExports(output, language);
    const outPath = job.dest(language);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output, "utf8");
    done++;
    process.stdout.write(`\rWrote ${done}/${jobs.length}`);
    if (done % 3 === 0) saveCache(cachePath, cache);
  });
  saveCache(cachePath, cache);
  process.stdout.write("\n");
}

console.log("\nEmail copy translation complete.");
