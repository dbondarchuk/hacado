import { dirname, join } from "path";
import { fileURLToPath } from "url";

import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: join(__dirname, "../../"),
  serverExternalPackages: [
    "pino",
    "pino-pretty",
    "bullmq",
    "pdfkit",
    "@resvg/resvg-js",
  ],
  experimental: {
    authInterrupts: true,
    webpackMemoryOptimizations: true,
    turbopackScopeHoisting: false,
    serverActions: {
      bodySizeLimit: "150mb",
    },
  },
};

export default withNextIntl(nextConfig);
