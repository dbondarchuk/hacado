/** Headers and footer. */
import {
  bid,
  button,
  C,
  container,
  cookieAcknowledgmentBanner,
  DOCS_URL,
  gap,
  grid,
  heading,
  inlineText,
  link,
  pad,
  size,
  sv,
  text,
} from "../blocks";
import { nav, SIGNIN_URL, SIGNUP_URL, site } from "../content/site";
import {
  HERO_HEADER_NAME,
  MAIN_FOOTER_NAME,
  MAIN_HEADER_NAME,
} from "./shared";

const NAV_LINK_CLASS =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground";
/** Light nav over image heroes; scrolled.className reverses back to muted/foreground. */
const HERO_NAV_LINK_CLASS =
  "rounded-md px-3 py-2 text-sm font-medium text-primary-foreground hover:text-primary-foreground/80";
const HERO_NAV_LINK_SCROLLED_CLASS =
  "text-muted-foreground hover:text-foreground";

function keywords(...parts: string[]) {
  return ["Hacado", "booking", "appointments", ...parts]
    .filter(Boolean)
    .join(", ");
}

function buildMenu(opts?: { overlay?: boolean }) {
  const overlay = Boolean(opts?.overlay);
  const linkClass = overlay ? HERO_NAV_LINK_CLASS : NAV_LINK_CLASS;
  const linkScrolled = overlay
    ? { className: HERO_NAV_LINK_SCROLLED_CLASS }
    : undefined;

  return [
    {
      type: "spacer" as const,
    },
    ...nav.map((item) => {
      if (item.children?.length) {
        const overview =
          item.href === "/compare"
            ? []
            : [
                {
                  type: "link" as const,
                  label: `All ${item.label.toLowerCase()}`,
                  url: item.href,
                  variant: "none" as const,
                  size: "sm" as const,
                  className: HERO_NAV_LINK_SCROLLED_CLASS,
                },
              ];
        return {
          type: "submenu" as const,
          label: item.label,
          twoColumns: item.children.length > 6,
          hideChevron: true,
          className: linkClass,
          ...(linkScrolled ? { scrolled: linkScrolled } : {}),
          children: [
            ...overview,
            ...item.children.map((child) => ({
              type: "link" as const,
              label: child.label,
              url: child.href,
              variant: "none" as const,
              size: "sm" as const,
              className: HERO_NAV_LINK_SCROLLED_CLASS,
            })),
          ],
        };
      }
      return {
        type: "link" as const,
        label: item.label,
        url: item.href,
        variant: "none" as const,
        size: "sm" as const,
        className: linkClass,
        ...(linkScrolled ? { scrolled: linkScrolled } : {}),
      };
    }),
    {
      type: "link" as const,
      label: "Blog",
      url: "/blog",
      variant: "none" as const,
      size: "sm" as const,
      className: linkClass,
      ...(linkScrolled ? { scrolled: linkScrolled } : {}),
    },
    {
      type: "spacer" as const,
    },
    {
      type: "link" as const,
      label: "Log in",
      url: SIGNIN_URL,
      variant: "none" as const,
      size: "sm" as const,
      className: linkClass,
      ...(linkScrolled ? { scrolled: linkScrolled } : {}),
    },
    {
      type: "button" as const,
      label: "Get started",
      url: SIGNUP_URL,
      variant: "primary" as const,
      size: "default" as const,
      className: "rounded-md px-3 py-2 text-sm font-medium",
      showOnMobileHeader: true,
    },
  ];
}

/** Default sticky header for pages without a full-bleed image hero. */
export function buildHeader() {
  return {
    name: MAIN_HEADER_NAME,
    showLogo: true,
    position: "sticky" as const,
    backgroundColor: "var(--value-background-color)",
    textColor: "var(--value-foreground-color)",
    backdropBlur: true,
    shadow: false,
    logoSize: "medium" as const,
    scrolled: {
      shadow: true,
      backdropBlur: true,
    },
    menu: buildMenu(),
  };
}

/**
 * Fixed transparent header for pages whose first viewport is a PageHero
 * with an image background. Gains a solid background + reversed nav colors
 * after scroll.
 */
export function buildHeroHeader() {
  return {
    name: HERO_HEADER_NAME,
    showLogo: true,
    position: "fixed" as const,
    backgroundColor: "transparent",
    textColor: "var(--value-primary-foreground-color)",
    backdropBlur: false,
    shadow: false,
    logoSize: "medium" as const,
    scrolled: {
      backgroundColor: "var(--value-background-color)",
      textColor: "var(--value-foreground-color)",
      backdropBlur: true,
      shadow: true,
    },
    menu: buildMenu({ overlay: true }),
  };
}

export function buildHeaders() {
  return [buildHeader(), buildHeroHeader()];
}

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
      { label: "GlossGenius alternative", href: "/compare/glossgenius" },
      { label: "Boulevard alternative", href: "/compare/boulevard" },
      { label: "StyleSeat alternative", href: "/compare/styleseat" },
      { label: "Mindbody alternative", href: "/compare/mindbody" },
      { label: "Calendly alternative", href: "/compare/calendly" },
      { label: "Square alternative", href: "/compare/square-appointments" },
      { label: "Migrate from Fresha", href: "/migrate-from-fresha" },
      { label: "Booking without marketplace", href: "/booking-system-without-marketplace" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Support", href: "/support" },
      { label: "Contact", href: "/contact" },
      { label: "Docs", href: DOCS_URL },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function buildFooter() {
  const year = new Date().getFullYear();
  const brandCol = container(
    [
      heading("h3", site.name, { fontSize: sv({ value: 1.25, unit: "rem" }) }),
      text(site.tagline, {
        color: sv(C.mutedFg),
        fontSize: sv({ value: 0.875, unit: "rem" }),
      }),
    ],
    { gap: sv({ value: 0.75, unit: "rem" }) },
  );

  const cols = footerColumns.map((col) =>
    container(
      [
        inlineText(col.title, {
          fontWeight: sv("600"),
          fontSize: sv({ value: 0.875, unit: "rem" }),
        }),
        ...col.links.map((l) => link(l.label, l.href)),
      ],
      { gap: sv({ value: 0.5, unit: "rem" }) },
    ),
  );

  return {
    name: MAIN_FOOTER_NAME,
    content: {
      data: {
        fontFamily: "PRIMARY",
        fullWidth: true,
        children: [
          container(
            [
              grid([brandCol, ...cols], "repeat(5, minmax(0, 1fr))", {
                gridTemplateColumns: [
                  { value: "1fr" },
                  { value: "repeat(2, minmax(0, 1fr))", breakpoint: ["sm"] },
                  { value: "repeat(5, minmax(0, 1fr))", breakpoint: ["lg"] },
                ],
                gap: sv({ value: 2, unit: "rem" }),
              }),
              container(
                [
                  text(`© ${year} ${site.name}. All rights reserved.`, {
                    color: sv(C.mutedFg),
                    fontSize: sv({ value: 0.875, unit: "rem" }),
                  }),
                ],
                {
                  padding: [
                    {
                      value: {
                        top: { value: 1.5, unit: "rem" },
                        bottom: { value: 0, unit: "rem" },
                        left: { value: 0, unit: "rem" },
                        right: { value: 0, unit: "rem" },
                      },
                    },
                  ],
                  borderStyle: sv("solid"),
                  borderWidth: [
                    {
                      value: {
                        top: { value: 1, unit: "px" },
                        bottom: { value: 0, unit: "px" },
                        left: { value: 0, unit: "px" },
                        right: { value: 0, unit: "px" },
                      },
                    },
                  ],
                  borderColor: sv(C.border),
                },
              ),
            ],
            {
              padding: [
                {
                  value: {
                    top: { value: 3.5, unit: "rem" },
                    bottom: { value: 2, unit: "rem" },
                    left: { value: 1.5, unit: "rem" },
                    right: { value: 1.5, unit: "rem" },
                  },
                },
              ],
              gap: sv({ value: 2, unit: "rem" }),
              backgroundColor: sv(C.card),
            },
          ),
          cookieAcknowledgmentBanner(),
        ],
      },
      id: bid(),
      type: "PageLayout",
    },
  };
}

