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
    "@resvg/resvg-js",
    "pdfkit",
  ],
  experimental: {
    webpackMemoryOptimizations: true,
    serverActions: {
      bodySizeLimit: "150mb",
    },
  },
  rewrites: () => [
    {
      source: "/robots.txt",
      destination: "/api/robots",
    },
    {
      source: "/sitemap.xml",
      destination: "/api/sitemap",
    },
  ],
};

export default withNextIntl(nextConfig);
