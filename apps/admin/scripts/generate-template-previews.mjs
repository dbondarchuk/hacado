/**
 * Renders PNG previews for page-builder and app-store templates into
 * apps/admin/public/pages/templates/{group}/ using Playwright.
 *
 * Prerequisites: admin dev server running on port 3001 (or set BASE_URL).
 *
 * From repo root:
 *   yarn workspace @hacado/admin generate-template-previews
 *   yarn workspace @hacado/admin generate-template-previews --layouts
 *   yarn workspace @hacado/admin generate-template-previews --full-page-layouts
 *
 * Options:
 *   --base-url=http://localhost:3001
 *   --only=HeroCenteredImage,BookingSection
 *   --group=marketing|heroes|sections|layouts|layouts-full|blog
 *   --layouts             Builder layout PNGs only (body, no chrome, 1920×1080)
 *   --full-page-layouts   Install layout PNGs only (header+footer chrome, 1920×1080)
 *   --concurrency=5       Parallel page renders (default 5)
 *   --no-skip   Re-render even when PNG already exists
 *
 * Layout / layouts-full shots capture only the visible viewport (Full HD), not the
 * full scrollable page. Marketing / heroes / sections still screenshot the block.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pLimit from "p-limit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");

const DEFAULT_CONCURRENCY = 5;

const DEVTOOLS_HIDE_CSS = `
  nextjs-portal,
  [data-nextjs-toast],
  [data-nextjs-dev-tools-button],
  #devtools-indicator,
  #__next-build-watcher,
  .nextjs-toast-errors-parent,
  button[aria-label*="Issue"],
  button[aria-label*="issue"],
  [data-nextjs-dialog-overlay] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
`;

const manifestPaths = [
  path.join(root, "packages/page-builder/src/templates/preview-manifest.ts"),
  path.join(
    root,
    "packages/app-store/src/apps/blog/blocks/preview-manifest.ts",
  ),
];

const OVERLAY_HEROES = new Set(["centered", "overlay", "leftOverlay", "video"]);

/** Full HD - shared by `--layouts` and `--full-page-layouts`. */
const LAYOUT_VIEWPORT = { width: 1920, height: 1080 };
const BLOCK_VIEWPORT = { width: 1280, height: 900 };

function loadPackHeroes() {
  const registryPath = path.join(
    root,
    "packages/page-builder/src/templates/layouts/registry.ts",
  );
  const source = fs.readFileSync(registryPath, "utf8");
  /** @type {Record<string, string>} */
  const heroes = {};
  const packBlocks = [
    ...source.matchAll(/id:\s*"([^"]+)"[\s\S]*?hero:\s*"([^"]+)"/g),
  ];
  for (const match of packBlocks) {
    heroes[match[1]] = match[2];
  }
  return heroes;
}

/**
 * @param {{ layouts?: boolean; fullPageLayouts?: boolean }} opts
 * @returns {Array<{
 *   key: string;
 *   group: string;
 *   file: string;
 *   delayMs?: number;
 *   chrome?: { supported: true; header: "solid" | "transparent"; footer?: boolean };
 * }>}
 */
function loadManifest({ layouts = false, fullPageLayouts = false } = {}) {
  const entries = [];
  const re =
    /\{\s*key:\s*"([^"]+)"\s*,\s*group:\s*"([^"]+)"\s*,\s*file:\s*"([^"]+)"(?:\s*,\s*delayMs:\s*([\d_]+))?\s*,?\s*\}/g;

  for (const manifestPath of manifestPaths) {
    const source = fs.readFileSync(manifestPath, "utf8");
    let match;
    while ((match = re.exec(source)) !== null) {
      if (match[2] === "layouts" || match[2] === "layouts-full") continue;
      if (layouts || fullPageLayouts) continue;
      entries.push({
        key: match[1],
        group: match[2],
        file: match[3],
        delayMs: match[4] ? Number(match[4].replaceAll("_", "")) : undefined,
      });
    }

    const packsMatch = source.match(
      /const LAYOUT_PACKS = \[([\s\S]*?)\] as const/,
    );
    const kindsMatch = source.match(
      /const LAYOUT_KINDS = \[([\s\S]*?)\] as const/,
    );
    if (packsMatch && kindsMatch) {
      const packs = [...packsMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      const kinds = [...kindsMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      const heroes = loadPackHeroes();
      for (const packId of packs) {
        for (const layoutKind of kinds) {
          const key = `Layout_${packId}_${layoutKind}`;
          const header =
            layoutKind === "home" && OVERLAY_HEROES.has(heroes[packId])
              ? "transparent"
              : "solid";
          const delayMs = layoutKind === "booking" ? 5000 : 3000;
          const chrome = { supported: true, header, footer: true };

          if (fullPageLayouts) {
            entries.push({
              key,
              group: "layouts-full",
              file: `${packId}-${layoutKind}.png`,
              delayMs,
              chrome,
            });
          } else if (layouts) {
            entries.push({
              key,
              group: "layouts",
              file: `${packId}-${layoutKind}.png`,
              delayMs,
              chrome,
            });
          } else if (!entries.some((e) => e.key === key)) {
            entries.push({
              key,
              group: "layouts",
              file: `${packId}-${layoutKind}.png`,
              delayMs,
              chrome,
            });
          }
        }
      }
    }
  }

  if (!entries.length) {
    throw new Error(
      `Could not parse template manifest(s) at ${manifestPaths.join(", ")}`,
    );
  }
  return entries;
}

function parseArg(prefix) {
  const arg = process.argv.find((x) => x.startsWith(`${prefix}=`));
  return arg ? arg.slice(prefix.length + 1) : undefined;
}

function parseOnlyArg() {
  const raw = parseArg("--only");
  if (!raw) return undefined;
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

function parseConcurrencyArg() {
  const raw = parseArg("--concurrency");
  if (!raw) return DEFAULT_CONCURRENCY;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`Invalid --concurrency=${raw} (expected integer >= 1)`);
  }
  return Math.floor(n);
}

async function main() {
  const { chromium } = await import("playwright");

  const baseUrl = parseArg("--base-url") ?? "http://localhost:3001";
  const noSkip = process.argv.includes("--no-skip");
  const layouts = process.argv.includes("--layouts");
  const fullPageLayouts = process.argv.includes("--full-page-layouts");
  const concurrency = parseConcurrencyArg();
  if (layouts && fullPageLayouts) {
    throw new Error("Use either --layouts or --full-page-layouts, not both.");
  }

  const only = parseOnlyArg();
  const groupFilter = parseArg("--group");
  const templatesRoot = path.join(root, "apps/admin/public/pages/templates");

  let manifest = loadManifest({ layouts, fullPageLayouts }).filter((entry) => {
    if (fullPageLayouts && entry.group !== "layouts-full") return false;
    if (layouts && entry.group !== "layouts") return false;
    if (!fullPageLayouts && entry.group === "layouts-full") return false;
    if (only && !only.has(entry.key)) return false;
    if (groupFilter && entry.group !== groupFilter) return false;
    return true;
  });

  if (!manifest.length) {
    throw new Error("No templates matched the current filters.");
  }

  const modeLabel = fullPageLayouts
    ? " (full-page layouts)"
    : layouts
      ? " (layouts)"
      : "";
  console.log(`Generating ${manifest.length} preview(s)${modeLabel}`);
  console.log(`Only: ${only ? Array.from(only).join(", ") : "all"}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`No Skip: ${noSkip}`);
  console.log(`Layouts: ${layouts}`);
  console.log(`Full page layouts: ${fullPageLayouts}`);
  console.log(`Templates Root: ${templatesRoot}`);

  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const limit = pLimit(concurrency);

  /** @type {string[]} */
  const errors = [];
  let done = 0;

  await Promise.all(
    manifest.map((entry) =>
      limit(async () => {
        const { key, group, file, delayMs = 1000, chrome } = entry;
        const outDir = path.join(templatesRoot, group);
        const outfile = path.join(outDir, file);
        fs.mkdirSync(outDir, { recursive: true });
        if (fs.existsSync(outfile) && !noSkip) {
          done++;
          process.stdout.write(
            `\rskip ${done}/${manifest.length} ${key.padEnd(32, " ")}`,
          );
          return;
        }

        const isLayoutShot = group === "layouts" || group === "layouts-full";
        const context = await browser.newContext({
          viewport: isLayoutShot ? LAYOUT_VIEWPORT : BLOCK_VIEWPORT,
          deviceScaleFactor: 1,
        });
        const page = await context.newPage();
        await page.addStyleTag({ content: DEVTOOLS_HIDE_CSS });

        const params = new URLSearchParams();
        if (group === "layouts-full" && chrome?.supported) {
          params.set("header", chrome.header);
          if (chrome.footer !== false) params.set("footer", "1");
        }
        const qs = params.toString();
        const url = `${baseUrl}/template-previews/${encodeURIComponent(key)}${qs ? `?${qs}` : ""}`;

        try {
          await page.goto(url, { waitUntil: "load", timeout: 120_000 });
          await page.waitForSelector('[data-preview-ready="true"]', {
            timeout: Math.max(90_000, delayMs + 30_000),
          });
          await page.waitForSelector("[data-template-preview]", {
            timeout: 10_000,
          });

          const error = await page.locator("[data-preview-error]").count();
          if (error > 0) {
            throw new Error(`preview page reported unknown template`);
          }

          await page.waitForTimeout(delayMs);

          if (isLayoutShot) {
            // Viewport-only Full HD (1920×1080) for both builder and install thumbs.
            await page.screenshot({
              path: outfile,
              type: "png",
              fullPage: false,
              animations: "disabled",
            });
          } else {
            const locator = page.locator(".page-layout-reader").first();
            await locator.screenshot({
              path: outfile,
              type: "png",
              animations: "disabled",
            });
          }
          done++;
          process.stdout.write(
            `\rok ${done}/${manifest.length} ${key.padEnd(32, " ")}`,
          );
        } catch (e) {
          errors.push(`${key}: ${e instanceof Error ? e.message : String(e)}`);
          done++;
          process.stdout.write(
            `\rfail ${done}/${manifest.length} ${key.padEnd(32, " ")}`,
          );
        } finally {
          await context.close();
        }
      }),
    ),
  );

  console.log("\nClosing browser...");
  await browser.close();

  if (errors.length) {
    console.error(`${errors.length} failures:`);
    errors.forEach((x) => console.error(x));
    process.exitCode = 1;
  } else {
    console.log(`Wrote ${manifest.length} preview(s) under ${templatesRoot}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
