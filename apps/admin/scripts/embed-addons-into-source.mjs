/**
 * Adds `addons` (name, description, duration, suggestedPrice, id) to each
 * service in install data/*.yaml when missing. Safe to re-run (skips services
 * that already have a non-empty `addons` array).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "../src/components/install/data");

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}

function titleCase(s) {
  return String(s)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildAddonsForService(svc, tags, cat, serviceId) {
  const svcPrices = svc.prices ?? [];
  const svcDurations = svc.durations ?? [];
  const basePrice =
    svcPrices.length > 0
      ? Math.min(...svcPrices.filter((n) => Number(n) > 0))
      : 0;
  const minDur =
    svcDurations.length > 0
      ? Math.min(...svcDurations.map((n) => Number(n)))
      : 60;

  let sampleCount = svc.sampleAddons;
  if (sampleCount === undefined || sampleCount === null) {
    sampleCount = minDur <= 25 ? 1 : 2;
  }
  sampleCount = Math.max(0, Math.min(2, Number(sampleCount) || 0));

  const firstTag = tags[0] ?? cat;
  const secondTag = tags[1] ?? tags[0] ?? cat;
  const suggested1 = basePrice ? Math.max(5, Math.round(basePrice * 0.25)) : 15;
  const suggested2 = basePrice ? Math.max(5, Math.round(basePrice * 0.4)) : 25;

  /** @type {object[]} */
  const addons = [];
  if (sampleCount >= 1) {
    addons.push({
      id: `${serviceId}-addon-${slug(firstTag)}-1`,
      name: `${titleCase(firstTag)} add-on`,
      description: `**Extra ${titleCase(firstTag)} value** for your service.`,
      duration: 10,
      suggestedPrice: suggested1,
    });
  }
  if (sampleCount >= 2) {
    addons.push({
      id: `${serviceId}-addon-${slug(secondTag)}-2`,
      name: `${titleCase(secondTag)} add-on`,
      description: `**Optional ${titleCase(secondTag)}** to extend this booking.`,
      duration: 15,
      suggestedPrice: suggested2,
    });
  }
  return addons;
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".yaml"));
let touched = 0;

for (const f of files) {
  if (f.startsWith("_")) continue;
  const full = path.join(dir, f);
  if (fs.statSync(full).size < 4) continue;
  const cat = f.replace(/\.yaml$/, "");
  const j = parseYaml(fs.readFileSync(full, "utf8"));
  let changed = false;

  for (const prof of Object.values(j)) {
    const tags = (prof.tags || []).map((t) =>
      String(t)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_"),
    );
    const services = prof.services || [];
    for (let idx = 0; idx < services.length; idx++) {
      const svc = services[idx];
      // Respect explicit list, including [] for no add-ons.
      if (Array.isArray(svc.addons)) continue;
      const serviceId = svc.id || slug(svc.name) || `s${idx}`;
      const addons = buildAddonsForService(svc, tags, cat, serviceId);
      if (addons.length === 0) continue;
      delete svc.sampleAddons;
      svc.addons = addons;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(full, `${stringifyYaml(j, { lineWidth: 0 })}\n`, "utf8");
    touched++;
    console.log("updated", f);
  }
}

console.log("files updated:", touched);
