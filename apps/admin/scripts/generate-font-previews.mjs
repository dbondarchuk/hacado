/**
 * Renders PNG previews (font name set in that font) into public/fonts/preview
 * using Satori + Resvg (same stack as gift-card-studio).
 *
 * From repo root:
 *   yarn workspace @hacado/admin generate-font-previews
 * Optional: --max=50
 *
 * Plain Node ESM - no tsx. Keep getWebfontPreviewFilename() in sync with
 * packages/utils/src/font-preview-filename.ts.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";
import pLimit from "p-limit";
import { createElement } from "react";
import satori from "satori";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const fontsJsonPath = path.join(
  root,
  "packages/types/src/configuration/styling/fonts.json",
);
const outDir = path.join(root, "apps/admin/public/fonts/preview");

/** @param {string} str */
function fnv1a32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** @param {string} family */
function getWebfontPreviewFilename(family) {
  const slug = family
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const id = fnv1a32(family);
  return `${slug || "font"}-${id}.png`;
}

const allFonts = JSON.parse(fs.readFileSync(fontsJsonPath, "utf8"));

const knownFonts = allFonts.items.reduce((acc, font) => {
  acc[font.family] = font;
  return acc;
}, {});

const WIDTH = 320;
const HEIGHT = 56;

/** @param {(typeof allFonts.items)[number]} font */
function pickTtfUrl(font) {
  const files = font.files;
  const tryKeys = ["regular", "400", "500", "300", "700"];
  for (const k of tryKeys) {
    const u = files[k];
    if (u) return u;
  }
  for (const k of Object.keys(files).sort()) {
    const u = files[k];
    if (u) return u;
  }
  return undefined;
}

/** @param {string} family */
async function loadFontBinary(family) {
  const font = knownFonts[family];
  if (!font) {
    throw new Error(`font not in catalog: ${family}`);
  }
  const url = pickTtfUrl(font);
  if (!url) {
    throw new Error(`no TTF URL for ${family}`);
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetch ${res.status} for ${family}`);
  }
  return res.arrayBuffer();
}

/** @param {string} family */
async function renderPreviewPng(family) {
  const data = await loadFontBinary(family);

  const tree = createElement(
    "div",
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        background: "#fafafa",
        display: "flex",
        alignItems: "center",
        paddingLeft: 14,
        paddingRight: 14,
      },
    },
    createElement(
      "div",
      {
        style: {
          fontSize: 22,
          fontWeight: 400,
          color: "#18181b",
          fontFamily: family,
          lineHeight: "28px",
          whiteSpace: "nowrap",
        },
      },
      family,
    ),
  );

  const svg = await satori(tree, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      {
        name: family,
        data,
        weight: 400,
        style: "normal",
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "zoom", value: 2 },
    font: {
      loadSystemFonts: false,
    },
  });
  const rendered = resvg.render();
  return Buffer.from(rendered.asPng());
}

function parseMaxArg() {
  const a = process.argv.find((x) => x.startsWith("--max="));
  if (!a) return undefined;
  const n = Number(a.slice(6));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

async function main() {
  const list = allFonts.items.map((i) => i.family);
  const max = parseMaxArg();
  const noSkip = process.argv.includes("--no-skip");
  const targets = max !== undefined ? list.slice(0, max) : list;

  fs.mkdirSync(outDir, { recursive: true });

  const limit = pLimit(8);
  /** @type {string[]} */
  const errors = [];
  let done = 0;

  await Promise.all(
    targets.map((family) =>
      limit(async () => {
        const fname = getWebfontPreviewFilename(family);
        const outfile = path.join(outDir, fname);
        if (fs.existsSync(outfile) && !noSkip) {
          done++;
          process.stdout.write(
            `\rskip ${done}/${targets.length} ${family.slice(0, 48).padEnd(48, " ")}`,
          );
          return;
        }
        try {
          const png = await renderPreviewPng(family);
          fs.writeFileSync(outfile, png);
          done++;
          process.stdout.write(
            `\rok ${done}/${targets.length} ${family.slice(0, 48).padEnd(48, " ")}`,
          );
        } catch (e) {
          errors.push(
            `${family}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }),
    ),
  );

  console.log("");

  if (errors.length) {
    console.error(`${errors.length} failures (first 15):`);
    errors.slice(0, 15).forEach((x) => console.error(x));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
