/**
 * Renders PNG previews for page-builder and app-store templates into
 * apps/admin/public/pages/templates/{group}/ using Playwright.
 *
 * Prerequisites: admin dev server running on port 3001 (or set BASE_URL).
 *
 * From repo root:
 *   yarn workspace @hacado/admin generate-template-previews
 *
 * Options:
 *   --base-url=http://localhost:3001
 *   --only=HeroCenteredImage,BookingSection
 *   --group=marketing|heroes|sections|blog
 *   --no-skip   Re-render even when PNG already exists
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");

const manifestPaths = [
  path.join(root, "packages/page-builder/src/templates/preview-manifest.ts"),
  path.join(
    root,
    "packages/app-store/src/apps/blog/blocks/preview-manifest.ts",
  ),
];

/** @type {Array<{ key: string; group: string; file: string; delayMs?: number }>} */
function loadManifest() {
  const entries = [];
  const re =
    /\{\s*key:\s*"([^"]+)"\s*,\s*group:\s*"([^"]+)"\s*,\s*file:\s*"([^"]+)"(?:\s*,\s*delayMs:\s*([\d_]+))?\s*,?\s*\}/g;

  for (const manifestPath of manifestPaths) {
    const source = fs.readFileSync(manifestPath, "utf8");
    let match;
    while ((match = re.exec(source)) !== null) {
      entries.push({
        key: match[1],
        group: match[2],
        file: match[3],
        delayMs: match[4] ? Number(match[4].replaceAll("_", "")) : undefined,
      });
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

async function main() {
  const { chromium } = await import("playwright");

  const baseUrl = parseArg("--base-url") ?? "http://localhost:3001";
  const noSkip = process.argv.includes("--no-skip");
  const only = parseOnlyArg();
  const groupFilter = parseArg("--group");
  const templatesRoot = path.join(root, "apps/admin/public/pages/templates");

  const manifest = loadManifest().filter((entry) => {
    if (only && !only.has(entry.key)) return false;
    if (groupFilter && entry.group !== groupFilter) return false;
    return true;
  });

  if (!manifest.length) {
    throw new Error("No templates matched the current filters.");
  }

  console.log(
    `Generating ${manifest.length} preview(s) for ${groupFilter} group(s)`,
  );

  console.log(`Only: ${only ? Array.from(only).join(", ") : "all"}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`No Skip: ${noSkip}`);
  console.log(`Templates Root: ${templatesRoot}`);
  console.log(`Manifest: ${JSON.stringify(manifest, null, 2)}`);

  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  console.log("Browser launched");

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });

  console.log("Context created");
  const page = await context.newPage();
  console.log("Page created");

  await page.addStyleTag({
    content: `
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
    `,
  });

  /** @type {string[]} */
  const errors = [];
  let done = 0;

  for (const { key, group, file, delayMs = 1000 } of manifest) {
    const outDir = path.join(templatesRoot, group);
    const outfile = path.join(outDir, file);
    fs.mkdirSync(outDir, { recursive: true });
    console.log(`Creating output directory: ${outDir}`);
    console.log(`Creating output file: ${outfile}`);
    if (fs.existsSync(outfile) && !noSkip) {
      done++;
      process.stdout.write(
        `\rskip ${done}/${manifest.length} ${key.padEnd(32, " ")}`,
      );
      continue;
    }
    const url = `${baseUrl}/template-previews/${encodeURIComponent(key)}`;
    console.log(`Navigating to URL: ${url}`);
    try {
      await page.goto(url, { waitUntil: "load", timeout: 120_000 });
      console.log("Waiting for page to be ready...");
      await page.waitForSelector('[data-preview-ready="true"]', {
        timeout: Math.max(90_000, delayMs + 30_000),
      });

      console.log("Page ready");
      console.log("Waiting for template preview...");
      await page.waitForSelector("[data-template-preview]", {
        timeout: 10_000,
      });

      const error = await page.locator("[data-preview-error]").count();
      if (error > 0) {
        console.log("Preview page reported unknown template");
        throw new Error(`preview page reported unknown template`);
      }

      console.log("Waiting for template preview...");
      await page.waitForTimeout(delayMs);

      const locator = page.locator("[data-template-preview]");
      console.log("Taking screenshot...");
      await locator.screenshot({
        path: outfile,
        type: "png",
        animations: "disabled",
      });
      console.log("Screenshot taken");
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
    }
  }

  console.log("Closing browser...");
  await browser.close();
  console.log("Browser closed");
  console.log("");

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
