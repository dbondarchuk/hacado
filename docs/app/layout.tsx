import type { Metadata } from "next";
import { DM_Mono, Manrope, Playfair_Display } from "next/font/google";
import { Head } from "nextra/components";
import type { ReactNode } from "react";
import "nextra-theme-docs/style.css";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://docs.hacado.com"),
  title: {
    default: "Hacado Docs",
    template: "%s | Hacado Docs",
  },
  description:
    "Product guides for Hacado: set up your workspace, take bookings, and connect calendars, payments, and notifications.",
  applicationName: "Hacado Docs",
  openGraph: {
    siteName: "Hacado Docs",
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${playfair.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <Head
        backgroundColor={{
          light: "#FFFFFF",
          dark: "#161614",
        }}
        color={{
          hue: { light: 109, dark: 107 },
          saturation: { light: 18, dark: 16 },
          lightness: { light: 28, dark: 64 },
        }}
      />
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
