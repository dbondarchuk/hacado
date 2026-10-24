/**
 * Rasterize brand SVGs into the PNGs and favicons the apps ship.
 *
 * From repo root:
 *   yarn rasterize-logos
 *
 * The email lockup is composited onto a white rounded plate so it stays
 * readable when a client forces a dark background and leaves image pixels alone.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const emailLogoWidth = 676;
const emailLogoHeight = 134;
const emailPlatePadX = 36;
const emailPlatePadY = 28;
const emailPlateRadius = 20;

/**
 * @param {string} svgPath
 * @param {number} width
 * @param {number} height
 */
async function rasterize(svgPath, width, height) {
  return sharp(path.join(root, svgPath), { density: 384 })
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/**
 * @param {string} svgPath
 * @param {number} width
 * @param {number} height
 * @param {string} outPath
 */
async function writePng(svgPath, width, height, outPath) {
  const png = await rasterize(svgPath, width, height);
  fs.writeFileSync(path.join(root, outPath), png);
  const meta = await sharp(png).metadata();
  console.log(`${outPath} ${meta.width}x${meta.height}`);
}

/**
 * @param {{ size: number, buffer: Buffer }[]} pngs
 * @param {string} outPath
 */
function writeIco(pngs, outPath) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const entries = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  pngs.forEach((png, index) => {
    const at = index * 16;
    entries.writeUInt8(png.size >= 256 ? 0 : png.size, at);
    entries.writeUInt8(png.size >= 256 ? 0 : png.size, at + 1);
    entries.writeUInt16LE(1, at + 4);
    entries.writeUInt16LE(32, at + 6);
    entries.writeUInt32LE(png.buffer.length, at + 8);
    entries.writeUInt32LE(offset, at + 12);
    offset += png.buffer.length;
  });
  fs.writeFileSync(
    path.join(root, outPath),
    Buffer.concat([header, entries, ...pngs.map((png) => png.buffer)]),
  );
  console.log(`${outPath} ${pngs.map((png) => png.size).join(",")}`);
}

async function writePlatedEmailLogo() {
  const canvasWidth = emailLogoWidth + emailPlatePadX * 2;
  const canvasHeight = emailLogoHeight + emailPlatePadY * 2;
  const logo = await rasterize(
    "apps/admin/public/email-logo.svg",
    emailLogoWidth,
    emailLogoHeight,
  );
  const plate = Buffer.from(
    `<svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="${canvasWidth}" height="${canvasHeight}" rx="${emailPlateRadius}" fill="#FFFFFF"/></svg>`,
  );
  const png = await sharp(plate)
    .composite([{ input: logo, left: emailPlatePadX, top: emailPlatePadY }])
    .png()
    .toBuffer();

  for (const out of [
    "apps/admin/public/email-logo.png",
    "apps/web/public/email-logo.png",
  ]) {
    fs.writeFileSync(path.join(root, out), png);
    console.log(`${out} ${canvasWidth}x${canvasHeight}`);
  }
}

const symbol = "apps/admin/public/logo.svg";
await writePng(symbol, 512, 512, "apps/admin/public/logo.png");
await writePng(symbol, 512, 512, "apps/web/public/logo.png");

await writePlatedEmailLogo();
await writePng(
  "apps/admin/public/email-logo-dark.svg",
  emailLogoWidth,
  emailLogoHeight,
  "apps/admin/public/email-logo-dark.png",
);

const faviconSizes = [16, 32, 48, 64, 128, 256];
const faviconPngs = [];
for (const size of faviconSizes) {
  faviconPngs.push({
    size,
    buffer: await rasterize("apps/admin/public/favicon.svg", size, size),
  });
}

for (const out of [
  "apps/admin/public/favicon.ico",
  "apps/admin/src/app/icon.ico",
  "docs/static/img/favicon.ico",
]) {
  writeIco(faviconPngs, out);
}

fs.copyFileSync(
  path.join(root, "apps/admin/public/favicon.svg"),
  path.join(root, "marketing-site/public/favicon.svg"),
);
console.log("marketing-site/public/favicon.svg synced");
