"use client";

import { cn } from "@hacado/ui";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const MARKETING_URL = (
  process.env.NEXT_PUBLIC_MARKETING_URL?.trim() || "https://hacado.com"
).replace(/\/$/, "");

const DOCS_URL = "https://docs.hacado.com";
const SIGNIN_URL = "/auth/signin";
const SIGNUP_URL = "/auth/signup";

const site = {
  name: "Hacado",
  tagline:
    "Hacado gives independent beauty & wellness businesses a beautiful booking website without the ugly software.",
};

type NavChild = { label: string; href: string };
type NavItem = { label: string; href: string; children?: NavChild[] };

const nav: NavItem[] = [
  {
    label: "Features",
    href: "/features",
    children: [
      { label: "Scheduling", href: "/features/scheduling" },
      { label: "Appointment management", href: "/features/appointments" },
      { label: "Activity events", href: "/features/activity" },
      { label: "Website builder", href: "/features/website-builder" },
      { label: "Website templates", href: "/template-previews" },
      { label: "Booking tracking", href: "/features/booking-tracking" },
      { label: "Payments", href: "/features/payments" },
      { label: "Notifications", href: "/features/notifications" },
      { label: "Calendars & video", href: "/features/calendars-video" },
      { label: "Gift cards", href: "/features/gift-cards" },
      { label: "Discounts", href: "/features/discounts" },
      { label: "Packages", href: "/features/packages" },
      { label: "Add-ons", href: "/features/add-ons" },
      { label: "Staff management", href: "/features/team" },
      { label: "Client management", href: "/features/clients" },
    ],
  },
  {
    label: "Use cases",
    href: "/use-cases",
    children: [
      { label: "Nail artists", href: "/use-cases/nail-artists" },
      { label: "Hair & barbers", href: "/use-cases/hair-stylists" },
      { label: "Tattoo artists", href: "/use-cases/tattoo-artists" },
      { label: "Lash & brow", href: "/use-cases/lash-and-brow" },
      { label: "Salons & clinics", href: "/use-cases/salons-clinics" },
      { label: "Coaches", href: "/use-cases/coaches" },
      { label: "Consultants", href: "/use-cases/consultants" },
      { label: "Personal trainers", href: "/use-cases/personal-trainers" },
      { label: "Photographers", href: "/use-cases/photographers" },
      { label: "Therapists", href: "/use-cases/therapists" },
      { label: "Tutors", href: "/use-cases/tutors-freelancers" },
      { label: "Freelancers", href: "/use-cases/freelancers" },
      { label: "New businesses", href: "/use-cases/new-businesses" },
    ],
  },
  {
    label: "Compare",
    href: "/compare",
    children: [
      { label: "All alternatives", href: "/compare" },
      { label: "Fresha alternative", href: "/compare/fresha" },
      { label: "Booksy alternative", href: "/compare/booksy" },
      { label: "GlossGenius alternative", href: "/compare/glossgenius" },
      { label: "Boulevard alternative", href: "/compare/boulevard" },
      { label: "StyleSeat alternative", href: "/compare/styleseat" },
      { label: "Vagaro alternative", href: "/compare/vagaro" },
      { label: "Mindbody alternative", href: "/compare/mindbody" },
      { label: "Goldie alternative", href: "/compare/goldie" },
      { label: "Squire alternative", href: "/compare/squire" },
      { label: "Calendly alternative", href: "/compare/calendly" },
      { label: "Acuity alternative", href: "/compare/acuity" },
      { label: "Square alternative", href: "/compare/square-appointments" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Integrations", href: "/integrations" },
];

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Appointment management", href: "/features/appointments" },
      { label: "Activity events", href: "/features/activity" },
      { label: "Gift cards", href: "/features/gift-cards" },
      { label: "Staff management", href: "/features/team" },
      { label: "Client management", href: "/features/clients" },
      { label: "Booking tracking", href: "/features/booking-tracking" },
      { label: "Website templates", href: "/template-previews" },
      { label: "Pricing", href: "/pricing" },
      { label: "Integrations", href: "/integrations" },
    ],
  },
  {
    title: "Use cases",
    links: [
      { label: "Nail artists", href: "/use-cases/nail-artists" },
      { label: "Hair & barbers", href: "/use-cases/hair-stylists" },
      { label: "Tattoo artists", href: "/use-cases/tattoo-artists" },
      { label: "Lash & brow", href: "/use-cases/lash-and-brow" },
      { label: "Salons", href: "/use-cases/salons-clinics" },
      { label: "Coaches", href: "/use-cases/coaches" },
      { label: "Consultants", href: "/use-cases/consultants" },
      { label: "Trainers", href: "/use-cases/personal-trainers" },
      { label: "New businesses", href: "/use-cases/new-businesses" },
    ],
  },
  {
    title: "Compare",
    links: [
      { label: "All alternatives", href: "/compare" },
      { label: "Fresha alternative", href: "/compare/fresha" },
      { label: "Booksy alternative", href: "/compare/booksy" },
      { label: "Vagaro alternative", href: "/compare/vagaro" },
      { label: "Calendly alternative", href: "/compare/calendly" },
      { label: "Square alternative", href: "/compare/square-appointments" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Support", href: "/support" },
      { label: "Contact", href: "/contact" },
      { label: "Docs", href: DOCS_URL, external: true as const },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

/** Marketing-site `container` utility (center, 1.5rem pad, max 1280px). */
const containerClass = "mx-auto w-full max-w-[1280px] px-6";

function marketingHref(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Template gallery lives on the app host, not the marketing site.
  if (path === "/template-previews" || path.startsWith("/template-previews/")) {
    return path;
  }
  return `${MARKETING_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function CatalogMarketingHeader() {
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <header
      data-block="PageHeader"
      className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur"
    >
      <div
        className={cn(
          containerClass,
          "flex h-16 items-center justify-between gap-4",
        )}
      >
        <a
          href={marketingHref("/")}
          className="flex shrink-0 items-center gap-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-8 w-8" />
          <span className="font-display text-xl tracking-tight">
            {site.name}
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const href = marketingHref(item.href);

            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setOpenMenu(item.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <a
                  href={href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </a>
                {item.children && openMenu === item.label && (
                  <div
                    className={cn(
                      "absolute left-0 top-full z-50 rounded-xl border bg-card p-2 shadow-lg",
                      item.children.length > 6
                        ? "min-w-[28rem] grid grid-cols-2"
                        : "min-w-56",
                    )}
                  >
                    {item.children.map((child) => (
                      <a
                        key={child.href}
                        href={marketingHref(child.href)}
                        className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={SIGNIN_URL}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Log in
          </a>
          <a
            href={SIGNUP_URL}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Get started
          </a>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-foreground lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="max-h-[80vh] overflow-y-auto border-t bg-card px-4 py-4 lg:hidden">
          {nav.map((item) => (
            <div key={item.href} className="py-2">
              <a
                href={marketingHref(item.href)}
                className="font-medium"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
              {item.children && (
                <div className="ml-3 mt-1 flex flex-col gap-1">
                  {item.children.map((child) => (
                    <a
                      key={child.href}
                      href={marketingHref(child.href)}
                      className="text-sm text-muted-foreground"
                      onClick={() => setOpen(false)}
                    >
                      {child.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <a href={SIGNIN_URL} className="text-sm text-muted-foreground">
              Log in
            </a>
            <a
              href={SIGNUP_URL}
              className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              Get started
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

export function CatalogMarketingFooter() {
  return (
    <footer data-block="PageFooter" className="mt-auto border-t bg-card">
      <div className={cn(containerClass, "py-14")}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <a href={marketingHref("/")} className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" className="h-8 w-8" />
              <span className="font-display text-xl">{site.name}</span>
            </a>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {site.tagline}
            </p>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <a
                        href={marketingHref(link.href)}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p>English</p>
        </div>
      </div>
    </footer>
  );
}
