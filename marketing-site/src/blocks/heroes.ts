/** Page and home heroes, CTA bands, template browse. */
import {
  C,
  SIGNIN_URL,
  SIGNUP_URL,
  TEMPLATE_PREVIEWS_URL,
  assetUrl,
  bid,
  block,
  gap,
  heroHeadingFontSize,
  pad,
  radius,
  size,
  sv,
} from "./core";
import {
  button,
  container,
  grid,
  heading,
  image,
  inlineContainer,
  inlineText,
  text,
} from "./primitives";
import { badge, section } from "./layout";
import { browserCarousel } from "./media";

function typewriter(phrases: string[], style: Record<string, unknown> = {}) {
  return block("TypewriterText", {
    style: {
      fontFamily: sv("SECONDARY"),
      fontSize: heroHeadingFontSize,
      color: sv(C.primary),
      ...style,
    },
    props: {
      phrases: phrases.map((text) => ({ id: bid(), text })),
      typeDelayMs: 90,
      deleteDelayMs: 50,
      pauseAfterPhraseMs: 1800,
      showCursor: true,
    },
  });
}

export function pageHero(opts: {
  title: string | unknown;
  body?: string;
  eyebrow?: string;
  image?: string;
  /** Autoplaying muted loop behind the hero (uses PageHero backgroundVideo). */
  video?: string;
  poster?: string;
  overlay?: boolean;
  buttons?: unknown[];
}) {
  const headingBlock =
    typeof opts.title === "string"
      ? heading("h1", opts.title, {
          fontSize: heroHeadingFontSize,
          textAlign: sv("left"),
          maxWidth: size(42, "rem"),
          fontWeight: sv("500"),
        })
      : opts.title;

  const titleChild = opts.eyebrow
    ? container([badge(opts.eyebrow), headingBlock], {
        alignItems: sv("flex-start"),
        gap: gap(1),
        maxWidth: size(42, "rem"),
      })
    : headingBlock;

  const hasMedia = Boolean(opts.video || opts.image);
  const overlayOpacity = opts.overlay ? 80 : 20;
  const poster = opts.poster ?? opts.image;

  return block("PageHero", {
    style: {
      // Media heroes sit under a fixed overlay header - give mobile more top inset.
      padding: hasMedia
        ? [
            {
              value: {
                top: { value: 5.5, unit: "rem" },
                right: { value: 1.5, unit: "rem" },
                bottom: { value: 4, unit: "rem" },
                left: { value: 1.5, unit: "rem" },
              },
            },
            {
              value: {
                top: { value: 8, unit: "vw" },
                right: { value: 6, unit: "vw" },
                bottom: { value: 8, unit: "vw" },
                left: { value: 6, unit: "vw" },
              },
              breakpoint: ["md"],
            },
          ]
        : pad(8, 6, 8, 6, "vw"),
      display: sv("flex"),
      flexDirection: sv("column"),
      alignItems: sv("flex-start"),
      justifyContent: sv("flex-start"),
      textAlign: sv("left"),
      gap: gap(1.5),
      backgroundColor: sv(hasMedia ? C.foreground : C.background),
      ...(opts.video
        ? {
            backgroundVideo: [
              {
                value: {
                  src: assetUrl(opts.video),
                  ...(poster ? { poster: assetUrl(poster) } : {}),
                },
              },
            ],
            backgroundColorOpacity: [{ value: overlayOpacity }],
            color: sv(C.primaryFg),
          }
        : opts.image
          ? {
              backgroundImage: [
                { value: { type: "url", value: assetUrl(opts.image) } },
              ],
              backgroundSize: sv("cover"),
              backgroundRepeat: sv("no-repeat"),
              backgroundPosition: sv("center"),
              backgroundBlendMode: sv("overlay"),
              backgroundColorOpacity: [{ value: overlayOpacity }],
              color: sv(C.primaryFg),
            }
          : {}),
    },
    props: {
      title: { children: [titleChild] },
      subtitle: {
        children: opts.body
          ? [
              text(opts.body, {
                fontSize: size(1.125),
                textAlign: sv("left"),
                color: sv(hasMedia && opts.overlay ? C.primaryFg : C.mutedFg),
                maxWidth: size(42, "rem"),
              }),
            ]
          : [],
      },
      buttons: {
        children: opts.buttons?.length
          ? [
              container(opts.buttons, {
                display: sv("flex"),
                flexDirection: [
                  { value: "column" },
                  { value: "row", breakpoint: ["sm"] },
                ],
                justifyContent: sv("flex-start"),
                alignItems: [
                  { value: "stretch" },
                  { value: "flex-start", breakpoint: ["sm"] },
                ],
                gap: gap(1),
                width: size(100, "%"),
                maxWidth: size(42, "rem"),
              }),
            ]
          : [],
      },
    },
  });
}

/** Full width on mobile; hug content from sm up. */
export const ctaButtonWidth = [
  { value: { value: 100, unit: "%" } },
  { value: "max-content", breakpoint: ["sm"] },
];

/**
 * Primary signup CTA. Pass `includeLogin: true` only for the home hero.
 */
export function ctaButtons(
  outlineTextColor: string = C.primary,
  opts: { includeLogin?: boolean } = {},
) {
  const start = button(
    "Start accepting bookings",
    SIGNUP_URL,
    "brand",
    undefined,
    { width: ctaButtonWidth },
  );
  if (!opts.includeLogin) {
    return [start];
  }

  return [
    start,
    button("Log in", SIGNIN_URL, "outline", outlineTextColor, {
      width: ctaButtonWidth,
    }),
  ];
}

const heroColWidth = [
  { value: { value: 100, unit: "%" } },
  { value: { value: 50, unit: "%" }, breakpoint: ["md"] },
];

export function homeHero(opts: {
  eyebrow: string;
  titleBefore: string;
  phrases: string[];
  body: string;
  note?: string;
  slides: { id: string; label: string; src: string; address: string }[];
}) {
  const copy = container(
    [
      badge(opts.eyebrow),
      heading(
        "h1",
        opts.titleBefore,
        {
          fontSize: heroHeadingFontSize,
          textAlign: sv("left"),
          fontWeight: sv("500"),
        },
        [
          typewriter(opts.phrases, {
            margin: sv({
              top: "auto",
              bottom: "auto",
              left: { value: 0.5, unit: "rem" },
              right: "auto",
            }),
          }),
        ],
        {
          display: sv("inline-block"),
        },
      ),
      text(opts.body, {
        fontSize: size(1.125),
        textAlign: sv("left"),
        color: sv(C.mutedFg),
      }),
      ...(opts.note
        ? [
            text(opts.note, {
              fontSize: size(0.875),
              textAlign: sv("left"),
              color: sv(C.mutedFg),
            }),
          ]
        : []),
      container(ctaButtons(C.foreground, { includeLogin: true }), {
        display: sv("flex"),
        flexDirection: [
          { value: "column" },
          { value: "row", breakpoint: ["sm"] },
        ],
        justifyContent: sv("flex-start"),
        alignItems: [
          { value: "stretch" },
          { value: "flex-start", breakpoint: ["sm"] },
        ],
        gap: gap(1),
        width: size(100, "%"),
      }),
    ],
    {
      width: heroColWidth,
      alignItems: sv("flex-start"),
      gap: gap(1),
      flexShrink: sv("0"),
    },
  );

  const media = container([browserCarousel(opts.slides)], {
    width: heroColWidth,
    flexShrink: sv("0"),
  });

  return section(
    [
      container([copy, media], {
        display: sv("flex"),
        flexDirection: [
          { value: "column" },
          { value: "row", breakpoint: ["md"] },
        ],
        alignItems: [
          { value: "stretch" },
          { value: "center", breakpoint: ["md"] },
        ],
        gap: gap(2.5),
      }),
    ],
    {
      padding: [
        {
          value: {
            top: { value: 3.5, unit: "rem" },
            bottom: { value: 3.5, unit: "rem" },
            left: { value: 1.5, unit: "rem" },
            right: { value: 1.5, unit: "rem" },
          },
        },
        {
          value: {
            top: { value: 5, unit: "rem" },
            bottom: { value: 5, unit: "rem" },
            left: { value: 1.5, unit: "rem" },
            right: { value: 1.5, unit: "rem" },
          },
          breakpoint: ["lg"],
        },
      ],
    },
  );
}


export function ctaBand(title: string, body: string) {
  return section(
    [
      container(
        [
          heading("h2", title, {
            fontSize: size(2.25),
            textAlign: sv("center"),
            color: sv(C.primaryFg),
          }),
          text(body, { textAlign: sv("center"), color: sv(C.primaryFg) }),
          container(ctaButtons(C.primaryFg), {
            display: sv("flex"),
            flexDirection: [
              { value: "column" },
              { value: "row", breakpoint: ["sm"] },
            ],
            justifyContent: sv("center"),
            alignItems: [
              { value: "stretch" },
              { value: "center", breakpoint: ["sm"] },
            ],
            gap: gap(1),
            width: size(100, "%"),
            maxWidth: size(24, "rem"),
          }),
        ],
        {
          alignItems: sv("center"),
          textAlign: sv("center"),
          gap: gap(1),
          padding: pad(3, 2, 3, 2),
          backgroundColor: sv(C.primary),
          borderRadius: radius(16),
          color: sv(C.primaryFg),
        },
      ),
    ],
    { padding: pad(4, 1.5, 4, 1.5) },
  );
}

/** Prominent CTA to the public website template gallery. */
export function templatesBrowseSection(
  opts: {
    eyebrow?: string;
    title?: string;
    body?: string;
    /** When true, use a filled primary panel (home). Default is card-style. */
    emphasis?: "band" | "card";
  } = {},
) {
  const eyebrow = opts.eyebrow ?? "Templates";
  const title = opts.title ?? "See how your site could look";
  const body =
    opts.body ??
    "Browse ready-made booking websites for nails, hair, lashes, spas, coaches, and more. Open a full demo and click through pages the way your clients will - then start with one that fits.";
  const previews = [
    {
      src: "/assets/templates/nails-home.png",
      alt: "Nail studio website template",
    },
    {
      src: "/assets/templates/lash-home.png",
      alt: "Lash studio website template",
    },
    {
      src: "/assets/templates/salon-home.png",
      alt: "Salon website template",
    },
  ];

  const cta = button(
    "Browse website templates",
    TEMPLATE_PREVIEWS_URL,
    opts.emphasis === "band" ? "brand" : "primary",
    opts.emphasis === "band" ? C.primaryFg : undefined,
    { width: ctaButtonWidth },
  );

  const copy = container(
    [
      badge(eyebrow),
      heading("h2", title, {
        fontSize: size(2.25),
        textAlign: sv("center"),
        ...(opts.emphasis === "band" ? { color: sv(C.primaryFg) } : {}),
      }),
      text(body, {
        textAlign: sv("center"),
        maxWidth: size(40, "rem"),
        color: sv(opts.emphasis === "band" ? C.primaryFg : C.mutedFg),
      }),
      container([cta], {
        display: sv("flex"),
        justifyContent: sv("center"),
        alignItems: [
          { value: "stretch" },
          { value: "center", breakpoint: ["sm"] },
        ],
        width: size(100, "%"),
        maxWidth: size(24, "rem"),
      }),
    ],
    {
      alignItems: sv("center"),
      textAlign: sv("center"),
      gap: gap(1),
      width: size(100, "%"),
    },
  );

  const thumbs = grid(
    previews.map((p) =>
      image(
        p.src,
        p.alt,
        {
          height: size(11),
          borderRadius: radius(12),
          borderStyle: sv("solid"),
          borderWidth: size(1, "px"),
          borderColor: sv(
            opts.emphasis === "band" ? "transparent" : C.border,
          ),
        },
        TEMPLATE_PREVIEWS_URL,
      ),
    ),
    "repeat(3, minmax(0, 1fr))",
    {
      gap: gap(1),
      width: size(100, "%"),
      gridTemplateColumns: [
        { value: "1fr" },
        { value: "repeat(3, minmax(0, 1fr))", breakpoint: ["md"] },
      ],
    },
  );

  if (opts.emphasis === "band") {
    return section(
      [
        container([copy, thumbs], {
          alignItems: sv("center"),
          gap: gap(2),
          padding: pad(3, 2, 3, 2),
          backgroundColor: sv(C.primary),
          borderRadius: radius(16),
          color: sv(C.primaryFg),
          width: size(100, "%"),
        }),
      ],
      { padding: pad(4, 1.5, 4, 1.5), alignItems: sv("center") },
    );
  }

  return section(
    [
      container([copy, thumbs], {
        alignItems: sv("center"),
        gap: gap(2),
        padding: pad(2.5, 1.5, 2.5, 1.5),
        backgroundColor: sv(C.card),
        borderRadius: radius(16),
        borderStyle: sv("solid"),
        borderWidth: size(1, "px"),
        borderColor: sv(C.border),
        width: size(100, "%"),
      }),
    ],
    { padding: pad(2, 1.5, 2, 1.5), alignItems: sv("center") },
  );
}
