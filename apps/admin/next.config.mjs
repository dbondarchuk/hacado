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
  async redirects() {
    return [
      {
        source: "/dashboard/services/options",
        destination: "/dashboard/catalog/services",
        permanent: true,
      },
      {
        source: "/dashboard/services/options/:path*",
        destination: "/dashboard/catalog/services/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/services",
        destination: "/dashboard/catalog",
        permanent: true,
      },
      {
        source: "/dashboard/services/:path*",
        destination: "/dashboard/catalog/:path*",
        permanent: true,
      },
      {
        source: "/api/services/options",
        destination: "/api/catalog/services",
        permanent: true,
      },
      {
        source: "/api/services/options/:path*",
        destination: "/api/catalog/services/:path*",
        permanent: true,
      },
      {
        source: "/api/services/:path*",
        destination: "/api/catalog/:path*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
