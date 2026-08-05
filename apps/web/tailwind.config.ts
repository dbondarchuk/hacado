import base from "@hacado/tailwind-config";
/** @type {import('tailwindcss').Config} */
export default {
  ...base,
  content: [
    ...base.content,
    "../../packages/*/src/**/*.{js,ts,jsx,tsx}",
    // Exclude notification-sender as it's a backend service
  ],
  plugins: [...base.plugins],
};
