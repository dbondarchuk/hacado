import base from "@hacado/tailwind-config";
/** @type {import('tailwindcss').Config} */
export default {
  ...base,
  content: [
    ...base.content,
    "../../packages/*/src/**/*.{js,ts,jsx,tsx}",
    // Exclude notification-sender as it's a backend service
  ],
  theme: {
    ...base.theme,
    extend: {
      ...base.theme.extend,
      fontFamily: {
        ...base.theme.extend.fontFamily,
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
    },
  },
  plugins: [...base.plugins],
};
