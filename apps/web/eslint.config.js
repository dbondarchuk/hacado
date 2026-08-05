const nextConfig = require("@next/eslint-plugin-next");
const config = require("@hacado/eslint-config");

module.exports = [nextConfig.flatConfig.recommended, ...config];
