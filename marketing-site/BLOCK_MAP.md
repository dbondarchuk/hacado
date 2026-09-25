# Page-builder mapping

Every section root in this prototype sets `data-block="..."`. Rebuild in the page builder using the block or template named below.

Site chrome is **not** a page block:

| Chrome     | Product mapping                                                            |
| ---------- | -------------------------------------------------------------------------- |
| Header     | `PageHeader` (sticky, logo, menu + submenu, Log in / Get started)          |
| Footer     | `PageFooter` (four link columns + bottom bar)                              |
| Cookie bar | **NEW** `CookieConsent` (no block today; could be `Popup` or `CustomHTML`) |

Pages sit in `PageLayout` with `fullWidth: true`.

## Blocks used (exist today)

`PageHero`, `TypewriterText`, `Button`, `MarketingBrowserCarousel`, `MarketingScrollingLogos`, `MarketingFeaturesShowcase`, `MarketingFeatureItem`, `SectionIntro` (template), `Step` (template), `TestimonialCard` (template), `PlanCard` (template), `CtaBand` (template), `Banner` (template), `Badge` (template), `Accordion` / `AccordionItem`, `Table`, `Image`, `Lightbox` (photo grids), `GridContainer`, `Container`, `Icon`, `Link`, `Heading`, `Text`

## Gaps (NEW or compose)

| Prototype UI                                    | Flag                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| Cookie accept / necessary only + `localStorage` | **NEW** CookieConsent                                                               |
| Integration card dialog (what / why / how)      | **NEW** IntegrationDialog                                                           |
| Monthly / yearly pricing toggle                 | **NEW** or PlanCard enhancement                                                     |
| Contact form (non-submitting)                   | **Forms embed** or **NEW** ContactForm                                              |
| Sticky first column on comparison table         | Existing `Table`; if freeze + check icons are insufficient, **NEW** ComparisonTable |
| Language switcher                               | Skipped (English only)                                                              |

## Page → sections

| Route                     | Sections (in order)                                                                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                       | Banner, PageHero + TypewriterText + Buttons + MarketingBrowserCarousel, MarketingScrollingLogos, audience Image cards, StatCell × 3, MarketingFeaturesShowcase, Step × 3, TestimonialCard, Table (competitors), PlanCard × 3, Accordion, CtaBand |
| `/features`               | PageHero, grouped Image feature cards (core / grow / people), CtaBand                                                                                                                                                                            |
| `/features/*`             | PageHero, bullets + Image, Lightbox grid, extra Text sections, Step, Accordion, CtaBand                                                                                                                                                          |
| `/features/revenue-tools` | Redirect to `/features/gift-cards`                                                                                                                                                                                                               |
| `/use-cases`              | PageHero, Image cards (studios then practices/teams/launch, equal weight), CtaBand                                                                                                                                                               |
| `/use-cases/*`            | PageHero, problem/outcome, bullets, extra Text sections, Lightbox, Step, Accordion, related Links, CtaBand                                                                                                                                       |
| `/integrations`           | PageHero, MarketingScrollingLogos, integration GridContainer (dialog trigger), **NEW** IntegrationDialog (what / why / how)                                                                                                                      |
| `/compare`                | PageHero, Table, Link cards, other-tools Containers, CtaBand                                                                                                                                                                                     |
| `/compare/*`              | PageHero, two-column Containers, CtaBand                                                                                                                                                                                                         |
| `/pricing`                | PageHero, pricing toggle + PlanCard × 3, Table (plans), Accordion, CtaBand                                                                                                                                                                       |
| `/about`                  | PageHero, origin story, who-we-build-for Link cards, CtaBand                                                                                                                                                                                     |
| `/support`                | PageHero, three channel cards (GitHub / email / docs), hours + SLA copy                                                                                                                                                                          |
| `/contact`                | PageHero, ContactForm                                                                                                                                                                                                                            |
| `/privacy`, `/terms`      | PageHero + legal article (production SaaS copy)                                                                                                                                                                                                  |

## Image credits

**Generated (this prototype):** `public/assets/generated/*` - product UI mocks and editorial heroes (cream / sage / ochre).

**Unsplash (downloaded, not hotlinked):**

| File                | Typical subject        | Unsplash photo id / query        |
| ------------------- | ---------------------- | -------------------------------- |
| `nails-closeup.jpg` | Nail polish / manicure | photo-1604654894610-df63bc536371 |
| `nails-studio.jpg`  | Nail studio            | photo-1632345031435-8727f6897d53 |
| `hair-salon.jpg`    | Salon interior         | photo-1560066984-138dadb4c035    |
| `hair-cut.jpg`      | Hair styling           | photo-1522337360788-8b13dee7a37e |
| `barber.jpg`        | Barber                 | photo-1503951914875-452162b0f3f1 |
| `tattoo-flash.jpg`  | Tattoo / flash         | photo-1612198188060-c7c2a3b66eae |
| `makeup-lashes.jpg` | Makeup / lashes        | photo-1487412720507-e7ab37603c6f |
| `brow-beauty.jpg`   | Beauty close-up        | photo-1516975080664-ed2fc6a32937 |
| `coach-laptop.jpg`  | Professional at laptop | photo-1551836022-d5d88e9218df    |
| `phone-booking.jpg` | Phone                  | photo-1512941937669-90a1b58e7e9c |
| `desk-calendar.jpg` | Calendar / desk        | photo-1506784983877-45594efa4cbe |

Unsplash license allows commercial use; credit photographers on the production site.

**Logos:** copied from `apps/web/public/logos` (Google Calendar, Outlook, Zoom, Meet, Teams, PayPal, Stripe, Square). CalDAV, ICS, SMTP, Webhooks, and Textbelt marks are authored SVGs in this prototype. Hacado mark from `apps/admin/public/logo.svg`.

**SVGs (authored):** `waves.svg`, `check.svg`, `dash.svg`, `blob-card.svg`, `avatar.svg`. Testimonial portrait is the SVG avatar - not a likeness of Olesia Bondarchuk.

**Competitor marks:** wordmark/text cards only. Official logos were not copied.
