import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

function ensureImport(file, line) {
  if (!fs.existsSync(file)) return;
  let src = fs.readFileSync(file, "utf8");
  if (src.includes(line)) return;
  src = `${line}\n${src}`;
  fs.writeFileSync(file, src);
  console.log("import", path.relative(ROOT, file));
}

ensureImport(
  path.join(ROOT, "packages/page-builder/src/blocks/marketing-browser-carousel/defaults.ts"),
  'import type { I18nFn } from "@hacado/i18n";',
);

// Fix accordion index + delete old props.default after pointing to defaults
const accordionIndex = path.join(
  ROOT,
  "packages/page-builder/src/blocks/accordion/index.ts",
);
if (fs.existsSync(accordionIndex)) {
  let src = fs.readFileSync(accordionIndex, "utf8");
  src = src.replace(
    'export { AccordionPropsDefaults } from "./props.default";',
    'export { AccordionPropsDefaults } from "./defaults";',
  );
  fs.writeFileSync(accordionIndex, src);
}

const propsDefault = path.join(
  ROOT,
  "packages/page-builder/src/blocks/accordion/props.default.ts",
);
if (fs.existsSync(propsDefault)) {
  fs.writeFileSync(
    propsDefault,
    'export { AccordionPropsDefaults } from "./defaults";\n',
  );
}

console.log("fixed");
