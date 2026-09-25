/** Text, layout, and button primitives. */
import {
  assetUrl,
  bid,
  block,
  C,
  emptyPad,
  gap,
  pad,
  radius,
  size,
  sv,
} from "./core";

export function inlineText(text: string, style: Record<string, unknown> = {}) {
  return block("InlineText", {
    props: { text },
    style,
  });
}

export function inlineContainer(
  children: unknown[],
  style: Record<string, unknown> = {},
) {
  return block("InlineContainer", {
    style: {
      padding: emptyPad,
      display: sv("inline-flex"),
      flexDirection: sv("row"),
      alignItems: sv("center"),
      ...style,
    },
    props: { children },
  });
}

export function heading(
  level: "h1" | "h2" | "h3" | "h4",
  text: string,
  style: Record<string, unknown> = {},
  additionalChildren: unknown[] = [],
  inlineContainerStyle: Record<string, unknown> = {},
) {
  return block("Heading", {
    props: {
      level,
      children: [
        inlineContainer(
          [inlineText(text), ...additionalChildren],
          inlineContainerStyle,
        ),
      ],
    },
    style: {
      fontFamily: sv("SECONDARY"),
      fontWeight: sv(level === "h1" ? "500" : "400"),
      textAlign: sv("left"),
      ...style,
    },
  });
}

export function text(body: string, style: Record<string, unknown> = {}) {
  return block("Text", {
    props: {
      value: [{ type: "p", children: [{ text: body }] }],
    },
    style: {
      padding: emptyPad,
      fontSize: size(1),
      ...style,
    },
  });
}

export function texts(
  paragraphs: string[],
  style: Record<string, unknown> = {},
) {
  return block("Text", {
    props: {
      value: paragraphs.map((p) => ({ type: "p", children: [{ text: p }] })),
    },
    style: {
      padding: emptyPad,
      fontSize: size(1),
      ...style,
    },
  });
}

export function icon(name: string, style: Record<string, unknown> = {}) {
  return block("Icon", {
    props: { icon: name },
    style: {
      display: sv("inline-block"),
      width: size(1),
      height: size(1),
      fill: sv("transparent"),
      flexShrink: sv("0"),
      ...style,
    },
  });
}

export function spacer(heightRem = 1) {
  return block("Spacer", {
    style: {
      height: size(heightRem),
      display: sv("block"),
    },
    props: {},
  });
}

export function container(
  children: unknown[],
  style: Record<string, unknown> = {},
) {
  return block("Container", {
    style: {
      padding: emptyPad,
      display: sv("flex"),
      flexDirection: sv("column"),
      width: size(100, "%"),
      gap: gap(0.5),
      ...style,
    },
    props: { children },
  });
}

export function grid(
  children: unknown[],
  columns: string,
  style: Record<string, unknown> = {},
) {
  return block("GridContainer", {
    style: {
      padding: emptyPad,
      display: sv("grid"),
      gridTemplateColumns: [
        { value: "1fr" },
        { value: columns, breakpoint: ["sm"] },
      ],
      gap: gap(1),
      width: size(100, "%"),
      ...style,
    },
    props: { children },
  });
}

export function button(
  label: string,
  url: string,
  variant: "primary" | "outline" | "brand" = "primary",
  textColor?: string,
  style: Record<string, unknown> = {},
) {
  const isExternal = /^https?:\/\//.test(url) || url.startsWith("mailto:");
  return block("Button", {
    props: {
      type: "link",
      url,
      target: isExternal ? "_blank" : "_self",
      children: [inlineContainer([inlineText(label)])],
    },
    style: {
      color: sv(
        textColor ??
          (variant === "primary" || variant === "brand"
            ? C.primaryFg
            : C.foreground),
      ),
      backgroundColor: sv(
        variant === "primary"
          ? C.primary
          : variant === "brand"
            ? C.brand
            : "transparent",
      ),
      padding: pad(0.75, 1.5, 0.75, 1.5),
      borderRadius: radius(8),
      borderStyle: variant === "outline" ? sv("solid") : undefined,
      borderWidth: variant === "outline" ? size(1, "px") : undefined,
      borderColor: variant === "outline" ? sv(C.border) : undefined,
      fontWeight: sv("600"),
      fontSize: size(0.875),
      textAlign: sv("center"),
      ...style,
    },
  });
}

/** Action button (e.g. close-current-banner). */
export function actionButton(
  label: string,
  action: string,
  variant: "primary" | "outline" | "brand" = "primary",
) {
  return block("Button", {
    props: {
      type: "action",
      action,
      children: [inlineContainer([inlineText(label)])],
    },
    style: {
      color: sv(
        variant === "primary" || variant === "brand"
          ? C.primaryFg
          : C.foreground,
      ),
      backgroundColor: sv(
        variant === "primary"
          ? C.primary
          : variant === "brand"
            ? C.brand
            : "transparent",
      ),
      padding: pad(0.5, 1, 0.5, 1),
      borderRadius: radius(8),
      borderStyle: variant === "outline" ? sv("solid") : undefined,
      borderWidth: variant === "outline" ? size(1, "px") : undefined,
      borderColor: variant === "outline" ? sv(C.border) : undefined,
      fontWeight: sv("600"),
      fontSize: size(0.875),
      textAlign: sv("center"),
      flexShrink: sv("0"),
    },
  });
}

/**
 * One-time bottom StickyBanner for cookie acknowledgment.
 * Put in the footer so every page inherits it.
 */
export function cookieAcknowledgmentBanner(
  opts: {
    message?: string;
    buttonLabel?: string;
  } = {},
) {
  const message =
    opts.message ??
    "We use cookies and similar technologies to run the site and understand how visitors use it.";
  const buttonLabel = opts.buttonLabel ?? "Got it";

  return block("StickyBanner", {
    style: {
      width: size(100, "%"),
      backgroundColor: sv(C.muted),
      boxShadow: [
        {
          value: {
            x: 0,
            y: 8,
            blur: 0,
            spread: 0,
            color: C.foreground,
            inset: false,
          },
        },
      ],
      padding: pad(0, 0, 0, 0),
    },
    props: {
      show: "one-time",
      position: "bottom",
      showCloseButton: true,
      content: {
        children: [
          container(
            [
              container(
                [
                  text(message, {
                    fontSize: size(0.875),
                    fontWeight: sv("500"),
                    color: sv(C.foreground),
                  }),
                  link("Privacy policy", "/privacy", {
                    fontSize: size(0.875),
                    fontWeight: sv("600"),
                    color: sv(C.foreground),
                    textDecoration: sv("underline"),
                  }),
                ],
                {
                  gap: gap(0.35),
                  flexGrow: sv(1),
                  width: size(100, "%"),
                },
              ),
              actionButton(buttonLabel, "close-current-banner", "primary"),
            ],
            {
              display: sv("flex"),
              flexDirection: [
                { value: "column" },
                { value: "row", breakpoint: ["sm"] },
              ],
              alignItems: [
                { value: "stretch" },
                { value: "center", breakpoint: ["sm"] },
              ],
              justifyContent: sv("space-between"),
              gap: gap(1),
              width: size(100, "%"),
              padding: pad(1, 1.5, 1, 1.5),
            },
          ),
        ],
      },
    },
  });
}

export function link(
  label: string,
  url: string,
  style: Record<string, unknown> = {},
) {
  const isExternal = /^https?:\/\//.test(url) || url.startsWith("mailto:");
  return block("Link", {
    props: {
      url,
      target: isExternal ? "_blank" : "_self",
      children: [inlineText(label)],
    },
    style: {
      color: sv(C.mutedFg),
      fontSize: size(0.875),
      ...style,
    },
  });
}

export function image(
  src: string,
  alt = "",
  style: Record<string, unknown> = {},
  linkHref?: string | null,
) {
  return block("Image", {
    props: { src: assetUrl(src), alt, linkHref: linkHref ?? null },
    style: {
      objectFit: sv("cover"),
      objectPosition: [{ value: { x: 50, y: 50 } }],
      width: size(100, "%"),
      maxWidth: size(100, "%"),
      display: sv("block"),
      borderRadius: radius(16),
      ...style,
    },
  });
}

/** Self-hosted mp4 (seed uploads like images). Autoplay loops are muted. */
