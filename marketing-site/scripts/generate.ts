/**
 * Writes reviewable page-builder JSON from the marketing-site content.
 *
 *   yarn generate
 *   node scripts/generate.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resetIds } from "../src/blocks";
import {
  buildFooter,
  buildHeaders,
  buildPages,
  MAIN_HEADER_NAME,
} from "../src/pages";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STRUCTURE = path.join(__dirname, "structure");
const PAGES_DIR = path.join(STRUCTURE, "pages");

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function pageFileName(slug: string) {
  return `${slug}.json`;
}

function headerFileName(name: string) {
  return name === MAIN_HEADER_NAME
    ? "header.json"
    : `header-${name.toLowerCase().replace(/\s+/g, "-")}.json`;
}

function main() {
  resetIds();
  fs.mkdirSync(PAGES_DIR, { recursive: true });
  for (const existing of fs.readdirSync(PAGES_DIR, { recursive: true })) {
    const full = path.join(PAGES_DIR, String(existing));
    if (fs.statSync(full).isFile() && full.endsWith(".json")) {
      fs.unlinkSync(full);
    }
  }

  const headers = buildHeaders();
  const footer = buildFooter();
  const pages = buildPages();

  for (const header of headers) {
    writeJson(path.join(STRUCTURE, headerFileName(header.name)), header);
  }
  writeJson(path.join(STRUCTURE, "footer.json"), footer);

  for (const page of pages) {
    writeJson(path.join(PAGES_DIR, pageFileName(page.slug)), page);
  }

  const index = {
    headers: headers.map((h) => ({
      name: h.name,
      file: headerFileName(h.name),
    })),
    /** @deprecated Prefer `headers[0]`; kept for older seed scripts. */
    header: headerFileName(headers[0]!.name),
    footer: "footer.json",
    headerName: headers[0]!.name,
    footerName: footer.name,
    pages: pages.map((p) => ({
      slug: p.slug,
      title: p.title,
      file: `pages/${pageFileName(p.slug)}`,
      headerName: p.headerName,
    })),
  };

  writeJson(path.join(STRUCTURE, "index.json"), index);

  console.log(
    `Wrote ${pages.length} pages, ${headers.length} headers (${headers
      .map((h) => `"${h.name}"`)
      .join(", ")}), footer "${footer.name}" → ${STRUCTURE}`,
  );
  console.log("Image paths are relative /assets/... (seed uploads to org assets).");
}

main();
