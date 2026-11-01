import { headers } from "next/headers";

/** Public origin for redirects (Polar checkout, customer portal, etc.). */
export async function resolveAppOrigin(): Promise<string> {
  const fromEnv =
    process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ||
    process.env.ADMIN_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (fromEnv) return fromEnv;
  if (process.env.ADMIN_DOMAIN) return `https://${process.env.ADMIN_DOMAIN}`;

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return "http://localhost:3001";

  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
