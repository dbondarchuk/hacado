import base from "@hacado/tailwind-config";

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...base,
  content: [...base.content],
  plugins: [...base.plugins],
};
