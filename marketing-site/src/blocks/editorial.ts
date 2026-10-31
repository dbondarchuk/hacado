/** Home page in the editorial visual system, built from page blocks. */
import { bid, block, C, gap, pad, radius, size, sv } from "./core";
import { ctaSpark } from "./layout";
import {
  arrowIcon,
  button,
  container,
  grid,
  heading,
  icon,
  image,
  inlineContainer,
  inlineText,
  link,
  text,
} from "./primitives";
import { accordion, checkMark, listRowMotion, step, tilt } from "./widgets";

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
  /** Space between the heading and the content under it. */
  contentGap?: number;
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
    { gap: gap(opts.contentGap ?? 4) },
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
  kicker?: string;
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
  integrations: string[];
  integrationsHref: string;
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
  faqKicker: string;
  faqTitleLead: string;
  faqTitleEm: string;
  faqs: { q: string; a: string }[];
  ctaKicker: string;
  ctaTitleLead: string;
  ctaTitleEm: string;
  ctaBody: string;
  ctaLabel: string;
};

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
            { gap: gap(0.35), alignItems: sv("center"), textAlign: sv("left") },
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
      serifTitle(
        "h1",
        input.titleLead,
        input.titleEm,
        heroTitleSize,
        C.accentFg,
        "center",
      ),
      text(input.body, {
        color: sv(C.mutedFg),
        fontSize: size(0.95),
        lineHeight: sv({ value: 1.7, unit: "" }),
        textAlign: sv("center"),
        maxWidth: size(36, "rem"),
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
          justifyContent: sv("center"),
          alignItems: sv("center"),
          gap: gap(1.25),
          width: size(100, "%"),
        },
      ),
      inlineContainer(
        [
          checkMark(0.9),
          inlineText(input.note, {
            fontFamily: sv("TERTIARY"),
            fontSize: size(0.625),
            color: sv(C.mutedFg),
            textAlign: sv("center"),
          }),
        ],
        {
          gap: gap(0.4),
          flexWrap: sv("wrap"),
          justifyContent: sv("center"),
        },
      ),
      inlineText(input.industries.join(" · "), {
        fontFamily: sv("TERTIARY"),
        fontSize: size(0.625),
        textTransform: sv("uppercase"),
        letterSpacing: sv({ value: 0.04, unit: "rem" }),
        textAlign: sv("center"),
        color: sv(C.mutedFg),
      }),
    ],
    {
      gap: gap(1.35),
      alignItems: sv("center"),
      textAlign: sv("center"),
      maxWidth: size(46, "rem"),
      width: size(100, "%"),
      margin: autoMargin,
    },
  );

  return withId(
    block("PageHero", {
      style: {
        padding: [
          ...pad(4.5, 1.5, 4.5, 1.5),
          {
            value: {
              top: { value: 7, unit: "vw" },
              right: { value: 5.5, unit: "vw" },
              bottom: { value: 7, unit: "vw" },
              left: { value: 5.5, unit: "vw" },
            },
            breakpoint: ["md"],
          },
        ],
        display: sv("flex"),
        flexDirection: sv("column"),
        alignItems: sv("center"),
        backgroundColor: sv(C.background),
        width: size(100, "%"),
      },
      props: {
        title: { children: [copy] },
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

function productCard(feature: EditorialBits, index: number) {
  const external = /^https?:\/\//.test(feature.href);
  const children: unknown[] = [];
  if (feature.kicker) {
    children.push(kicker(feature.kicker));
  }

  children.push(
    heading("h3", feature.title, {
      fontSize: size(1.125),
      fontWeight: sv("500"),
      letterSpacing: sv({ value: -0.03, unit: "rem" }),
    }),
    text(feature.body, {
      color: sv(C.mutedFg),
      fontSize: size(0.8125),
      lineHeight: sv({ value: 1.55, unit: "" }),
    }),
  );
  return block("Link", {
    props: {
      url: feature.href,
      target: external ? "_blank" : "_self",
      children,
    },
    style: {
      display: sv("flex"),
      flexDirection: sv("column"),
      gap: gap(0.45),
      height: size(100, "%"),
      padding: pad(1, 1.05, 1.05, 1.05),
      backgroundColor: sv(C.card),
      borderStyle: sv("solid"),
      borderWidth: size(1, "px"),
      borderColor: sv(C.border),
      borderRadius: radius(12),
      textDecoration: sv("none"),
      color: sv(C.foreground),
      boxShadow: [
        {
          value: {
            x: 0,
            y: 14,
            blur: 36,
            spread: -18,
            color: C.foreground,
            inset: false,
          },
        },
      ],
      ...tilt(index),
    },
  });
}

function productGrid(features: EditorialBits[]) {
  return grid(
    features.map((feature, index) => productCard(feature, index)),
    "1fr 1fr",
    {
      gap: gap(0.75),
      alignItems: sv("stretch"),
      width: size(100, "%"),
      gridTemplateColumns: [
        { value: "1fr" },
        { value: "1fr 1fr", breakpoint: ["md"] },
      ],
    },
  );
}

function templateCarousel(
  images: { src: string; alt: string }[],
  href: string,
) {
  return block("Carousel", {
    style: {
      width: size(100, "%"),
      // padding: pad(2, 0, 2, 0),
      carouselChildrenItemsPerSlide: [{ value: 1 }],
      // Repeated class outranks the items-per-slide flex-basis rule.
      flexBasis: [
        {
          value: 55,
          state: [
            {
              state: "default" as const,
              target: {
                type: "selector" as const,
                data: {
                  stateType: "selector" as const,
                  selector: ".carousel-item.carousel-item",
                },
              },
            },
          ],
        },
      ],
      padding: [
        {
          value: {
            top: { value: 2, unit: "rem" },
            right: { value: 0, unit: "rem" },
            bottom: { value: 2, unit: "rem" },
            left: { value: 0, unit: "rem" },
          },
        },
        {
          value: {
            top: { value: 2, unit: "rem" },
            right: { value: 0, unit: "rem" },
            bottom: { value: 2, unit: "rem" },
            left: { value: 0, unit: "rem" },
          },
          breakpoint: ["md"],
          state: {
            state: "default" as const,
            target: {
              type: "selector" as const,
              data: {
                stateType: "selector" as const,
                selector: ".carousel-content-container",
              },
            },
          },
        },
      ],
    },
    props: {
      orientation: "horizontal",
      navigation: false,
      loop: true,
      scale: true,
      autoPlay: 4,
      align: "center",
      startIndex: Math.floor((images.length - 1) / 2),
      children: images.map((shot) =>
        image(
          shot.src,
          shot.alt,
          {
            height: [
              { value: { value: 16, unit: "rem" } },
              { value: { value: 24, unit: "rem" }, breakpoint: ["md"] },
            ],
            objectFit: sv("cover"),
            objectPosition: [{ value: { x: 50, y: 0 } }],
            borderRadius: radius(16),
            width: size(100, "%"),
          },
          href,
        ),
      ),
    },
  });
}

function templateShowcase(input: EditorialHomeInput) {
  const templates = input.templates;
  return container(
    [
      split({
        kicker: templates.kicker,
        titleLead: templates.titleLead,
        titleEm: templates.titleEm,
        body: templates.body,
        link: { href: templates.href, label: templates.cta },
        contentGap: 1.5,
      }),
      templateCarousel(templates.images, templates.href),
    ],
    { width: size(100, "%"), gap: gap(1.5) },
  );
}

function closing(input: EditorialHomeInput) {
  return withId(
    container(
      [
        ctaSpark(),
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
        position: sv("relative"),
        gap: gap(0),
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
      kicker: input.featuresKicker,
      titleLead: input.featuresTitleLead,
      titleEm: input.featuresTitleEm,
      body: input.featuresBody,
      link: { href: "/features", label: "All features" },
      contentGap: 2,
      after: [productGrid(input.features)],
    }),
    templateShowcase(input),
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
      id: "use-cases",
      kicker: input.audienceKicker,
      titleLead: input.audienceTitleLead,
      titleEm: input.audienceTitleEm,
      body: input.audienceBody,
      after: [detailRows(input.audiences)],
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
        container(
          [
            kicker(input.faqKicker),
            serifTitle("h2", input.faqTitleLead, input.faqTitleEm, titleSize),
          ],
          { gap: gap(1.5) },
        ),
        accordion(input.faqs),
      ],
      "questions",
    ),
    closing(input),
  ];

  return { before, after };
}
