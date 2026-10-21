/** Home page in the editorial visual system, built from page blocks. */
import { bid, block, C, gap, pad, radius, size, sv } from "./core";
import { customHtml } from "./layout";
import {
  button,
  container,
  grid,
  heading,
  arrowIcon,
  icon,
  image,
  inlineContainer,
  inlineText,
  link,
  text,
} from "./primitives";
import { accordion, checkMark, listRowMotion, step, tilt } from "./widgets";

function e(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const titleSize = [
  { value: { value: 2.4, unit: "rem" } },
  { value: { value: 3.5, unit: "rem" }, breakpoint: ["md"] },
];

const heroTitleSize = [
  { value: { value: 3.25, unit: "rem" } },
  { value: { value: 5.25, unit: "rem" }, breakpoint: ["md"] },
];

const autoMargin = sv({
  top: { value: 0, unit: "rem" },
  bottom: { value: 0, unit: "rem" },
  left: "auto",
  right: "auto",
});

function withId<T>(node: T, id?: string) {
  if (id) (node as T & { base: { id: string } }).base = { id };
  return node;
}

function hairline(edge: "top" | "bottom" | "y") {
  const zero = { value: 0, unit: "px" as const };
  const line = { value: 1, unit: "px" as const };
  return [
    {
      value: {
        top: edge === "bottom" ? zero : line,
        right: zero,
        bottom: edge === "top" ? zero : line,
        left: zero,
      },
    },
  ];
}

function kicker(label: string, color = C.mutedFg) {
  return inlineText(label, {
    fontFamily: sv("TERTIARY"),
    fontSize: size(0.625),
    fontWeight: sv("500"),
    textTransform: sv("uppercase"),
    letterSpacing: sv({ value: 0.05, unit: "rem" }),
    color: sv(color),
  });
}

function serifTitle(
  level: "h1" | "h2" | "h3",
  lead: string,
  em: string,
  fontSize: unknown,
  emColor = C.accentFg,
  align: "flex-start" | "center" = "flex-start",
) {
  return heading(
    level,
    lead,
    {
      fontSize,
      fontWeight: sv("500"),
      letterSpacing: sv({ value: -0.05, unit: "rem" }),
      lineHeight: sv({ value: 1.05, unit: "" }),
      textAlign: sv(align === "center" ? "center" : "left"),
      width: align === "center" ? size(100, "%") : undefined,
    },
    [
      inlineText(em, {
        fontStyle: sv("italic"),
        color: sv(emColor),
      }),
    ],
    {
      display: sv("flex"),
      flexDirection: sv("column"),
      alignItems: sv(align),
      width: align === "center" ? size(100, "%") : undefined,
    },
  );
}

function framed(
  children: unknown[],
  id?: string,
  style: Record<string, unknown> = {},
) {
  return withId(
    container(children, {
      maxWidth: size(82.5, "rem"),
      width: size(100, "%"),
      margin: autoMargin,
      padding: [
        ...pad(4.5, 1.5, 1, 1.5),
        {
          value: {
            top: { value: 6.5, unit: "rem" },
            right: { value: 5.5, unit: "vw" },
            bottom: { value: 1, unit: "rem" },
            left: { value: 5.5, unit: "vw" },
          },
          breakpoint: ["md"],
        },
      ],
      gap: gap(2),
      ...style,
    }),
    id,
  );
}

function split(opts: {
  id?: string;
  kicker: string;
  titleLead: string;
  titleEm: string;
  body?: string;
  link?: { href: string; label: string };
  after?: unknown[];
}) {
  const copy: unknown[] = [];
  if (opts.body) {
    copy.push(
      text(opts.body, {
        color: sv(C.mutedFg),
        fontSize: size(0.95),
        lineHeight: sv({ value: 1.7, unit: "" }),
      }),
    );
  }
  if (opts.link) {
    copy.push(textLink(opts.link.label, opts.link.href));
  }
  return framed(
    [
      container(
        [
          kicker(opts.kicker),
          grid(
            [
              serifTitle("h2", opts.titleLead, opts.titleEm, titleSize),
              container(copy, { gap: gap(1.25), maxWidth: size(26, "rem") }),
            ],
            "1fr 1fr",
            {
              alignItems: sv("flex-end"),
              gap: gap(2),
              gridTemplateColumns: [
                { value: "1fr" },
                { value: "1fr 1fr", breakpoint: ["md"] },
              ],
            },
          ),
        ],
        { gap: gap(1.5), width: size(100, "%") },
      ),
      ...(opts.after ?? []),
    ],
    opts.id,
    { gap: gap(4) },
  );
}

function textLink(label: string, href: string) {
  const external = /^https?:\/\//.test(href);
  return block("Link", {
    props: {
      url: href,
      target: external ? "_blank" : "_self",
      children: [
        inlineText(label, { fontWeight: sv("700"), fontSize: size(0.75) }),
        arrowIcon(),
      ],
    },
    style: {
      display: sv("inline-flex"),
      alignItems: sv("center"),
      gap: gap(0.4),
      color: sv(C.foreground),
      textDecoration: sv("none"),
      width: [{ value: "max-content" }],
      borderStyle: sv("solid"),
      borderColor: sv(C.border),
      borderWidth: hairline("bottom"),
      padding: pad(0, 0, 0.2, 0),
    },
  });
}

export type EditorialBits = {
  href: string;
  title: string;
  body: string;
};

export type EditorialHomeInput = {
  banner: string;
  eyebrow: string;
  eyebrowPhrases: string[];
  titleLead: string;
  titleEm: string;
  body: string;
  note: string;
  industries: string[];
  signupUrl: string;
  heroImage: string;
  integrations: string[];
  integrationsHref: string;
  productKicker: string;
  productTitleLead: string;
  productTitleEm: string;
  productBody: string;
  productHref: string;
  cards: {
    n: string;
    title: string[];
    body: string;
    href: string;
    link: string;
    tone: "dark" | "tan";
  }[];
  stat: { value: string; label: string[]; href: string };
  audienceKicker: string;
  audienceTitleLead: string;
  audienceTitleEm: string;
  audienceBody: string;
  audiences: EditorialBits[];
  featuresKicker: string;
  featuresTitleLead: string;
  featuresTitleEm: string;
  featuresBody?: string;
  features: EditorialBits[];
  templates: {
    kicker: string;
    titleLead: string;
    titleEm: string;
    body: string;
    href: string;
    cta: string;
    images: { src: string; alt: string }[];
  };
  stepsKicker: string;
  stepsTitleLead: string;
  stepsTitleEm: string;
  stepsBody?: string;
  steps: { n: string; title: string; body: string }[];
  storiesKicker: string;
  storiesTitleLead: string;
  storiesTitleEm: string;
  storiesBody?: string;
  testimonial: { quote: string; name: string; role: string; url?: string };
  compareKicker: string;
  compareTitleLead: string;
  compareTitleEm: string;
  compareBody: string;
  compareHref: string;
  compareTable: unknown;
  pricingKicker: string;
  pricingTitleLead: string;
  pricingTitleEm: string;
  pricingBody?: string;
  plans: {
    name: string;
    subtitle: string;
    price: string;
    period: string;
    footnote: string;
    badge?: string;
    cta: string;
    featured?: boolean;
    includes?: string;
    benefits: string[];
    href: string;
  }[];
  pricingDetailsHref: string;
  faqTitleLead: string;
  faqTitleEm: string;
  faqs: { q: string; a: string }[];
  ctaKicker: string;
  ctaTitleLead: string;
  ctaTitleEm: string;
  ctaBody: string;
  ctaLabel: string;
};

const VISUAL_CSS = `
.hv{--ink:hsl(var(--value-foreground-color));--muted:hsl(var(--value-muted-foreground-color));--paper:hsl(var(--value-background-color));--cream:hsl(var(--value-muted-color));--sage:hsl(var(--value-accent-color));--dark:hsl(var(--value-primary-color));--on-dark:hsl(var(--value-primary-foreground-color));--accent-ink:hsl(var(--value-accent-foreground-color));--tan:hsl(var(--value-secondary-color));--line:hsl(var(--value-border-color));--serif:var(--font-secondary-value),Georgia,serif;--sans:var(--font-primary-value),Arial,sans-serif;--mono:var(--font-tertiary-value),ui-monospace,monospace;position:relative;overflow:hidden;border:1px solid var(--line);border-radius:18px;box-shadow:0 24px 70px hsl(var(--value-secondary-color) / .55);background:var(--tan);transform:rotate(-1deg);color:var(--ink);font-family:var(--sans);width:100%;}
.hv:has(#hv-booking:checked){background:var(--sage);box-shadow:0 24px 70px hsl(var(--value-accent-foreground-color) / .16);transform:rotate(1deg);padding:9px;}
.hv-radio{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}
.hv-switch{position:absolute;top:18px;right:18px;z-index:2;display:flex;gap:4px;padding:4px;background:hsl(var(--value-background-color) / .78);border:1px solid var(--line);border-radius:999px;backdrop-filter:blur(10px);}
.hv-switch label{padding:8px 11px;border-radius:999px;color:var(--muted);font:500 9px var(--mono);cursor:pointer;}
.hv:has(#hv-studio:checked) label[for="hv-studio"],.hv:has(#hv-booking:checked) label[for="hv-booking"]{background:var(--dark);color:var(--on-dark);}
.hv-book{display:none;}
.hv:has(#hv-booking:checked) .hv-book{display:block;}
.hv:has(#hv-booking:checked) .hv-studio{display:none;}
.hv-studio{position:relative;min-height:460px;background:var(--tan);}
.hv-studio img{display:block;width:100%;height:460px;object-fit:cover;object-position:center 18%;}
.hv-note{position:absolute;left:25px;bottom:24px;display:grid;grid-template-columns:10px 1fr;column-gap:8px;align-items:center;padding:14px 17px;background:hsl(var(--value-background-color) / .92);box-shadow:0 12px 30px hsl(var(--value-foreground-color) / .12);}
.hv-dot{width:6px;height:6px;background:var(--accent-ink);border-radius:50%;}
.hv-note .hv-dot{grid-row:span 2;}
.hv-note strong{font:600 11px var(--sans);}
.hv-note small{margin-top:3px;color:var(--muted);font:9px var(--mono);}
.hv-stamp{position:absolute;top:27px;left:25px;width:63px;height:63px;display:grid;place-content:center;text-align:center;color:var(--on-dark);background:var(--accent-ink);border-radius:50%;font:8px/1.05 var(--mono);transform:rotate(9deg);}
.hv-stamp b{font:500 25px var(--serif);line-height:.9;}
.hv-chrome{height:36px;padding:0 11px;display:flex;align-items:center;gap:10px;background:var(--cream);border-radius:5px 5px 0 0;color:var(--muted);font:9px var(--mono);}
.hv-dots{display:flex;gap:5px;margin-right:auto;}
.hv-dots i{width:8px;height:8px;border-radius:50%;background:#e2a8a2;display:block;}
.hv-dots i:nth-child(2){background:#e5c389;}
.hv-dots i:nth-child(3){background:#a7c0a7;}
.hv-live{color:var(--accent-ink);font-size:8px;}
.hv-grid{display:grid;grid-template-columns:36% 64%;min-height:350px;background:var(--paper);}
.hv-side{padding:29px 20px;border-right:1px solid var(--line);}
.hv-mini{display:block;font:500 8px var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--muted);}
.hv-side h3{font:500 24px/1.1 var(--serif);margin:13px 0 9px;}
.hv-side p{font-size:10px;color:var(--muted);line-height:1.6;}
.hv-service{display:flex;align-items:center;gap:9px;padding:12px 0;margin-top:21px;border-top:1px solid var(--line);}
.hv-service.is-on{border-top:2px solid var(--accent-ink);}
.hv-ico{width:29px;height:29px;display:grid;place-items:center;background:var(--sage);color:var(--accent-ink);border-radius:50%;flex:none;}
.hv-ico.is-soft{background:var(--tan);color:var(--muted);}
.hv-service strong,.hv-service small{display:block;font-size:9px;}
.hv-service small{color:var(--muted);margin-top:4px;font-size:8px;}
.hv-service>span{margin-left:auto;color:var(--muted);}
.hv-cal{padding:32px;}
.hv-calhead{display:flex;justify-content:space-between;align-items:end;}
.hv-calhead strong{display:block;font:500 24px var(--serif);margin-top:8px;}
.hv-arrows{display:flex;gap:6px;}
.hv-arrows span{width:28px;height:28px;display:grid;place-items:center;border:1px solid var(--line);color:var(--muted);font-size:14px;}
.hv-week,.hv-dates{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;}
.hv-week{color:var(--muted);font:8px var(--mono);text-transform:uppercase;gap:5px;margin:34px 0 14px;}
.hv-dates{row-gap:8px;color:var(--muted);font:10px var(--mono);}
.hv-dates span{padding:9px 0;}
.hv-dates .is-on{background:var(--sage);color:var(--accent-ink);border-radius:50%;}
.hv-calfoot{border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;margin-top:26px;padding-top:18px;font:8px var(--mono);color:var(--muted);}
.hv-key{width:6px;height:6px;border-radius:50%;background:var(--accent-ink);display:inline-block;margin-right:6px;}
.hv-calfoot span.btn{background:var(--dark);color:var(--on-dark);padding:10px 12px;font:9px var(--sans);display:inline-flex;gap:8px;align-items:center;}
.hv-calfoot span.btn svg{display:block;flex:none;}
@media (max-width:800px){
  .hv{transform:none;}
  .hv-switch{top:12px;right:12px;max-width:calc(100% - 24px);}
  .hv-switch label{padding:7px 8px;}
  .hv-stamp{width:54px;height:54px;top:14px;left:14px;}
  .hv-studio,.hv-studio img{min-height:0;height:280px;}
  .hv-grid{grid-template-columns:1fr;}
  .hv-side{display:none;}
  .hv-cal{padding:22px 16px;}
}
`;

function dates() {
  const selected = new Set([9, 12, 16, 19, 23]);
  return Array.from({ length: 30 }, (_, i) => {
    const day = String(i + 1);
    const cls = selected.has(i + 1) ? ` class="is-on"` : "";
    return `<span${cls}>${day}</span>`;
  }).join("");
}

function heroVisual(input: EditorialHomeInput) {
  return customHtml(
    `<div class="hv">
<style>${VISUAL_CSS}</style>
<input class="hv-radio" type="radio" name="hv-hero" id="hv-studio" checked>
<input class="hv-radio" type="radio" name="hv-hero" id="hv-booking">
<div class="hv-switch" role="tablist" aria-label="Hero preview">
<label for="hv-studio">Your day</label>
<label for="hv-booking">Your booking site</label>
</div>
<div class="hv-studio">
<img src="${e(input.heroImage)}" alt="Salon owner arranging her studio before clients arrive">
<div class="hv-stamp">MON<br><b>09</b><br>JUNE</div>
<div class="hv-note"><span class="hv-dot"></span><strong>More time for your craft.</strong><small>Hacado handles the rest.</small></div>
</div>
<div class="hv-book" aria-hidden="true">
<div class="hv-chrome"><span class="hv-dots"><i></i><i></i><i></i></span><span>yourstudio.hacado.me</span><span class="hv-live">● live</span></div>
<div class="hv-grid">
<div class="hv-side"><span class="hv-mini">Your studio</span><h3>Book an appointment</h3><p>Choose a service to get started.</p>
<div class="hv-service is-on"><span class="hv-ico">✦</span><div><strong>Gel manicure</strong><small>60 min · $45</small></div><span>›</span></div>
<div class="hv-service"><span class="hv-ico is-soft">✦</span><div><strong>Gift cards</strong><small>Give a little glow</small></div><span>›</span></div>
</div>
<div class="hv-cal">
<div class="hv-calhead"><div><span class="hv-mini">Choose a date</span><strong>June 2026</strong></div><div class="hv-arrows"><span>‹</span><span>›</span></div></div>
<div class="hv-week"><span>sun</span><span>mon</span><span>tue</span><span>wed</span><span>thu</span><span>fri</span><span>sat</span></div>
<div class="hv-dates">${dates()}</div>
<div class="hv-calfoot"><span><i class="hv-key"></i> Available</span><span class="btn">Continue <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg></span></div>
</div>
</div>
</div>
</div>`,
    { minWidth: size(0), width: size(100, "%") },
  );
}

function phraseCycle(phrases: string[]) {
  return block("PhraseCycle", {
    style: {
      fontFamily: sv("TERTIARY"),
      fontSize: size(0.625),
      fontWeight: sv("500"),
      textTransform: sv("uppercase"),
      letterSpacing: sv({ value: 0.05, unit: "rem" }),
      color: sv(C.foreground),
      display: sv("inline-grid"),
    },
    props: {
      phrases: phrases.map((text) => ({ id: bid(), text })),
      enterMotion: "fade-up",
      exitMotion: "fade-up",
      enterDurationMs: 450,
      exitDurationMs: 400,
      pauseAfterPhraseMs: 1600,
    },
  });
}

function homeHero(input: EditorialHomeInput) {
  const copy = container(
    [
      inlineContainer(
        [
          container([], {
            width: size(0.375, "rem"),
            height: size(0.375, "rem"),
            borderRadius: radius(999),
            backgroundColor: sv(C.accentFg),
            flexShrink: sv("0"),
          }),
          inlineContainer(
            [kicker("For", C.foreground), phraseCycle(input.eyebrowPhrases)],
            { gap: gap(0.35), alignItems: sv("center") },
          ),
        ],
        {
          gap: gap(0.5),
          padding: pad(0.55, 0.85, 0.55, 0.85),
          borderStyle: sv("solid"),
          borderWidth: size(1, "px"),
          borderColor: sv(C.border),
          borderRadius: radius(999),
          width: [{ value: "max-content" }],
        },
      ),
      serifTitle("h1", input.titleLead, input.titleEm, heroTitleSize),
      text(input.body, {
        color: sv(C.mutedFg),
        fontSize: size(0.95),
        lineHeight: sv({ value: 1.7, unit: "" }),
        maxWidth: size(28, "rem"),
      }),
      container(
        [
          button(
            "Create my booking site",
            input.signupUrl,
            "primary",
            undefined,
            {
              width: [{ value: "max-content" }],
            },
          ),
          link("See how it works", "#how-it-works", {
            color: sv(C.foreground),
            fontWeight: sv("700"),
            fontSize: size(0.75),
            textDecoration: sv("none"),
          }),
        ],
        {
          display: sv("flex"),
          flexDirection: sv("row"),
          flexWrap: sv("wrap"),
          alignItems: sv("center"),
          gap: gap(1.25),
        },
      ),
      inlineContainer(
        [
          checkMark(0.9),
          inlineText(input.note, {
            fontFamily: sv("TERTIARY"),
            fontSize: size(0.625),
            color: sv(C.mutedFg),
          }),
        ],
        { gap: gap(0.4), flexWrap: sv("wrap") },
      ),
      inlineText(input.industries.join(" · "), {
        fontFamily: sv("TERTIARY"),
        fontSize: size(0.625),
        textTransform: sv("uppercase"),
        letterSpacing: sv({ value: 0.04, unit: "rem" }),
        color: sv(C.mutedFg),
      }),
    ],
    { gap: gap(1.35), minWidth: size(0), alignItems: sv("flex-start") },
  );

  return withId(
    block("PageHero", {
      style: {
        padding: [
          ...pad(3, 1.5, 3.5, 1.5),
          {
            value: {
              top: { value: 5, unit: "vw" },
              right: { value: 5.5, unit: "vw" },
              bottom: { value: 6, unit: "vw" },
              left: { value: 5.5, unit: "vw" },
            },
            breakpoint: ["md"],
          },
        ],
        display: sv("flex"),
        flexDirection: sv("column"),
        alignItems: sv("stretch"),
        backgroundColor: sv(C.background),
        width: size(100, "%"),
      },
      props: {
        title: {
          children: [
            grid([copy, heroVisual(input)], "1fr", {
              alignItems: sv("center"),
              gap: gap(2.5),
              maxWidth: size(82.5, "rem"),
              width: size(100, "%"),
              margin: autoMargin,
              gridTemplateColumns: [
                { value: "1fr" },
                {
                  value: "minmax(0, 0.86fr) minmax(0, 1.14fr)",
                  breakpoint: ["md"],
                },
              ],
            }),
          ],
        },
        subtitle: { children: [] },
        buttons: { children: [] },
      },
    }),
    "top",
  );
}

function announce(message: string) {
  return container(
    [
      inlineContainer(
        [
          icon("sparkles", {
            width: size(0.875),
            height: size(0.875),
            color: sv(C.accentFg),
          }),
          inlineText(message, {
            fontFamily: sv("TERTIARY"),
            fontSize: size(0.6875),
            fontWeight: sv("500"),
            color: sv(C.accentFg),
          }),
        ],
        { gap: gap(0.5), justifyContent: sv("center") },
      ),
    ],
    {
      backgroundColor: sv(C.accent),
      alignItems: sv("center"),
      justifyContent: sv("center"),
      padding: pad(0.6, 1, 0.6, 1),
      width: size(100, "%"),
    },
  );
}

function trust(input: EditorialHomeInput) {
  return container(
    [
      kicker("Made for independent business"),
      ...input.integrations.map((name) => kicker(name)),
      link("All integrations", input.integrationsHref, {
        fontFamily: sv("TERTIARY"),
        fontSize: size(0.625),
        fontWeight: sv("500"),
        textTransform: sv("uppercase"),
        letterSpacing: sv({ value: 0.04, unit: "rem" }),
        color: sv(C.mutedFg),
        textDecoration: sv("none"),
      }),
    ],
    {
      display: sv("flex"),
      flexDirection: sv("row"),
      flexWrap: sv("wrap"),
      alignItems: sv("center"),
      justifyContent: sv("space-between"),
      gap: gap(1),
      maxWidth: size(82.5, "rem"),
      width: size(100, "%"),
      margin: autoMargin,
      padding: [
        ...pad(1.25, 1.5, 1.25, 1.5),
        {
          value: {
            top: { value: 1.4, unit: "rem" },
            right: { value: 5.5, unit: "vw" },
            bottom: { value: 1.4, unit: "rem" },
            left: { value: 5.5, unit: "vw" },
          },
          breakpoint: ["md"],
        },
      ],
      borderStyle: sv("solid"),
      borderColor: sv(C.border),
      borderWidth: hairline("y"),
    },
  );
}

function detailRows(items: EditorialBits[]) {
  return container(
    items.map((item, index) => {
      const external = /^https?:\/\//.test(item.href);
      return block("Link", {
        props: {
          url: item.href,
          target: external ? "_blank" : "_self",
          children: [
            inlineText(String(index + 1).padStart(2, "0"), {
              fontFamily: sv("TERTIARY"),
              fontSize: size(0.625),
              color: sv(C.mutedFg),
            }),
            container(
              [
                heading("h3", item.title, {
                  fontSize: [
                    { value: { value: 1.35, unit: "rem" } },
                    { value: { value: 1.7, unit: "rem" }, breakpoint: ["md"] },
                  ],
                  fontWeight: sv("500"),
                  letterSpacing: sv({ value: -0.04, unit: "rem" }),
                }),
                text(item.body, {
                  color: sv(C.mutedFg),
                  fontSize: size(0.75),
                  lineHeight: sv({ value: 1.6, unit: "" }),
                }),
              ],
              { gap: gap(0.3) },
            ),
            arrowIcon({
              width: size(1.05),
              height: size(1.05),
              justifySelf: sv("end"),
            }),
          ],
        },
        style: {
          display: sv("grid"),
          gridTemplateColumns: [
            { value: "2.4rem 1fr 1.25rem" },
            { value: "4.4rem 1fr 1.5rem", breakpoint: ["md"] },
          ],
          alignItems: sv("center"),
          gap: gap(0.75),
          borderStyle: sv("solid"),
          borderColor: sv(C.border),
          borderWidth: hairline("bottom"),
          textDecoration: sv("none"),
          width: size(100, "%"),
          ...listRowMotion(),
        },
      });
    }),
    {
      borderStyle: sv("solid"),
      borderColor: sv(C.border),
      borderWidth: hairline("top"),
      gap: gap(0),
      width: size(100, "%"),
    },
  );
}

function featureCard(card: EditorialHomeInput["cards"][number], index: number) {
  const dark = card.tone === "dark";
  const ink = dark ? C.primaryFg : C.foreground;
  const muted = dark ? C.primaryFg : C.mutedFg;
  const external = /^https?:\/\//.test(card.href);
  return block("Link", {
    props: {
      url: card.href,
      target: external ? "_blank" : "_self",
      children: [
        container(
          [
            kicker(card.n, muted),
            icon("sparkles", {
              width: size(0.875),
              height: size(0.875),
              color: sv(muted),
            }),
          ],
          {
            display: sv("flex"),
            flexDirection: sv("row"),
            justifyContent: sv("space-between"),
            alignItems: sv("center"),
          },
        ),
        heading("h3", card.title.join(" "), {
          fontSize: size(1.9),
          fontWeight: sv("500"),
          letterSpacing: sv({ value: -0.04, unit: "rem" }),
          color: sv(ink),
        }),
        text(card.body, {
          color: sv(muted),
          fontSize: size(0.75),
          lineHeight: sv({ value: 1.7, unit: "" }),
          maxWidth: size(16, "rem"),
        }),
        container(
          [
            inlineText(card.link, {
              fontSize: size(0.7),
              fontWeight: sv("700"),
              color: sv(ink),
            }),
            arrowIcon({ width: size(0.85), height: size(0.85) }),
          ],
          {
            display: sv("flex"),
            flexDirection: sv("row"),
            alignItems: sv("center"),
            gap: gap(0.35),
          },
        ),
      ],
    },
    style: {
      display: sv("flex"),
      flexDirection: sv("column"),
      justifyContent: sv("space-between"),
      gap: gap(1),
      minHeight: size(20, "rem"),
      height: size(100, "%"),
      padding: pad(1.7, 1.75, 1.7, 1.75),
      backgroundColor: sv(dark ? C.primary : C.secondary),
      color: sv(ink),
      textDecoration: sv("none"),
      ...tilt(index),
    },
  });
}

function band(input: EditorialHomeInput) {
  return container(
    [
      grid(
        [
          ...input.cards.map(featureCard),
          block("Link", {
            props: {
              url: input.stat.href,
              target: "_self",
              children: [
                heading("h2", input.stat.value, {
                  fontSize: [
                    { value: { value: 4.5, unit: "rem" } },
                    { value: { value: 6.5, unit: "rem" }, breakpoint: ["md"] },
                  ],
                  fontWeight: sv("500"),
                  letterSpacing: sv({ value: -0.06, unit: "rem" }),
                  lineHeight: sv({ value: 0.85, unit: "" }),
                }),
                kicker(input.stat.label.join(" ")),
              ],
            },
            style: {
              display: sv("flex"),
              flexDirection: sv("column"),
              justifyContent: sv("center"),
              gap: gap(1),
              minHeight: size(20, "rem"),
              height: size(100, "%"),
              padding: pad(1.7, 1.75, 1.7, 1.75),
              backgroundColor: sv(C.accent),
              color: sv(C.foreground),
              textDecoration: sv("none"),
              ...tilt(2),
            },
          }),
        ],
        "1fr 1fr 1fr",
        {
          gap: gap(0.8),
          alignItems: sv("stretch"),
          gridTemplateColumns: [
            { value: "1fr" },
            { value: "1fr 1fr 1fr", breakpoint: ["lg"] },
          ],
        },
      ),
    ],
    {
      maxWidth: size(82.5, "rem"),
      width: size(100, "%"),
      margin: autoMargin,
      padding: [
        ...pad(1, 1.5, 4, 1.5),
        {
          value: {
            top: { value: 1, unit: "rem" },
            right: { value: 5.5, unit: "vw" },
            bottom: { value: 6, unit: "rem" },
            left: { value: 5.5, unit: "vw" },
          },
          breakpoint: ["md"],
        },
      ],
    },
  );
}

function closing(input: EditorialHomeInput) {
  return withId(
    container(
      [
        container(
          [
            kicker(input.ctaKicker, C.primaryFg),
            serifTitle(
              "h2",
              input.ctaTitleLead,
              input.ctaTitleEm,
              titleSize,
              C.accent,
              "center",
            ),
            text(input.ctaBody, {
              color: sv(C.primaryFg),
              fontSize: size(0.9),
            }),
            button(input.ctaLabel, input.signupUrl, "primary", C.primary, {
              backgroundColor: sv(C.primaryFg),
              width: [{ value: "max-content" }],
            }),
          ],
          {
            alignItems: sv("center"),
            textAlign: sv("center"),
            gap: gap(1.25),
            maxWidth: size(40, "rem"),
            margin: autoMargin,
          },
        ),
      ],
      {
        backgroundColor: sv(C.primary),
        color: sv(C.primaryFg),
        width: size(100, "%"),
        padding: [
          ...pad(5, 1.5, 5, 1.5),
          {
            value: {
              top: { value: 7, unit: "rem" },
              right: { value: 5.5, unit: "vw" },
              bottom: { value: 7, unit: "rem" },
              left: { value: 5.5, unit: "vw" },
            },
            breakpoint: ["md"],
          },
        ],
      },
    ),
    "start",
  );
}

function editorialPlanCard(
  plan: EditorialHomeInput["plans"][number],
  index: number,
) {
  const children: unknown[] = [
    inlineText(plan.badge ?? plan.subtitle, {
      fontFamily: sv("TERTIARY"),
      fontSize: size(0.625),
      textTransform: sv("uppercase"),
      letterSpacing: sv({ value: 0.04, unit: "rem" }),
      color: sv(C.accentFg),
    }),
    heading("h3", plan.name, { fontSize: size(1.75), fontWeight: sv("500") }),
    container(
      [
        heading("h2", plan.price, {
          fontSize: size(4),
          fontWeight: sv("500"),
          letterSpacing: sv({ value: -0.04, unit: "rem" }),
        }),
        inlineText(plan.period, {
          fontFamily: sv("TERTIARY"),
          fontSize: size(0.625),
          textTransform: sv("uppercase"),
          color: sv(C.mutedFg),
        }),
      ],
      {
        display: sv("flex"),
        flexDirection: sv("row"),
        alignItems: sv("flex-end"),
        gap: gap(0.5),
      },
    ),
    text(plan.footnote, { color: sv(C.mutedFg), fontSize: size(0.8125) }),
  ];
  if (plan.includes) {
    children.push(
      text(plan.includes, { fontWeight: sv("600"), fontSize: size(0.8125) }),
    );
  }
  children.push(
    container(
      plan.benefits.map((benefit) =>
        inlineContainer(
          [checkMark(0.9), inlineText(benefit, { fontSize: size(0.75) })],
          { gap: gap(0.5), alignItems: sv("flex-start") },
        ),
      ),
      { gap: gap(0.4), flexGrow: sv(1) },
    ),
  );
  children.push(
    button(plan.cta, plan.href, "primary", undefined, {
      width: [{ value: "max-content" }],
    }),
  );
  return container(children, {
    gap: gap(0.75),
    padding: pad(1.75, 1.75, 1.75, 1.75),
    backgroundColor: sv(plan.featured ? C.accent : C.muted),
    height: size(100, "%"),
    ...tilt(index),
  });
}

function editorialPlanGrid(plans: EditorialHomeInput["plans"]) {
  return grid(plans.map(editorialPlanCard), "repeat(3, minmax(0, 1fr))", {
    gap: gap(0.875),
    alignItems: sv("stretch"),
    width: size(100, "%"),
    gridTemplateColumns: [
      { value: "1fr" },
      { value: "repeat(3, minmax(0, 1fr))", breakpoint: ["lg"] },
    ],
  });
}

export function buildEditorialHome(input: EditorialHomeInput) {
  const before = [
    announce(input.banner),
    homeHero(input),
    trust(input),
    split({
      id: "product",
      kicker: input.productKicker,
      titleLead: input.productTitleLead,
      titleEm: input.productTitleEm,
      body: input.productBody,
      link: { href: input.productHref, label: "See what's included" },
    }),
    band(input),
    split({
      id: "use-cases",
      kicker: input.audienceKicker,
      titleLead: input.audienceTitleLead,
      titleEm: input.audienceTitleEm,
      body: input.audienceBody,
      after: [detailRows(input.audiences)],
    }),
    split({
      id: "features",
      kicker: input.featuresKicker,
      titleLead: input.featuresTitleLead,
      titleEm: input.featuresTitleEm,
      body: input.featuresBody,
      link: { href: "/features", label: "All features" },
      after: [detailRows(input.features)],
    }),
    split({
      kicker: input.templates.kicker,
      titleLead: input.templates.titleLead,
      titleEm: input.templates.titleEm,
      body: input.templates.body,
      link: { href: input.templates.href, label: input.templates.cta },
      after: [
        grid(
          input.templates.images.map((shot, index) =>
            image(
              shot.src,
              shot.alt,
              {
                height: size(13.75, "rem"),
                borderRadius: radius(0),
                objectPosition: [{ value: { x: 50, y: 0 } }],
                ...tilt(index),
              },
              input.templates.href,
            ),
          ),
          "1fr 1fr 1fr",
          {
            gap: gap(0.8),
            gridTemplateColumns: [
              { value: "1fr" },
              { value: "1fr 1fr 1fr", breakpoint: ["md"] },
            ],
          },
        ),
      ],
    }),
    split({
      id: "how-it-works",
      kicker: input.stepsKicker,
      titleLead: input.stepsTitleLead,
      titleEm: input.stepsTitleEm,
      body: input.stepsBody,
      after: [
        grid(
          input.steps.map((item) => step(item.n, item.title, item.body)),
          "1fr 1fr 1fr",
          {
            gap: gap(0.8),
            alignItems: sv("stretch"),
            gridTemplateColumns: [
              { value: "1fr" },
              { value: "1fr 1fr 1fr", breakpoint: ["md"] },
            ],
          },
        ),
      ],
    }),
    split({
      kicker: input.storiesKicker,
      titleLead: input.storiesTitleLead,
      titleEm: input.storiesTitleEm,
      body: input.storiesBody,
      after: [
        container(
          [
            kicker(input.testimonial.role, C.accentFg),
            heading("h3", `“${input.testimonial.quote}”`, {
              fontSize: size(1.9),
              fontWeight: sv("500"),
              letterSpacing: sv({ value: -0.04, unit: "rem" }),
              lineHeight: sv({ value: 1.2, unit: "" }),
              maxWidth: size(48, "rem"),
            }),
            input.testimonial.url
              ? link(input.testimonial.name, input.testimonial.url, {
                  color: sv(C.accentFg),
                  fontSize: size(0.875),
                })
              : inlineText(input.testimonial.name, {
                  color: sv(C.accentFg),
                  fontSize: size(0.875),
                }),
          ],
          {
            gap: gap(1),
            padding: pad(2.2, 2.2, 2.2, 2.2),
            backgroundColor: sv(C.accent),
          },
        ),
      ],
    }),
    split({
      id: "compare",
      kicker: input.compareKicker,
      titleLead: input.compareTitleLead,
      titleEm: input.compareTitleEm,
      body: input.compareBody,
      link: { href: input.compareHref, label: "Full comparison" },
      after: [input.compareTable],
    }),
  ];

  const after = [
    split({
      id: "pricing",
      kicker: input.pricingKicker,
      titleLead: input.pricingTitleLead,
      titleEm: input.pricingTitleEm,
      body: input.pricingBody,
      link: { href: input.pricingDetailsHref, label: "See plan details" },
      after: [editorialPlanGrid(input.plans)],
    }),
    framed(
      [
        serifTitle("h2", input.faqTitleLead, input.faqTitleEm, titleSize),
        accordion(input.faqs),
      ],
      "questions",
    ),
    closing(input),
  ];

  return { before, after };
}
