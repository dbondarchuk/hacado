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
    ],
  },
  {
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
];
