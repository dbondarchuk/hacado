/** Section chrome and page wrappers. */
import { bid, block, C, gap, pad, size, sv } from "./core";
import {
  container,
  heading,
  icon,
  inlineContainer,
  inlineText,
  text,
} from "./primitives";

export function slot(children: unknown[], style: Record<string, unknown> = {}) {
  return { id: bid(), style, children };
}

export function section(
  children: unknown[],
  style: Record<string, unknown> = {},
) {
  return container(children, {
    padding: pad(2, 1.5, 2, 1.5),
    maxWidth: size(72, "rem"),
    margin: sv({
      top: { value: 0, unit: "rem" },
      bottom: { value: 0, unit: "rem" },
      left: "auto",
      right: "auto",
    }),
    gap: gap(0.5),
    ...style,
  });
}

export function badge(label: string) {
  return inlineContainer([inlineText(label, { fontWeight: sv("600") })], {
    display: sv("inline-flex"),
    padding: pad(0.4, 1, 0.4, 1),
    backgroundColor: sv(C.primary),
    color: sv(C.primaryFg),
    borderRadius: sv({ value: 1.25, unit: "rem" }),
    fontSize: size(0.875),
    width: [{ value: "max-content" }],
  });
}


export function sectionIntro(opts: {
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  const children: unknown[] = [];
  if (opts.eyebrow) {
    children.push(
      inlineText(opts.eyebrow, {
        fontFamily: sv("TERTIARY"),
        fontSize: size(0.6875),
        fontWeight: sv("500"),
        color: sv(C.mutedFg),
        textTransform: sv("uppercase"),
        letterSpacing: sv({ value: 0.08, unit: "em" }),
      }),
    );
  }
  children.push(
    heading("h2", opts.title, {
      fontSize: [
        { value: { value: 2, unit: "rem" } },
        { value: { value: 2.75, unit: "rem" }, breakpoint: ["md"] },
      ],
      fontWeight: sv("500"),
    }),
  );
  if (opts.body) {
    children.push(text(opts.body, { color: sv(C.mutedFg) }));
  }
  return container(children, {
    alignItems: sv("flex-start"),
    gap: gap(0.75),
    padding: pad(0, 0, 1.5, 0),
    maxWidth: size(40, "rem"),
  });
}


export function banner(message: string) {
  return container(
    [
      icon("megaphone", {
        width: size(1.25),
        height: size(1.25),
        fill: sv("currentColor"),
      }),
      inlineText(message, { fontSize: size(0.875), fontWeight: sv("500") }),
    ],
    {
      display: sv("flex"),
      flexDirection: sv("row"),
      alignItems: sv("center"),
      justifyContent: sv("center"),
      gap: gap(0.75),
      padding: pad(0.75, 1.25, 0.75, 1.25),
      backgroundColor: sv(C.primary),
      color: sv(C.primaryFg),
      width: size(100, "%"),
    },
  );
}


export function redirect(url: string, permanent = true) {
  return block("Redirect", {
    props: { url, permanent },
  });
}

export function customHtml(
  html: string,
  style: Record<string, unknown> = {},
) {
  return block("CustomHTML", {
    props: { html },
    style: { width: size(100, "%"), ...style },
  });
}

/** Four-point star from the editorial closing band, pinned to the upper right. */
export function ctaSpark() {
  return customHtml(
    `<div class="final-orbit" aria-hidden="true"><svg viewBox="0 0 100 100" width="50" height="50" fill="currentColor"><path d="M50 2 58 42 98 50 58 58 50 98 42 58 2 50 42 42Z"/></svg></div><style>.final-orbit{position:absolute;right:14%;top:22%;color:#a4b19c;transform:rotate(25deg);line-height:0;pointer-events:none;}</style>`,
    {
      width: size(0),
      height: size(0),
      overflow: sv("visible"),
    },
  );
}

/** Forms app block - requires the Forms connected app on the org. */
export function formsForm(opts: {
  formId: string;
  formsAppId: string;
  style?: Record<string, unknown>;
}) {
  return block(
    "Form",
    {
      props: { formId: opts.formId },
      style: {
        padding: pad(1, 1.5, 1, 1.5),
        display: sv("flex"),
        flexDirection: sv("column"),
        width: size(100, "%"),
        gap: gap(0.5),
        ...opts.style,
      },
    },
    { formsAppId: opts.formsAppId },
  );
}

export function pageContent(children: unknown[]) {
  return {
    data: {
      fontFamily: "PRIMARY",
      fullWidth: true,
      children,
    },
    id: bid(),
    type: "PageLayout",
  };
}

export function pageDoc(opts: {
  title: string;
  slug: string;
  description: string;
  keywords: string;
  children: unknown[];
  /** Page-header name to attach at seed time (default: Main Header). */
  headerName?: string;
  doNotCombine?: {
    title?: boolean;
    description?: boolean;
    keywords?: boolean;
  };
}) {
  return {
    title: opts.title,
    slug: opts.slug,
    description: opts.description.slice(0, 1024),
    keywords: opts.keywords.slice(0, 1024),
    published: true,
    fullWidth: true,
    ...(opts.headerName ? { headerName: opts.headerName } : {}),
    ...(opts.doNotCombine ? { doNotCombine: opts.doNotCombine } : {}),
    content: pageContent(opts.children),
  };
}
