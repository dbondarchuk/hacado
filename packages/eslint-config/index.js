const { resolve } = require("node:path");
const prettierConfig = require("eslint-config-prettier/flat");
const turboConfig = require("eslint-config-turbo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const tsParser = require("@typescript-eslint/parser");
const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = [
  ...turboConfig.default,
  prettierConfig,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      parser: tsParser,
      globals: {
        React: true,
        JSX: true,
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          project,
        },
      },
    },
    files: ["**/*.js?(x)", "**/*.ts?(x)"],
  },
  {
    ignores: [
      ".*.js",
      "node_modules/",
      "dist/",
      "build/",
      "public/",
      "public/**",
      "public/**/*",
      ".next/",
      ".next/**",
      "**/.next/**",
      "next-env.d.ts",
      "**/*.generated.ts",
      "**/*.keys.d.ts",
    ],
  },
  {
    rules: {
      "react-hooks/rules-of-hooks": "off",
      // Packages split into domain/component subpaths — ban the root barrel only.
      // Subpaths like `@hacado/types/booking` or `@hacado/ui/button` are allowed.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@hacado/types",
              message:
                "Import from a domain subpath (e.g. `@hacado/types/booking`, `@hacado/types/utils`) instead of the package root.",
            },
            {
              name: "@hacado/services",
              message:
                "Import from a domain subpath (e.g. `@hacado/services/billing`, `@hacado/services/container`) instead of the package root.",
            },
            {
              name: "@hacado/builder",
              message:
                "Import from a domain subpath (e.g. `@hacado/builder/types`, `@hacado/builder/editor`) instead of the package root.",
            },
            {
              name: "@hacado/page-builder-base",
              message:
                "Import from a domain subpath (e.g. `@hacado/page-builder-base/style`, `@hacado/page-builder-base/helpers`) instead of the package root.",
            },
            {
              name: "@hacado/ui",
              message:
                "Import from a component/subpath (e.g. `@hacado/ui/button`, `@hacado/ui/cn`) instead of the package root.",
            },
            {
              name: "@hacado/ui-admin",
              message:
                "Import from a component/subpath (e.g. `@hacado/ui-admin/save-button`, `@hacado/ui-admin/data-table`) instead of the package root.",
            },
          ],
        },
      ],
    },
  },
];

