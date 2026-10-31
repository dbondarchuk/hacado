"use client";

import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const guides = [
  {
    kicker: "01",
    title: "Getting started",
    body: "Create an account, choose a plan, and finish first-time setup.",
    href: "/docs/getting-started/introduction",
  },
  {
    kicker: "02",
    title: "First steps",
    body: "A short checklist to go from a fresh workspace to a live booking page.",
    href: "/docs/first-steps",
  },
  {
    kicker: "03",
    title: "Using your workspace",
    body: "Where settings live, and how to connect a web address you already own.",
    href: "/docs/daily-use/settings",
  },
  {
    kicker: "04",
    title: "Apps",
    body: "Calendars, payments, email, texts, and the extra tools on your site.",
    href: "/docs/apps/overview",
  },
];

export function HomePage() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      storageKey="theme"
    >
      <div className="home">
        <header className="home-header">
          <Logo />
          <nav className="home-nav" aria-label="Primary">
            <Link href="/docs/getting-started/introduction">Guides</Link>
            <a href="https://hacado.com">Website</a>
            <a href="https://app.hacado.com/auth/signin">Log in</a>
            <ThemeToggle />
          </nav>
        </header>
        <main>
          <section className="hero">
            <p className="eyebrow">Product documentation</p>
            <h1>
              Guides for your <em>booking website.</em>
            </h1>
            <p className="lede">
              Hacado is an all-in-one booking platform: accept appointments,
              automate notifications, process payments, and build a complete
              website from one admin. If you can use email, you can use Hacado.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/docs/getting-started/introduction">
                Open the guides
              </Link>
              <a className="button button-secondary" href="https://hacado.com">
                Visit hacado.com
              </a>
            </div>
          </section>
          <section className="guide-grid" aria-label="Documentation sections">
            {guides.map((guide) => (
              <Link key={guide.href} href={guide.href} className="guide-card">
                <span className="guide-kicker">{guide.kicker}</span>
                <h2>{guide.title}</h2>
                <p>{guide.body}</p>
              </Link>
            ))}
          </section>
        </main>
        <footer className="home-footer">
          <p>Copyright © {new Date().getFullYear()} Hacado.</p>
          <a href="https://hacado.com">hacado.com</a>
        </footer>
      </div>
    </ThemeProvider>
  );
}
