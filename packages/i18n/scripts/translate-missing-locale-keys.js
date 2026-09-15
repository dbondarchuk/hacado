/**
 * Translate missing locale keys from English source files.
 *
 * Usage examples:
 *   node scripts/translate-missing-locale-keys.js admin
 *   node scripts/translate-missing-locale-keys.js install uk
 *   node scripts/translate-missing-locale-keys.js waitlist/admin uk --provider=mymemory
 *
 * Positional args:
 *   1) target: "admin", "install", or app short path like "waitlist/admin"
 *   2) language (optional): locale code, defaults to "uk"
 *
 * Options:
 *   --provider=google|mymemory (default: google)
 *   --lang=<locale> (alternative to positional language)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const i18nDir = path.join(__dirname, "..");
const localesDir = path.join(i18nDir, "src/locales");
const appsDir = path.join(i18nDir, "../app-store/src/apps");

const DEFAULT_LANG = "uk";
const DEFAULT_PROVIDER = "google";
const RETRY_WAIT_MS = 5_000;
const MAX_RETRIES = 8;
const MAX_CHUNK = 900;

const args = process.argv.slice(2);
const { target, language, provider } = parseArgs(args);

if (!target) {
  printUsage();
  process.exit(1);
}

if (!["google", "mymemory"].includes(provider)) {
  console.error(
    `Unsupported provider "${provider}". Use "google" or "mymemory".`,
  );
  process.exit(1);
}

const cachePath = path.join(__dirname, `en-${language}.translation-cache.json`);
const cache = loadCache(cachePath);

const resolved = resolveTarget(target, language);
const english = loadSourceStrict(resolved.enPath);
const { object: localeObject, created } = loadOrInitializeLocaleObject(
  resolved.localePath,
  english,
);
if (created) {
  writeLocale(resolved.localePath, localeObject);
}

const tasks = [];
collectTranslationTasks(english, localeObject, [], tasks);

console.log(`Source: ${resolved.enPath}`);
console.log(`Target: ${resolved.localePath}`);
console.log(`Provider: ${provider}`);
if (created) {
  console.log(
    `Locale file was missing/empty and has been initialized from English structure.`,
  );
}
console.log(`Missing or untranslated keys: ${tasks.length}`);

if (tasks.length === 0) {
  console.log("No work needed.");
  process.exit(0);
}

let translatedCount = 0;
for (const task of tasks) {
  const translated = await translateText(task.source, {
    provider,
    language,
    cache,
    cachePath,
  });

  setAtPath(localeObject, task.path, translated);
  writeLocale(resolved.localePath, localeObject);

  translatedCount++;
  process.stdout.write(
    `\rTranslated ${translatedCount}/${tasks.length} keys...`,
  );
}

console.log("\nDone.");

function parseArgs(argv) {
  let optionLang;
  let optionProvider = DEFAULT_PROVIDER;
  const positional = [];

  for (const arg of argv) {
    if (arg.startsWith("--provider=")) {
      optionProvider = arg.slice("--provider=".length).trim();
      continue;
    }
    if (arg.startsWith("--lang=")) {
      optionLang = arg.slice("--lang=".length).trim();
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
    positional.push(arg);
  }

  return {
    target: positional[0],
    language: optionLang || positional[1] || DEFAULT_LANG,
    provider: optionProvider || DEFAULT_PROVIDER,
  };
}

function printUsage() {
  console.log(
    `Usage: node scripts/translate-missing-locale-keys.js <target> [language] [--provider=google|mymemory] [--lang=<locale>]`,
  );
}

function resolveTarget(rawTarget, language) {
  const target = normalizeTarget(rawTarget);

  // App short path format: "<app>/<file>" (for example "waitlist/admin")
  if (target.includes("/")) {
    const [appName, ...rest] = target.split("/");
    const filePart = ensureAppLocaleFile(appName, rest.join("/"));
    const enPath = path.join(appsDir, appName, "translations/en", filePart);
    if (fs.existsSync(enPath)) {
      return {
        kind: "app",
        enPath,
        localePath: path.join(
          appsDir,
          appName,
          `translations/${language}`,
          filePart,
        ),
      };
    }
  }

  // Core locale file format: "admin", "install", "admin.json"
  const fileName = ensureCoreLocaleFilename(target);
  const coreEnPath = path.join(localesDir, "en", fileName);
  if (fs.existsSync(coreEnPath)) {
    return {
      kind: "core",
      enPath: coreEnPath,
      localePath: path.join(localesDir, language, fileName),
    };
  }

  // Direct path support (absolute or relative)
  const directPath = path.isAbsolute(rawTarget)
    ? rawTarget
    : path.resolve(process.cwd(), rawTarget);
  if (fs.existsSync(directPath) && /\.(json|yaml|yml)$/.test(directPath)) {
    const normalizedDirect = path.normalize(directPath);
    const enSegment = `${path.sep}en${path.sep}`;
    if (normalizedDirect.includes(enSegment)) {
      return {
        kind: "direct",
        enPath: normalizedDirect,
        localePath: normalizedDirect.replace(
          enSegment,
          `${path.sep}${language}${path.sep}`,
        ),
      };
    }
  }

  throw new Error(
    `Could not resolve "${rawTarget}" to an English source locale file.\n` +
      `Try a core file (e.g. "admin"), app short path (e.g. "waitlist/admin"), or direct path to an /en/*.{yaml,yml,json} file.`,
  );
}

function normalizeTarget(value) {
  return String(value || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "");
}

function isEmptyRootObject(obj) {
  return (
    !obj ||
    (typeof obj === "object" &&
      !Array.isArray(obj) &&
      Object.keys(obj).length === 0)
  );
}

function loadDataFromPath(filePath, filename) {
  if (filename.endsWith(".yaml") || filename.endsWith(".yml")) {
    if (!fs.existsSync(filePath)) {
      const jsonPath = filePath.replace(/\.(yaml|yml)$/, ".json");
      if (fs.existsSync(jsonPath)) {
        return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      }
      throw new Error(`File not found: ${filePath} (or ${jsonPath})`);
    }
    const raw = fs.readFileSync(filePath, "utf8");
    let doc = null;
    if (raw.trim()) {
      doc = parseYaml(raw);
    }
    if (
      doc != null &&
      typeof doc === "object" &&
      !Array.isArray(doc) &&
      !isEmptyRootObject(doc)
    ) {
      return doc;
    }
    const jsonPath = filePath.replace(/\.(yaml|yml)$/, ".json");
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    }
    return {};
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadSourceStrict(filePath) {
  const filename = path.basename(filePath);
  try {
    return loadDataFromPath(filePath, filename);
  } catch (error) {
    throw new Error(`Failed to read source at "${filePath}": ${error.message}`);
  }
}

/**
 * @param {string} appName
 * @param {string} filePart
 */
function ensureAppLocaleFile(appName, filePart) {
  const rest = (filePart || "admin").replace(/\.(json|yaml|yml)$/, "");
  for (const ext of [".yaml", ".yml", ".json"]) {
    const p = path.join(appsDir, appName, "translations/en", rest + ext);
    if (fs.existsSync(p)) {
      return rest + ext;
    }
  }
  return `${rest}.yaml`;
}

function ensureCoreLocaleFilename(target) {
  const raw = String(target).trim();
  const base = path.basename(raw).replace(/\.(json|yaml|yml)$/, "");
  for (const ext of [".yaml", ".yml", ".json"]) {
    const p = path.join(localesDir, "en", base + ext);
    if (fs.existsSync(p)) {
      return base + ext;
    }
  }
  return `${base}.yaml`;
}

function loadOrInitializeLocaleObject(localePath, englishObject) {
  const dirPath = path.dirname(localePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const fileName = path.basename(localePath);

  if (!fs.existsSync(localePath)) {
    return { object: structuredClone(englishObject), created: true };
  }

  const content = fs.readFileSync(localePath, "utf8");
  if (!content.trim()) {
    return { object: structuredClone(englishObject), created: true };
  }

  const data = loadDataFromPath(localePath, fileName);
  if (isEmptyRootObject(data)) {
    return { object: structuredClone(englishObject), created: true };
  }

  return { object: data, created: false };
}

function writeLocale(filePath, value) {
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
    fs.writeFileSync(
      filePath,
      `${stringifyYaml(value, { lineWidth: 0 })}\n`,
      "utf8",
    );
  } else {
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
  }
}

function collectTranslationTasks(enNode, localeNode, currentPath, tasks) {
  if (typeof enNode === "string") {
    const localeValue = localeNode;
    const needsTranslation =
      localeValue === undefined ||
      localeValue === null ||
      localeValue === "" ||
      localeValue === enNode;

    if (needsTranslation) {
      tasks.push({
        path: currentPath,
        source: enNode,
      });
    }
    return;
  }

  if (enNode && typeof enNode === "object" && !Array.isArray(enNode)) {
    const localeObject =
      localeNode && typeof localeNode === "object" && !Array.isArray(localeNode)
        ? localeNode
        : {};
    for (const key of Object.keys(enNode)) {
      collectTranslationTasks(
        enNode[key],
        localeObject[key],
        [...currentPath, key],
        tasks,
      );
    }
  }
}

function setAtPath(obj, keyPath, value) {
  let current = obj;
  for (let i = 0; i < keyPath.length - 1; i++) {
    const key = keyPath[i];
    if (
      !current[key] ||
      typeof current[key] !== "object" ||
      Array.isArray(current[key])
    ) {
      current[key] = {};
    }
    current = current[key];
  }
  current[keyPath[keyPath.length - 1]] = value;
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateText(text, options) {
  const trimmed = String(text).trim();
  console.log("Translating text:", trimmed);
  if (!trimmed) {
    console.log("No text to translate");
    return text;
  }

  const cacheKey = `en|${options.language}|${options.provider}|${trimmed}`;
  if (options.cache[cacheKey]) {
    console.log("Cache hit for:", cacheKey);
    return options.cache[cacheKey];
  }

  let translated = "";
  for (let i = 0; i < trimmed.length; i += MAX_CHUNK) {
    const chunk = trimmed.slice(i, i + MAX_CHUNK);
    const part =
      options.provider === "mymemory"
        ? await fetchFromMyMemory(chunk, options.language)
        : await fetchFromGoogle(chunk, options.language);

    console.log("Translated chunk:", chunk, "->", part);

    translated += part;
    await sleep(options.provider === "mymemory" ? 550 : 150);
  }

  console.log("Final translated text:", translated);
  options.cache[cacheKey] = translated;
  saveCache(options.cachePath, options.cache);
  return translated;
}

async function fetchFromGoogle(text, language) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(language)}&dt=t&q=${encodeURIComponent(text)}`;
  return retryingFetch(url, (data) => {
    console.log("Fetching from Google:", text, "->", language);
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      console.log("Bad response shape:", data);
      throw new Error("Bad response shape");
    }

    console.log("Good response shape:", data);
    const translated = data[0]
      .map((row) => (Array.isArray(row) ? row[0] : ""))
      .join("");

    if (!translated) {
      console.log("Empty translation:", translated);
      throw new Error("Empty translation");
    }

    console.log("Good translation:", translated);
    return translated;
  });
}

async function fetchFromMyMemory(text, language) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(language)}`;
  return retryingFetch(url, (data) => {
    console.log("Fetching from MyMemory:", text, "->", language);
    const translated = data?.responseData?.translatedText;
    if (typeof translated !== "string" || !translated) {
      console.log("Empty translation:", translated);
      throw new Error("Empty translation");
    }

    console.log("Good translation:", translated);
    return translated;
  });
}

async function retryingFetch(url, parseResponse) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      return parseResponse(json);
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      console.log(
        `\nRetry ${attempt}/${MAX_RETRIES} after error: ${error.message}`,
      );
      await sleep(RETRY_WAIT_MS * attempt);
    }
  }
  throw new Error("Translation request failed after retries.");
}
