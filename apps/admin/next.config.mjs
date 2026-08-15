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
  allowedDevOrigins: ["*.dev.bondarchuk.me", "*.dev.hacado.com"],
  serverExternalPackages: [
    "pino",
    "pino-pretty",
    "bullmq",
    "pdfkit",
    "@resvg/resvg-js",
    "geoip-lite",
    "@visulima/disposable-email-domains",
  ],
  experimental: {
    authInterrupts: true,
    webpackMemoryOptimizations: true,
    serverActions: {
      bodySizeLimit: "150mb",
    },
  },
};

export default withNextIntl(nextConfig);
