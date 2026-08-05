import { SonnerToaster } from "@hacado/ui";
import type { ReactNode } from "react";

import type { Metadata } from "next";
import { Inter, Montserrat, Playfair_Display } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: {
    default: "Hacado",
    template: "%s | Hacado",
  },
};

export default function OrganizationNotFoundLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.className} ${montserrat.variable} ${playfair.variable} scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <style>
        {`@layer base {
  :root {
    --brand-color: 40 65% 38%;
    --primary-color: 40 65% 38%;
    --primary-foreground-color: 0 0% 100%;
    --secondary-color: 214 94% 93%;
    --secondary-foreground-color: 224 64% 33%;
  }
}`}
      </style>
      <SonnerToaster />
      <body className="min-h-screen min-h-dvh">{children}</body>
    </html>
  );
}
