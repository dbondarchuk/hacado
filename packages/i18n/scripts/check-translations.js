#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { spawnSync } = require("child_process");
const YAML = require("yaml");

// Configuration
const LOCALES_DIR = path.join(__dirname, "../src/locales");
const APPS_DIR = path.join(__dirname, "../../app-store/src/apps");
const BASE_LOCALE = "en"; // Use English as the base locale to compare against
const CONFIG_FILE = path.join(__dirname, "../.i18n-check.json");
const TRANSLATE_SCRIPT = path.join(
  __dirname,
  "translate-missing-locale-keys.js",
);

const LOCALE_CATALOG_URL = pathToFileURL(
  path.join(__dirname, "../src/locale-catalog.ts"),
).href;

// Load configuration file if it exists
let config = {
  failOnMissing: true,
  failOnExtra: false,
  failOnErrors: true,
  checkApps: true, // New option to enable/disable app translation checking
  ignoreExtraKeys: [],
  ignoreMissingKeys: [],
};

let cliOptions = {
  fix: false,
  provider: "google",
};

try {
  if (fs.existsSync(CONFIG_FILE)) {
    const configContent = fs.readFileSync(CONFIG_FILE, "utf8");
    config = { ...config, ...JSON.parse(configContent) };
  }
} catch (error) {
  console.warn(
    "Warning: Could not load .i18n-check.json config file:",
    error.message,
  );
}

/**
 * Recursively get all keys from a nested object
 * @param {Object} obj - The object to extract keys from
 * @param {string} prefix - The current key prefix
 * @returns {Set<string>} - Set of all keys
 */
function getAllKeys(obj, prefix = "") {
  const keys = new Set();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      // Recursively get keys from nested objects
      const nestedKeys = getAllKeys(value, fullKey);
      nestedKeys.forEach((k) => keys.add(k));
    } else {
      keys.add(fullKey);
    }
  }

  return keys;
}

/**
 * Check if a key exists in a nested object
 * @param {Object} obj - The object to check
 * @param {string} keyPath - The dot-separated key path
 * @returns {boolean} - Whether the key exists
 */
function hasKey(obj, keyPath) {
  const keys = keyPath.split(".");
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return false;
    }
  }

  return true;
}

/**
 * Get all locale directories
 * @returns {string[]} - Array of locale codes
 */
function getLocales() {
  if (!fs.existsSync(LOCALES_DIR)) {
    throw new Error(`Locales directory not found: ${LOCALES_DIR}`);
  }

  return fs
    .readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

function isEmptyRootObject(obj) {
  return (
    !obj ||
    (typeof obj === "object" &&
      !Array.isArray(obj) &&
      Object.keys(obj).length === 0)
  );
}

/**
 * For one locale directory, one file per namespace - prefer .yaml / .yml over .json.
 * @param {string} dirPath
 * @returns {string[]}
 */
function getPreferredTranslationFilenamesInDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const byStem = new Map();
  for (const f of fs.readdirSync(dirPath)) {
    if (f.startsWith(".") || f.endsWith(".generated.ts")) {
      continue;
    }
    if (!/\.(json|yaml|yml)$/.test(f)) {
      continue;
    }

    const stem = f.replace(/\.(json|yaml|yml)$/, "");
    const isYaml = f.endsWith(".yaml") || f.endsWith(".yml");
    const current = byStem.get(stem);
    if (!current) {
      byStem.set(stem, f);
    } else {
      const curIsYaml = current.endsWith(".yaml") || current.endsWith(".yml");
      if (isYaml && !curIsYaml) {
        byStem.set(stem, f);
      }
    }
  }

  return Array.from(byStem.values()).sort();
}

/**
 * Get all translation files for a locale
 * @param {string} locale - The locale code
 * @returns {string[]} - Array of translation file names
 */
function getTranslationFiles(locale) {
  return getPreferredTranslationFilenamesInDir(path.join(LOCALES_DIR, locale));
}

/**
 * Load a locale file from YAML, or from .json if YAML is still empty/comment-only.
 * @param {string} filePath
 * @param {string} filename
 * @returns {Object}
 */
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
      try {
        doc = YAML.parse(raw);
      } catch (e) {
        throw new Error(
          `Invalid YAML: ${filePath}: ${e?.message || String(e)}`,
        );
      }
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

  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content);
}

/**
 * Where key removals / writes should go when a logical filename is e.g. admin.yaml
 * (JSON still holds data until YAML is fully migrated).
 * @param {string} filePath
 * @param {string} filename
 * @returns {{ path: string, format: 'yaml' | 'json' }}
 */
function getStorageWriteTargetForPath(filePath, filename) {
  if (filename.endsWith(".yaml") || filename.endsWith(".yml")) {
    const jsonPath = filePath.replace(/\.(yaml|yml)$/, ".json");
    let doc;
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      if (raw.trim()) {
        try {
          doc = YAML.parse(raw);
        } catch {
          doc = null;
        }
      }
    }

    const yamlHasData =
      doc != null &&
      typeof doc === "object" &&
      !Array.isArray(doc) &&
      !isEmptyRootObject(doc);

    if (yamlHasData) {
      return { path: filePath, format: "yaml" };
    }
    if (fs.existsSync(jsonPath)) {
      return { path: jsonPath, format: "json" };
    }

    return { path: filePath, format: "yaml" };
  }

  return { path: filePath, format: "json" };
}

/**
 * Load and parse a translation file
 * @param {string} locale - The locale code
 * @param {string} filename - The translation file name
 * @returns {Object} - Parsed content
 */
function loadTranslationFile(locale, filename) {
  const filePath = path.join(LOCALES_DIR, locale, filename);
  try {
    return loadDataFromPath(filePath, filename);
  } catch (error) {
    throw new Error(
      `Failed to load ${filePath} via loadTranslationFile: ${error.message}`,
    );
  }
}

/**
 * Get all app directories
 * @returns {string[]} - Array of app names
 */
function getApps() {
  if (!fs.existsSync(APPS_DIR)) {
    throw new Error(`Apps directory not found: ${APPS_DIR}`);
  }

  return fs
    .readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

/**
 * Get all translation files for an app
 * @param {string} appName - The app name
 * @returns {Object} - Object with locale as key and array of files as value
 */
function getAppTranslationFiles(appName) {
  const appDir = path.join(APPS_DIR, appName, "translations");
  const result = {};

  if (!fs.existsSync(appDir)) {
    return result;
  }

  const locales = fs
    .readdirSync(appDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const locale of locales) {
    const localeDir = path.join(appDir, locale);
    result[locale] = getPreferredTranslationFilenamesInDir(localeDir);
  }

  return result;
}

/**
 * Load and parse an app translation file
 * @param {string} appName - The app name
 * @param {string} locale - The locale code
 * @param {string} filename - The translation file name
 * @returns {Object} - Parsed JSON content
 */
function loadAppTranslationFile(appName, locale, filename) {
  const filePath = path.join(
    APPS_DIR,
    appName,
    "translations",
    locale,
    filename,
  );

  try {
    return loadDataFromPath(filePath, filename);
  } catch (error) {
    throw new Error(
      `Failed to load ${filePath} via loadAppTranslationFile: ${error.message}`,
    );
  }
}

/**
 * Load merged parent-chain content for a locale (excluding the locale itself).
 * @param {string} locale
 * @param {string} filename
 * @param {(locale: string, filename: string) => Object} loadFn
 * @param {{ getLocaleChain: Function, deepMergeMessages: Function }} catalog
 */
function loadParentChainContent(locale, filename, loadFn, catalog) {
  const parents = catalog.getLocaleChain(locale).slice(1);
  let result = {};
  for (const parent of [...parents].reverse()) {
    try {
      result = catalog.deepMergeMessages(
        result,
        loadFn(parent, filename) || {},
      );
    } catch {
      // Parent file may be absent; inherit from further ancestors.
    }
  }

  return result;
}

/**
 * Check app translations for missing keys
 * @param {{ isPartialLocale: Function, getLocaleChain: Function, deepMergeMessages: Function }} catalog
 * @returns {Object} - Object containing missing app translations report
 */
function checkAppTranslations(catalog) {
  const apps = getApps();
  const baseLocale = BASE_LOCALE;
  const locales = getLocales().filter((locale) => locale !== baseLocale);

  const report = {
    missing: {},
    extra: {},
    totalMissing: 0,
    totalExtra: 0,
    errors: [],
  };

  for (const appName of apps) {
    const appTranslationFiles = getAppTranslationFiles(appName);

    // Skip apps that don't have translations
    if (Object.keys(appTranslationFiles).length === 0) {
      continue;
    }

    // Initialize report structure for this app
    report.missing[appName] = {};
    report.extra[appName] = {};

    // Get base locale files
    const baseFiles = appTranslationFiles[baseLocale] || [];

    for (const locale of locales) {
      const localeFiles = appTranslationFiles[locale] || [];
      const partial = catalog.isPartialLocale(locale);

      // Initialize locale structure
      if (!report.missing[appName][locale]) {
        report.missing[appName][locale] = {};
      }

      if (!report.extra[appName][locale]) {
        report.extra[appName][locale] = {};
      }

      // Check each file
      for (const filename of baseFiles) {
        if (!localeFiles.includes(filename)) {
          if (partial) {
            // Sparse overlays may omit entire files.
            continue;
          }

          // File is missing entirely
          report.missing[appName][locale][filename] = ["FILE_MISSING"];
          report.totalMissing++;
          continue;
        }

        try {
          const baseContent = loadAppTranslationFile(
            appName,
            baseLocale,
            filename,
          );

          const localeContent = loadAppTranslationFile(
            appName,
            locale,
            filename,
          );

          const parentContent = partial
            ? loadParentChainContent(
                locale,
                filename,
                (loc, file) => loadAppTranslationFile(appName, loc, file),
                catalog,
              )
            : baseContent;

          const baseKeys = getAllKeys(baseContent);
          const localeKeys = getAllKeys(localeContent);

          // Check for missing keys (complete locales only)
          if (!partial) {
            for (const key of baseKeys) {
              if (
                !hasKey(localeContent, key) &&
                !config.ignoreMissingKeys.includes(key)
              ) {
                if (!report.missing[appName][locale][filename]) {
                  report.missing[appName][locale][filename] = [];
                }

                report.missing[appName][locale][filename].push(key);
                report.totalMissing++;
              }
            }
          }

          // Extra keys: must exist on parent chain (or base for complete locales)
          for (const key of localeKeys) {
            if (
              !hasKey(parentContent, key) &&
              !config.ignoreExtraKeys.includes(key)
            ) {
              if (!report.extra[appName][locale][filename]) {
                report.extra[appName][locale][filename] = [];
              }

              report.extra[appName][locale][filename].push(key);
              report.totalExtra++;
            }
          }
        } catch (error) {
          report.errors.push(
            `Error processing app ${appName}/${locale}/${filename}: ${error.message}`,
          );
        }
      }

      // Check for extra files in locale
      for (const filename of localeFiles) {
        if (!baseFiles.includes(filename)) {
          if (!report.extra[appName][locale][filename]) {
            report.extra[appName][locale][filename] = [];
          }

          report.extra[appName][locale][filename].push("EXTRA_FILE");
          report.totalExtra++;
        }
      }
    }
  }

  return report;
}

/**
 * Check translations for missing keys
 * @param {{ isPartialLocale: Function, getLocaleChain: Function, deepMergeMessages: Function }} catalog
 * @returns {Object} - Object containing missing translations report
 */
function checkTranslations(catalog) {
  const locales = getLocales();
  const baseLocale = BASE_LOCALE;

  if (!locales.includes(baseLocale)) {
    throw new Error(
      `Base locale '${baseLocale}' not found in locales directory`,
    );
  }

  const report = {
    missing: {},
    extra: {},
    totalMissing: 0,
    totalExtra: 0,
    errors: [],
  };

  // Get all translation files from base locale
  const baseFiles = getTranslationFiles(baseLocale);

  for (const locale of locales) {
    if (locale === baseLocale) continue;

    const localeFiles = getTranslationFiles(locale);
    const partial = catalog.isPartialLocale(locale);
    report.missing[locale] = {};
    report.extra[locale] = {};

    // Check each file
    for (const filename of baseFiles) {
      if (!localeFiles.includes(filename)) {
        if (partial) {
          // Sparse overlays may omit entire files.
          continue;
        }

        // File is missing entirely
        if (!report.missing[locale][filename]) {
          report.missing[locale][filename] = [];
        }

        report.missing[locale][filename].push("FILE_MISSING");
        report.totalMissing++;
        continue;
      }

      try {
        const baseContent = loadTranslationFile(baseLocale, filename);
        const localeContent = loadTranslationFile(locale, filename);
        const parentContent = partial
          ? loadParentChainContent(
              locale,
              filename,
              loadTranslationFile,
              catalog,
            )
          : baseContent;

        const baseKeys = getAllKeys(baseContent);
        const localeKeys = getAllKeys(localeContent);

        // Check for missing keys (complete locales only)
        if (!partial) {
          for (const key of baseKeys) {
            if (
              !hasKey(localeContent, key) &&
              !config.ignoreMissingKeys.includes(key)
            ) {
              if (!report.missing[locale][filename]) {
                report.missing[locale][filename] = [];
              }

              report.missing[locale][filename].push(key);
              report.totalMissing++;
            }
          }
        }

        // Extra keys: must exist on parent chain (or base for complete locales)
        for (const key of localeKeys) {
          if (
            !hasKey(parentContent, key) &&
            !config.ignoreExtraKeys.includes(key)
          ) {
            if (!report.extra[locale][filename]) {
              report.extra[locale][filename] = [];
            }

            report.extra[locale][filename].push(key);
            report.totalExtra++;
          }
        }
      } catch (error) {
        report.errors.push(
          `Error processing ${locale}/${filename}: ${error.message}`,
        );
      }
    }

    // Check for extra files in locale
    for (const filename of localeFiles) {
      if (!baseFiles.includes(filename)) {
        if (!report.extra[locale][filename]) {
          report.extra[locale][filename] = [];
        }

        report.extra[locale][filename].push("EXTRA_FILE");
        report.totalExtra++;
      }
    }
  }

  return report;
}

/**
 * Print the translation check report
 * @param {Object} report - The translation check report
 * @param {Object} appReport - The app translation check report
 */
function printReport(report, appReport = null) {
  console.log("\n🔍 Translation Check Report");
  console.log("=".repeat(50));

  // Print central translations report
  if (report.errors.length > 0) {
    console.log("\n❌ Central Translation Errors:");
    report.errors.forEach((error) => console.log(`  ${error}`));
  }

  if (report.totalMissing > 0) {
    console.log(`\n❌ Missing Central Translations: ${report.totalMissing}`);
    console.log("-".repeat(30));

    for (const [locale, files] of Object.entries(report.missing)) {
      console.log(`\n${locale.toUpperCase()}:`);
      for (const [filename, missingKeys] of Object.entries(files)) {
        console.log(`  ${filename}:`);
        missingKeys.forEach((key) => {
          if (key === "FILE_MISSING") {
            console.log(`    ❌ File missing entirely`);
          } else {
            console.log(`    ❌ Missing key: ${key}`);
          }
        });
      }
    }
  }

  if (report.totalExtra > 0) {
    console.log(`\n⚠️  Extra Central Translations: ${report.totalExtra}`);
    console.log("-".repeat(30));

    for (const [locale, files] of Object.entries(report.extra)) {
      console.log(`\n${locale.toUpperCase()}:`);
      for (const [filename, extraKeys] of Object.entries(files)) {
        console.log(`  ${filename}:`);
        extraKeys.forEach((key) => {
          if (key === "EXTRA_FILE") {
            console.log(`    ⚠️  Extra file`);
          } else {
            console.log(`    ⚠️  Extra key: ${key}`);
          }
        });
      }
    }
  }

  // Print app translations report if available
  if (appReport) {
    if (appReport.errors.length > 0) {
      console.log("\n❌ App Translation Errors:");
      appReport.errors.forEach((error) => console.log(`  ${error}`));
    }

    if (appReport.totalMissing > 0) {
      console.log(`\n❌ Missing App Translations: ${appReport.totalMissing}`);
      console.log("-".repeat(30));

      for (const [appName, locales] of Object.entries(appReport.missing)) {
        console.log(`\n📱 ${appName.toUpperCase()}:`);
        for (const [locale, files] of Object.entries(locales)) {
          console.log(`  ${locale.toUpperCase()}:`);
          for (const [filename, missingKeys] of Object.entries(files)) {
            console.log(`    ${filename}:`);
            missingKeys.forEach((key) => {
              if (key === "FILE_MISSING") {
                console.log(`      ❌ File missing entirely`);
              } else {
                console.log(`      ❌ Missing key: ${key}`);
              }
            });
          }
        }
      }
    }

    if (appReport.totalExtra > 0) {
      console.log(`\n⚠️  Extra App Translations: ${appReport.totalExtra}`);
      console.log("-".repeat(30));

      for (const [appName, locales] of Object.entries(appReport.extra)) {
        console.log(`\n📱 ${appName.toUpperCase()}:`);
        for (const [locale, files] of Object.entries(locales)) {
          console.log(`  ${locale.toUpperCase()}:`);
          for (const [filename, extraKeys] of Object.entries(files)) {
            console.log(`    ${filename}:`);
            extraKeys.forEach((key) => {
              if (key === "EXTRA_FILE") {
                console.log(`      ⚠️  Extra file`);
              } else {
                console.log(`      ⚠️  Extra key: ${key}`);
              }
            });
          }
        }
      }
    }
  }

  const totalMissing =
    report.totalMissing + (appReport ? appReport.totalMissing : 0);

  const totalExtra = report.totalExtra + (appReport ? appReport.totalExtra : 0);
  const totalErrors =
    report.errors.length + (appReport ? appReport.errors.length : 0);

  if (totalMissing === 0 && totalExtra === 0 && totalErrors === 0) {
    console.log("\n✅ All translations are complete and consistent!");
  }

  console.log("\n" + "=".repeat(50));
}

/**
 * Apply fixes for missing translations by invoking translation script.
 * Fix mode addresses both missing and extra keys/files.
 * Partial locales are never machine-filled (overlays stay sparse).
 * @param {Object} report - Central translation report
 * @param {Object} appReport - App translation report
 * @param {{ isPartialLocale: Function }} catalog
 */
function applyFixes(report, appReport = null, catalog) {
  const cleanupResult = cleanupExtras(report, appReport);
  const targets = new Map();

  // Central translation targets: "<locale>/<filename>" => [target, locale]
  for (const [locale, files] of Object.entries(report.missing || {})) {
    if (catalog.isPartialLocale(locale)) continue;

    for (const [filename, missingKeys] of Object.entries(files || {})) {
      if (!missingKeys || missingKeys.length === 0) continue;

      const dedupeKey = `central:${locale}:${filename}`;
      targets.set(dedupeKey, [filename, locale]);
    }
  }

  // App translation targets: "<app>/<filename>" + locale
  if (appReport) {
    for (const [appName, locales] of Object.entries(appReport.missing || {})) {
      for (const [locale, files] of Object.entries(locales || {})) {
        if (catalog.isPartialLocale(locale)) continue;

        for (const [filename, missingKeys] of Object.entries(files || {})) {
          if (!missingKeys || missingKeys.length === 0) continue;

          const dedupeKey = `app:${appName}:${locale}:${filename}`;
          const target = `${appName}/${filename}`;
          targets.set(dedupeKey, [target, locale]);
        }
      }
    }
  }

  if (targets.size === 0) {
    if (cleanupResult.changed === 0) {
      console.log("\n🛠️  --fix: no missing or extra translations to fix.");
    } else {
      console.log(
        `\n🛠️  --fix: cleaned ${cleanupResult.changed} extra item(s); no missing translations to translate.`,
      );
    }

    return { attempted: 0, failed: 0, changed: cleanupResult.changed };
  }

  console.log(`\n🛠️  --fix: attempting fixes for ${targets.size} target(s)...`);
  let attempted = 0;
  let failed = 0;

  for (const [target, locale] of targets.values()) {
    attempted++;
    console.log(
      `\n➡️  Fixing ${target} (${locale}) using ${cliOptions.provider}...`,
    );

    const result = spawnSync(
      process.execPath,
      [TRANSLATE_SCRIPT, target, locale, `--provider=${cliOptions.provider}`],
      { stdio: "inherit" },
    );

    if (result.status !== 0) {
      failed++;
      console.log(`❌ Fix failed for ${target} (${locale})`);
    } else {
      console.log(`✅ Fixed ${target} (${locale})`);
    }
  }

  return {
    attempted,
    failed,
    changed: cleanupResult.changed + attempted - failed,
  };
}

/**
 * Cleanup extra keys/files reported by the checker.
 * @param {Object} report - Central translation report
 * @param {Object} appReport - App translation report
 * @returns {{changed: number}} Number of applied cleanup changes
 */
function cleanupExtras(report, appReport = null) {
  let changed = 0;

  // Central locale extras
  for (const [locale, files] of Object.entries(report.extra || {})) {
    for (const [filename, extraKeys] of Object.entries(files || {})) {
      const localeFilePath = path.join(LOCALES_DIR, locale, filename);
      if (!Array.isArray(extraKeys) || extraKeys.length === 0) continue;

      if (extraKeys.includes("EXTRA_FILE")) {
        if (fs.existsSync(localeFilePath)) {
          fs.unlinkSync(localeFilePath);
          changed++;
          console.log(`🧹 Removed extra file: ${localeFilePath}`);
        }

        continue;
      }

      if (!fs.existsSync(localeFilePath) && !filename.match(/\.(yaml|yml)$/)) {
        continue;
      }

      let localeContent;
      try {
        localeContent = loadTranslationFile(locale, filename);
      } catch {
        continue;
      }

      if (!localeContent || typeof localeContent !== "object") continue;

      let fileChanged = false;
      for (const keyPath of extraKeys) {
        if (removeKeyByPath(localeContent, keyPath)) {
          fileChanged = true;
          changed++;
          console.log(
            `🧹 Removed extra key: ${locale}/${filename} -> ${keyPath}`,
          );
        }
      }

      if (fileChanged) {
        const target = getStorageWriteTargetForPath(
          path.join(LOCALES_DIR, locale, filename),
          filename,
        );

        if (target.format === "yaml") {
          writeYamlFile(target.path, localeContent);
        } else {
          writeJsonFile(target.path, localeContent);
        }
      }
    }
  }

  // App locale extras
  if (appReport) {
    for (const [appName, locales] of Object.entries(appReport.extra || {})) {
      for (const [locale, files] of Object.entries(locales || {})) {
        for (const [filename, extraKeys] of Object.entries(files || {})) {
          const appFilePath = path.join(
            APPS_DIR,
            appName,
            "translations",
            locale,
            filename,
          );

          if (!Array.isArray(extraKeys) || extraKeys.length === 0) continue;

          if (extraKeys.includes("EXTRA_FILE")) {
            if (fs.existsSync(appFilePath)) {
              fs.unlinkSync(appFilePath);
              changed++;
              console.log(`🧹 Removed extra app file: ${appFilePath}`);
            }

            continue;
          }

          if (!fs.existsSync(appFilePath) && !filename.match(/\.(yaml|yml)$/)) {
            continue;
          }

          let localeContent;
          try {
            localeContent = loadAppTranslationFile(appName, locale, filename);
          } catch {
            continue;
          }

          if (!localeContent || typeof localeContent !== "object") continue;

          let fileChanged = false;
          for (const keyPath of extraKeys) {
            if (removeKeyByPath(localeContent, keyPath)) {
              fileChanged = true;
              changed++;
              console.log(
                `🧹 Removed extra app key: ${appName}/${locale}/${filename} -> ${keyPath}`,
              );
            }
          }

          if (fileChanged) {
            const target = getStorageWriteTargetForPath(appFilePath, filename);
            if (target.format === "yaml") {
              writeYamlFile(target.path, localeContent);
            } else {
              writeJsonFile(target.path, localeContent);
            }
          }
        }
      }
    }
  }

  return { changed };
}

function writeJsonFile(filePath, content) {
  fs.writeFileSync(filePath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

function writeYamlFile(filePath, content) {
  fs.writeFileSync(
    filePath,
    `${YAML.stringify(content, { lineWidth: 0 })}\n`,
    "utf8",
  );
}

/**
 * Remove a dot-path key from object and cleanup empty parent objects.
 * @param {Object} obj - Object to mutate
 * @param {string} keyPath - Dot-separated path
 * @returns {boolean} true when key existed and was removed
 */
function removeKeyByPath(obj, keyPath) {
  const parts = String(keyPath).split(".");
  const stack = [];
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!current || typeof current !== "object" || !(key in current)) {
      return false;
    }

    stack.push([current, key]);
    current = current[key];
  }

  const leaf = parts[parts.length - 1];
  if (!current || typeof current !== "object" || !(leaf in current)) {
    return false;
  }

  delete current[leaf];

  // Cleanup empty objects from leaf to root
  for (let i = stack.length - 1; i >= 0; i--) {
    const [parent, key] = stack[i];
    const value = parent[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    ) {
      delete parent[key];
    } else {
      break;
    }
  }

  return true;
}

/**
 * Main function
 */
async function main() {
  try {
    const catalog = await import(LOCALE_CATALOG_URL);
    console.log("🔍 Checking translations...");

    let report = checkTranslations(catalog);
    let appReport = null;

    if (config.checkApps) {
      console.log("📱 Checking app translations...");
      appReport = checkAppTranslations(catalog);
    }

    printReport(report, appReport);

    if (cliOptions.fix) {
      const fixResult = applyFixes(report, appReport, catalog);
      if (fixResult.attempted > 0 || fixResult.changed > 0) {
        console.log("\n🔁 Re-checking translations after --fix...");
        report = checkTranslations(catalog);
        appReport = config.checkApps ? checkAppTranslations(catalog) : null;
        printReport(report, appReport);
      }

      if (fixResult.failed > 0) {
        console.log(`\n⚠️  ${fixResult.failed} fix target(s) failed.`);
      }
    }

    // Determine if we should exit with error code based on config
    let shouldFail = false;

    const totalMissing =
      report.totalMissing + (appReport ? appReport.totalMissing : 0);

    const totalExtra =
      report.totalExtra + (appReport ? appReport.totalExtra : 0);

    const totalErrors =
      report.errors.length + (appReport ? appReport.errors.length : 0);

    if (config.failOnMissing && totalMissing > 0) {
      shouldFail = true;
    }

    if (config.failOnExtra && totalExtra > 0) {
      shouldFail = true;
    }

    if (config.failOnErrors && totalErrors > 0) {
      shouldFail = true;
    }

    if (shouldFail) {
      console.log("\n❌ Translation check failed!");
      process.exit(1);
    } else {
      console.log("\n✅ Translation check passed!");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Translation check failed with error:", error.message);
    process.exit(1);
  }
}

// Parse command line arguments for configuration overrides
process.argv.slice(2).forEach((arg) => {
  if (arg === "--no-fail-on-extra") {
    config.failOnExtra = false;
  } else if (arg === "--fail-on-extra") {
    config.failOnExtra = true;
  } else if (arg === "--no-fail-on-missing") {
    config.failOnMissing = false;
  } else if (arg === "--fail-on-missing") {
    config.failOnMissing = true;
  } else if (arg === "--skip-apps") {
    config.checkApps = false;
  } else if (arg === "--check-apps") {
    config.checkApps = true;
  } else if (arg === "--fix") {
    cliOptions.fix = true;
  } else if (arg.startsWith("--provider=")) {
    const provider = arg.slice("--provider=".length).trim();
    if (!["google", "mymemory"].includes(provider)) {
      console.error(
        `❌ Invalid provider "${provider}". Use --provider=google or --provider=mymemory.`,
      );

      process.exit(1);
    }

    cliOptions.provider = provider;
  } else if (arg === "--help" || arg === "-h") {
    console.log(`
Usage: yarn check-translations [options]

Options:
  --no-fail-on-extra     Don't fail the build if extra translations are found
  --fail-on-extra        Fail the build if extra translations are found
  --no-fail-on-missing   Don't fail the build if missing translations are found
  --fail-on-missing      Fail the build if missing translations are found (default)
  --skip-apps            Skip checking app translations (only check central translations)
  --check-apps           Check app translations (default)
  --fix                  Auto-fix missing + extra translations, then re-check
  --provider=<name>      Translation provider for --fix: google (default) or mymemory
  --help, -h             Show this help message

Examples:
  yarn check-translations                    # Default: check both central and app translations
  yarn check-translations --skip-apps        # Only check central translations
  yarn check-translations --no-fail-on-extra # Don't fail on extra translations
  yarn check-translations --fail-on-extra    # Fail on both missing and extra
  yarn check-translations --fix              # Auto-fix missing/extra translations and re-check
  yarn check-translations --fix --provider=mymemory
`);

    process.exit(0);
  }
});

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { checkTranslations, checkAppTranslations, printReport };
