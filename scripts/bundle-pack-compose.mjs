/**
 * Bundle real website-pack composers for seed-org (no React/UI runtime).
 */
import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pbSrc = path.join(root, "packages/page-builder/src");

/** Map `.../blocks/<name>` directory → schema file (avoid editor barrels). */
const BLOCK_DIR_TO_SCHEMA = {
  button: "blocks/button/schema.ts",
  container: "blocks/container/schema.ts",
  heading: "blocks/heading/schema.ts",
  "inline-container": "blocks/inline-container/schema.ts",
  "inline-text": "blocks/inline-text/schema.ts",
  text: "blocks/text/schema.ts",
  icon: "blocks/icon/schema.ts",
  image: "blocks/image/schema.tsx",
  "accordion-item": "blocks/accordion-item/schema.tsx",
  accordion: "blocks/accordion/props.default.ts",
  "before-after": "blocks/before-after/schema.tsx",
  "marketing-browser-carousel":
    "blocks/marketing-browser-carousel/schema.ts",
  "marketing-scrolling-logos": "blocks/marketing-scrolling-logos/schema.ts",
  link: "blocks/link/schema.ts",
  "sticky-banner": "blocks/sticky-banner/schema.ts",
};

const PROXY_STUB = `
  // Real values needed by zod schemas at module init
  const iconNames = ["star", "check", "heart", "sparkles", "calendar", "user"];
  const stub = new Proxy(function () {}, {
    apply: () => stub,
    construct: () => stub,
    get: (_t, prop) => {
      if (prop === "__esModule") return true;
      if (prop === "then") return undefined;
      if (prop === "default") return stub;
      if (prop === "Fragment") return stub;
      if (prop === "iconNames") return iconNames;
      if (prop === "jsx" || prop === "jsxs" || prop === "jsxDEV") {
        return (type, props) => ({ type, props, children: props?.children });
      }
      return stub;
    },
  });
  module.exports = stub;
  module.exports.default = stub;
  module.exports.Fragment = stub;
  module.exports.iconNames = iconNames;
  module.exports.jsx = (type, props) => ({ type, props });
  module.exports.jsxs = module.exports.jsx;
  module.exports.jsxDEV = module.exports.jsx;
`;

const BUILDER_STUB = `
  let n = 0;
  function generateId() {
    n += 1;
    return "seed-block-" + n.toString(36) + "-" + Date.now().toString(36);
  }
  const stub = new Proxy(function () {}, {
    apply: () => stub,
    construct: () => stub,
    get: (_t, prop) => {
      if (prop === "generateId") return generateId;
      if (prop === "__esModule") return true;
      if (prop === "then") return undefined;
      if (prop === "default") return stub;
      return stub;
    },
  });
  module.exports = stub;
  module.exports.generateId = generateId;
  module.exports.default = stub;
`;

function stubPlugin() {
  return {
    name: "seed-compose-stubs",
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (!args.path.startsWith(".")) return null;
        if (!args.importer.replace(/\\/g, "/").includes("/page-builder/src/")) {
          return null;
        }
        const abs = path.resolve(path.dirname(args.importer), args.path);
        const norm = abs.replace(/\\/g, "/");
        if (
          norm.includes("/schema") ||
          norm.includes("/props.default") ||
          norm.includes("/styles")
        ) {
          return null;
        }
        const m = norm.match(/\/blocks\/([^/]+)(?:\/index)?$/);
        if (!m) return null;
        const schemaRel = BLOCK_DIR_TO_SCHEMA[m[1]];
        if (!schemaRel) return null;
        const target = path.join(pbSrc, schemaRel);
        if (!fs.existsSync(target)) return null;
        return { path: target };
      });

      const stubNamespaces = [
        [/^@hacado\/builder(\/.*)?$/, "builder-stub", BUILDER_STUB],
        [/^lucide-react(\/.*)?$/, "lucide-stub", PROXY_STUB],
        [/^@hacado\/ui(\/.*)?$/, "ui-stub", PROXY_STUB],
        [/^@hacado\/ui-admin(\/.*)?$/, "ui-admin-stub", PROXY_STUB],
        [/^@hacado\/i18n(\/.*)?$/, "i18n-stub", PROXY_STUB],
        [/^@hacado\/app-store(\/.*)?$/, "app-store-stub", PROXY_STUB],
        [/^react$/, "react-stub", PROXY_STUB],
        [/^react\/jsx-runtime$/, "jsx-stub", PROXY_STUB],
        [/^react\/jsx-dev-runtime$/, "jsxdev-stub", PROXY_STUB],
        [/^react-dom(\/.*)?$/, "react-dom-stub", PROXY_STUB],
      ];

      for (const [filter, namespace, contents] of stubNamespaces) {
        build.onResolve({ filter }, (args) => ({
          path: args.path,
          namespace,
        }));
        build.onLoad({ filter: /.*/, namespace }, () => ({
          contents,
          loader: "js",
        }));
      }
    },
  };
}

const entry = path.join(__dirname, "seed-org-compose-entry.ts");
fs.writeFileSync(
  entry,
  `export {
  composeAbout,
  composeBooking,
  composeHome,
  composeService,
  composeTerms,
  resolveServices,
} from "../packages/page-builder/src/templates/layouts/sections.ts";
export {
  getWebsitePack,
  suggestWebsitePackId,
  WEBSITE_PACK_IDS,
  WEBSITE_PACKS,
} from "../packages/page-builder/src/templates/layouts/registry.ts";
`,
);

const outfile = path.join(__dirname, ".pack-compose.mjs");
await esbuild.build({
  absWorkingDir: root,
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile,
  plugins: [stubPlugin()],
  loader: {
    ".css": "empty",
    ".svg": "dataurl",
    ".png": "empty",
    ".jpg": "empty",
    ".jpeg": "empty",
    ".woff": "empty",
    ".woff2": "empty",
  },
  logLevel: "warning",
});

const mod = await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`);
const t = (key) => key;
const pack = mod.WEBSITE_PACKS.salon;
const home = mod.composeHome(pack, t, {
  services: [
    {
      id: "1",
      name: "Cut",
      description: "Haircut",
      slug: "cut",
      pageSlug: "service/cut",
    },
  ],
});
console.log(
  "OK",
  Object.keys(mod.WEBSITE_PACKS).length,
  "packs; home blocks:",
  home.length,
  "first:",
  home[0]?.type,
);
