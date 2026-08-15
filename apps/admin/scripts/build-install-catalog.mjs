import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "../src/components/install/data");

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".yaml"));
const catalog = {};
const en = {};
const tagSet = new Set();

for (const f of files) {
  if (f.startsWith("_")) continue;
  const full = path.join(dir, f);
  if (fs.statSync(full).size < 4) continue;
  const cat = f.replace(/\.yaml$/, "");
  const j = parseYaml(fs.readFileSync(full, "utf8"));
  catalog[cat] = {};
  en[cat] = {};
  for (const [profKey, prof] of Object.entries(j)) {
    const tags = (prof.tags || []).map((t) =>
      String(t)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_"),
    );
    tags.forEach((t) => tagSet.add(t));
    en[cat][profKey] = { label: prof.label, tags: prof.tags };
    en[cat][profKey].services = {};
    catalog[cat][profKey] = { tags, services: [] };
    (prof.services || []).forEach((svc, idx) => {
      const id = svc.id || slug(svc.name) || `s${idx}`;
      const svcPrices = svc.prices ?? [];
      const svcDurations = svc.durations ?? [];

      const sourceAddons = Array.isArray(svc.addons) ? svc.addons : [];
      const catalogAddons = [];
      const enAddons = {};

      sourceAddons.forEach((a, ai) => {
        const addonId =
          (typeof a.id === "string" && a.id) ||
          `${id}-addon-${slug(a.name)}-${ai}`;
        const duration =
          a.duration != null && Number(a.duration) > 0
            ? Number(a.duration)
            : 10;
        const entry = { id: addonId, duration };
        if (
          a.suggestedPrice != null &&
          Number(a.suggestedPrice) >= 0 &&
          !Number.isNaN(Number(a.suggestedPrice))
        ) {
          entry.suggestedPrice = Number(a.suggestedPrice);
        }
        catalogAddons.push(entry);
        enAddons[addonId] = {
          name: String(a.name ?? ""),
          description: String(a.description ?? ""),
        };
      });

      catalog[cat][profKey].services.push({
        id,
        durations: svcDurations,
        prices: svcPrices,
        recommended: !!svc.recommended,
        addons: catalogAddons.length ? catalogAddons : undefined,
      });
      en[cat][profKey].services[id] = {
        name: svc.name,
        description: svc.description,
        ...(Object.keys(enAddons).length ? { addons: enAddons } : {}),
      };
    });
  }
}

const outCatalog = path.join(dir, "_catalog-data.json");
fs.writeFileSync(outCatalog, JSON.stringify(catalog, null, 2));
fs.writeFileSync(
  path.join(dir, "_catalog-en-source.json"),
  JSON.stringify(en, null, 2),
);
console.log("tags", [...tagSet].sort().join(", "));
console.log("categories", Object.keys(catalog).sort().join(", "));
console.log("wrote", outCatalog);
