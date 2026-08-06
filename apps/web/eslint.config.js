const nextPlugin = require("@next/eslint-plugin-next");
const config = require("@hacado/eslint-config");

module.exports = [nextPlugin.configs.recommended, ...config];
