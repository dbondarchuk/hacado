import Providers from "@/components/admin/layout/providers";
import { SonnerToaster } from "@hacado/ui";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Fraunces, Space_Grotesk } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

export const dynamic = "force-dynamic";

/** UI / body — Space Grotesk is the geometric sans. */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

/** Display headings — Fraunces is the warm editorial serif. */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Hacado",
  },
  icons: {
    icon: "/icon.ico",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${fraunces.variable} font-sans overflow-hidden`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider>
          <NextTopLoader showSpinner={false} color="hsl(var(--primary))" />
          <Providers>
            <SonnerToaster richColors position="top-right" />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
