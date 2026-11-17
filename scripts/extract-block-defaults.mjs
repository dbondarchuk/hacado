/**
 * Move XxxPropsDefaults from schema.ts into defaults.ts (type-only import from schema).
 * Schema re-exports defaults for backwards compatibility.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

function findExportEnd(src, start) {
  let depth = 0;
  let started = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{" || ch === "(" || ch === "[") {
      depth++;
      started = true;
    } else if (ch === "}" || ch === ")" || ch === "]") {
      depth--;
      if (started && depth === 0) {
        const semi = src.indexOf(";", i);
        return semi >= 0 ? semi + 1 : i + 1;
      }
    }
  }
  return -1;
}

function stripTypeSuffix(value) {
  return value
    .replace(/\s+as const satisfies \w+\s*$/, "")
    .replace(/\s+satisfies \w+\s*$/, "")
    .replace(/\s+as const\s*$/, "")
    .trim();
}

function processFile({ schemaPath, exportName, typeName, extraImports = [] }) {
  if (!fs.existsSync(schemaPath)) {
    console.log("MISS", schemaPath);
    return false;
  }

  const dir = path.dirname(schemaPath);
  const defaultsPath = path.join(dir, "defaults.ts");

  if (fs.existsSync(defaultsPath) && exportName !== "AccordionPropsDefaults") {
    // Already extracted (allow accordion rename path separately)
    const existing = fs.readFileSync(defaultsPath, "utf8");
    if (existing.includes(`export const ${exportName}`)) {
      console.log("SKIP exists", defaultsPath);
      return false;
    }
  }

  let src = fs.readFileSync(schemaPath, "utf8");
  const marker = `export const ${exportName}`;
  const start = src.indexOf(marker);
  if (start < 0) {
    console.log("NO EXPORT", schemaPath, exportName);
    return false;
  }

  const end = findExportEnd(src, start);
  if (end < 0) {
    console.log("NO END", schemaPath, exportName);
    return false;
  }

  const decl = src.slice(start, end).trim();
  if (
    /\bCOLORS\b/.test(decl) &&
    !extraImports.some((i) => i.includes("COLORS"))
  ) {
    // Still allow if we rewrite - for now skip UI color package
    console.log("SKIP COLORS", schemaPath, exportName);
    return false;
  }

  const assigned = decl.replace(
    new RegExp(`^export const ${exportName}\\s*=\\s*`),
    "",
  );
  const value = stripTypeSuffix(assigned.replace(/;$/, ""));

  const imports = [
    `import type { ${typeName} } from "./schema";`,
    ...extraImports,
  ];

  if (
    /generateId\(/.test(decl) &&
    !imports.some((i) => i.includes("generateId"))
  ) {
    imports.push(`import { generateId } from "@hacado/builder/helpers";`);
  }

  if (
    /InlineContainerPropsDefaults/.test(decl) &&
    exportName !== "InlineContainerPropsDefaults"
  ) {
    const from = path
      .relative(dir, path.join(dir, "..", "inline-container", "defaults"))
      .replaceAll("\\", "/");
    const rel = from.startsWith(".") ? from : `./${from}`;
    imports.push(`import { InlineContainerPropsDefaults } from "${rel}";`);
  }

  if (/ImagePropsDefaults/.test(decl) && exportName !== "ImagePropsDefaults") {
    const from = path
      .relative(dir, path.join(dir, "..", "image", "defaults"))
      .replaceAll("\\", "/");
    const rel = from.startsWith(".") ? from : `./${from}`;
    imports.push(`import { ImagePropsDefaults } from "${rel}";`);
  }

  if (
    /AccordionItemPropsDefaults/.test(decl) &&
    exportName !== "AccordionItemPropsDefaults"
  ) {
    const from = path
      .relative(dir, path.join(dir, "..", "accordion-item", "defaults"))
      .replaceAll("\\", "/");
    const rel = from.startsWith(".") ? from : `./${from}`;
    imports.push(`import { AccordionItemPropsDefaults } from "${rel}";`);
  }

  const defaultsSrc = `${imports.join("\n")}\n\nexport const ${exportName} = ${value} as const satisfies ${typeName};\n`;

  fs.writeFileSync(defaultsPath, defaultsSrc);

  const before = src.slice(0, start);
  const after = src.slice(end);
  const reexport = `export { ${exportName} } from "./defaults";\n`;
  // Avoid double blank lines
  const next = `${before.trimEnd()}\n\n${reexport}${after.replace(/^\s*\n*/, "\n")}`;
  fs.writeFileSync(schemaPath, next);

  console.log("OK", path.relative(ROOT, defaultsPath));
  return true;
}

const pageBlocks = [
  ["container", "ContainerPropsDefaults", "ContainerProps"],
  ["text", "TextPropsDefaults", "TextProps"],
  ["spacer", "SpacerPropsDefaults", "SpacerProps"],
  ["inline-text", "InlineTextPropsDefaults", "InlineTextProps"],
  ["inline-container", "InlineContainerPropsDefaults", "InlineContainerProps"],
  ["grid-container", "GridContainerPropsDefaults", "GridContainerProps"],
  ["heading", "HeadingPropsDefaults", "HeadingProps"],
  ["image", "ImagePropsDefaults", "ImageProps"],
  ["video", "VideoPropsDefaults", "VideoProps"],
  ["youtube-video", "YouTubeVideoPropsDefaults", "YouTubeVideoProps"],
  ["icon", "IconPropsDefaults", "IconProps"],
  ["lightbox", "LightboxPropsDefaults", "LightboxProps"],
  ["custom-html", "CustomHTMLPropsDefaults", "CustomHTMLProps"],
  ["catalog-value", "CatalogValuePropsDefaults", "CatalogValueProps"],
  [
    "conditional-container",
    "ConditionalContainerPropsDefaults",
    "ConditionalContainerProps",
  ],
  [
    "foreach-container",
    "ForeachContainerPropsDefaults",
    "ForeachContainerProps",
  ],
  ["fluid-layout", "FluidLayoutPropsDefaults", "FluidLayoutProps"],
  ["page-layout", "PageLayoutDefaultProps", "PageLayoutProps"],
  ["typewriter-text", "TypewriterTextPropsDefaults", "TypewriterTextProps"],
  ["phrase-cycle", "PhraseCyclePropsDefaults", "PhraseCycleProps"],
  ["table", "TablePropsDefaults", "TableProps"],
  [
    "marketing-features-showcase",
    "MarketingFeaturesShowcasePropsDefaults",
    "MarketingFeaturesShowcaseProps",
  ],
  [
    "marketing-scrolling-logos",
    "MarketingScrollingLogosPropsDefaults",
    "MarketingScrollingLogosProps",
  ],
  [
    "marketing-feature-item",
    "MarketingFeatureItemPropsDefaults",
    "MarketingFeatureItemProps",
  ],
  [
    "marketing-browser-carousel",
    "MarketingBrowserCarouselPropsDefaults",
    "MarketingBrowserCarouselProps",
  ],
];

// Process non-COLORS first; order matters for deps (inline-container before heading)
const order = [
  "inline-text",
  "inline-container",
  "image",
  "container",
  "text",
  "spacer",
  "grid-container",
  "heading",
  "video",
  "youtube-video",
  "icon",
  "lightbox",
  "custom-html",
  "catalog-value",
  "conditional-container",
  "foreach-container",
  "fluid-layout",
  "page-layout",
  "typewriter-text",
  "phrase-cycle",
  "table",
  "marketing-features-showcase",
  "marketing-scrolling-logos",
  "marketing-feature-item",
  "marketing-browser-carousel",
];

const pageMap = new Map(pageBlocks.map((b) => [b[0], b]));

for (const key of order) {
  const [, exportName, typeName] = pageMap.get(key);
  const schemaCandidates = [
    path.join(ROOT, "packages/page-builder/src/blocks", key, "schema.ts"),
    path.join(ROOT, "packages/page-builder/src/blocks", key, "schema.tsx"),
  ];
  const schemaPath = schemaCandidates.find((p) => fs.existsSync(p));
  processFile({ schemaPath, exportName, typeName });
}

// accordion: rename props.default.ts -> defaults.ts if needed
const accordionDefault = path.join(
  ROOT,
  "packages/page-builder/src/blocks/accordion/props.default.ts",
);
const accordionDefaults = path.join(
  ROOT,
  "packages/page-builder/src/blocks/accordion/defaults.ts",
);
if (fs.existsSync(accordionDefault) && !fs.existsSync(accordionDefaults)) {
  let src = fs.readFileSync(accordionDefault, "utf8");
  src = src.replace(
    'from "../accordion-item/schema"',
    'from "../accordion-item/defaults"',
  );
  src = src.replace(
    'import type { AccordionProps } from "./schema";',
    'import type { AccordionProps } from "./schema";',
  );
  if (!src.includes("import type")) {
    src = `import type { AccordionProps } from "./schema";\n${src}`;
  }
  fs.writeFileSync(accordionDefaults, src);
  console.log("OK accordion/defaults.ts (from props.default)");
}

// accordion-item
processFile({
  schemaPath: path.join(
    ROOT,
    "packages/page-builder/src/blocks/accordion-item/schema.tsx",
  ),
  exportName: "AccordionItemPropsDefaults",
  typeName: "AccordionItemProps",
});

const emailBlocks = [
  ["text", "TextPropsDefaults", "TextProps"],
  ["heading", "HeadingPropsDefaults", "HeadingProps"],
  ["container", "ContainerPropsDefaults", "ContainerProps"],
  ["spacer", "SpacerPropsDefaults", "SpacerProps"],
  ["divider", "DividerPropsDefaults", "DividerProps"],
  ["button", "ButtonPropsDefaults", "ButtonProps"],
  [
    "columns-container",
    "ColumnsContainerPropsDefaults",
    "ColumnsContainerProps",
  ],
  [
    "conditional-container",
    "ConditionalContainerPropsDefaults",
    "ConditionalContainerProps",
  ],
  [
    "foreach-container",
    "ForeachContainerPropsDefaults",
    "ForeachContainerProps",
  ],
  ["custom-html", "CustomHTMLPropsDefaults", "CustomHTMLProps"],
  ["online-meeting", "OnlineMeetingPropsDefaults", "OnlineMeetingProps"],
  ["email-layout", "EmailLayoutDefaultProps", "EmailLayoutProps"],
  ["image", "ImagePropsDefaults", "ImageProps"],
  ["avatar", "AvatarPropsDefaults", "AvatarProps"],
];

for (const [key, exportName, typeName] of emailBlocks) {
  const schemaCandidates = [
    path.join(ROOT, "packages/email-builder/src/blocks", key, "schema.ts"),
    path.join(ROOT, "packages/email-builder/src/blocks", key, "schema.tsx"),
  ];
  const schemaPath = schemaCandidates.find((p) => fs.existsSync(p));
  processFile({ schemaPath, exportName, typeName });
}

console.log("done");
