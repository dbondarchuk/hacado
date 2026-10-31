import Providers from "@/components/admin/layout/providers";
import { SonnerToaster } from "@hacado/ui/sonner";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { DM_Mono, Manrope, Playfair_Display } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

export const dynamic = "force-dynamic";

/** Body and UI — Manrope. */
const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

/** Headings — Playfair Display. */
const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

/** Labels and mono — DM Mono. */
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
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
        className={`${manrope.variable} ${playfair.variable} ${dmMono.variable} font-sans overflow-hidden`}
        style={{
          "--font-primary": manrope.style.fontFamily,
          "--font-secondary": playfair.style.fontFamily,
          "--font-tertiary": dmMono.style.fontFamily,
        }}
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
