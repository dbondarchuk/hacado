import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../../..");
const enSource = path.join(
  root,
  "apps/admin/src/components/install/data/_catalog-en-source.json",
);
const installEnYaml = path.join(
  root,
  "packages/i18n/src/locales/en/install.yaml",
);
const installUkYaml = path.join(
  root,
  "packages/i18n/src/locales/uk/install.yaml",
);

function isEmptyRootObject(obj) {
  return (
    !obj ||
    (typeof obj === "object" &&
      !Array.isArray(obj) &&
      Object.keys(obj).length === 0)
  );
}

/**
 * @param {string} yamlPath
 */
function loadInstallYaml(yamlPath) {
  if (!fs.existsSync(yamlPath)) {
    return {};
  }
  const raw = fs.readFileSync(yamlPath, "utf8");
  if (!raw.trim()) {
    return {};
  }
  try {
    const doc = parseYaml(raw);
    if (
      doc != null &&
      typeof doc === "object" &&
      !Array.isArray(doc) &&
      !isEmptyRootObject(doc)
    ) {
      return doc;
    }
  } catch {
    return {};
  }
  return {};
}

/**
 * @param {string} yamlPath
 * @param {object} data
 */
function writeInstallYaml(yamlPath, data) {
  fs.writeFileSync(
    yamlPath,
    `${stringifyYaml(data, { lineWidth: 0 })}\n`,
    "utf8",
  );
}

function buildCatalogTree(en) {
  const categories = {};
  const tags = {};
  const tree = {};

  for (const [catId, professions] of Object.entries(en)) {
    categories[catId] = titleCase(catId.replace(/-/g, " "));
    tree[catId] = {};
    for (const [profId, prof] of Object.entries(professions)) {
      for (const tag of prof.tags || []) {
        const tid = String(tag)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_");
        if (!tags[tid]) tags[tid] = titleCase(String(tag));
      }
      tree[catId][profId] = {
        label: prof.label,
        services: {},
      };
      for (const [svcId, svc] of Object.entries(prof.services || {})) {
        tree[catId][profId].services[svcId] = {
          name: svc.name,
          description: svc.description,
          ...(svc.addons ? { addons: svc.addons } : {}),
        };
      }
    }
  }

  return { categories, tags, professions: tree };
}

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function deepMergeInstallCatalog(installRoot, catalogBlock) {
  const out = { ...installRoot };
  out.catalog = catalogBlock;
  return out;
}

const en = JSON.parse(fs.readFileSync(enSource, "utf8"));
const { categories, tags, professions } = buildCatalogTree(en);
const catalogBlock = {
  categories,
  tags,
  ...professions,
};

const installEnObj = loadInstallYaml(installEnYaml);
const mergedEn = deepMergeInstallCatalog(installEnObj, catalogBlock);
writeInstallYaml(installEnYaml, mergedEn);

const installUkObj = loadInstallYaml(installUkYaml);
const mergedUk = deepMergeInstallCatalog(installUkObj, catalogBlock);
writeInstallYaml(installUkYaml, mergedUk);

console.log("Merged catalog into en and uk install.yaml");
