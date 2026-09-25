/** Marketing composites: plans, FAQ, tables, feature cards, etc. */
import {
  C,
  DOCS_URL,
  SIGNUP_URL,
  assetUrl,
  block,
  emptyPad,
  gap,
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
  icon,
  image,
  inlineContainer,
  inlineText,
  link,
  text,
} from "./primitives";
import { customHtml, section, slot } from "./layout";

export function statCell(value: string, label: string) {
  return container(
    [
      heading("h2", value, { fontSize: size(2.25), textAlign: sv("center") }),
      inlineText(label, { textAlign: sv("center"), color: sv(C.mutedFg) }),
    ],
    {
      alignItems: sv("center"),
      textAlign: sv("center"),
      padding: pad(1.5, 1.5, 1.5, 1.5),
      borderRadius: radius(16),
      borderStyle: sv("solid"),
      borderWidth: size(1, "px"),
      borderColor: sv(C.border),
      backgroundColor: sv(C.card),
      gap: gap(0.5),
    },
  );
}

export function step(n: string, title: string, body: string) {
  return container(
    [
      inlineText(n, {
        fontWeight: sv("400"),
        fontSize: size(1.875),
        color: sv(C.brand),
      }),
      heading("h3", title, { fontSize: size(1.25) }),
      text(body, { color: sv(C.mutedFg) }),
    ],
    {
      gap: gap(0.5),
      backgroundColor: sv(C.card),
      borderRadius: radius(16),
      borderStyle: sv("solid"),
      borderWidth: size(1, "px"),
      borderColor: sv(C.border),
      padding: pad(1.5, 1.5, 1.5, 1.5),
    },
  );
}

export function testimonialCard(opts: {
  quote: string;
  name: string;
  role: string;
  image?: string;
  url?: string;
}) {
  const children: unknown[] = [];
  if (opts.image) {
    children.push(
      image(opts.image, opts.name, {
        width: size(4),
        height: size(4),
        borderRadius: sv({ value: 999, unit: "px" }),
      }),
    );
  }
  children.push(text(`“${opts.quote}”`));
  children.push(inlineText(opts.name, { fontWeight: sv("600") }));
  if (opts.url) {
    children.push(link(opts.role, opts.url, { color: sv(C.primary) }));
  } else {
    children.push(
      inlineText(opts.role, { color: sv(C.mutedFg), fontSize: size(0.875) }),
    );
  }
  return container(children, {
    padding: pad(1.5, 1.5, 1.5, 1.5),
    borderRadius: radius(16),
    borderStyle: sv("solid"),
    borderWidth: size(1, "px"),
    borderColor: sv(C.border),
    backgroundColor: sv(C.card),
    gap: gap(0.75),
    maxWidth: size(40, "rem"),
    margin: sv({
      top: { value: 0, unit: "rem" },
      bottom: { value: 0, unit: "rem" },
      left: "auto",
      right: "auto",
    }),
  });
}

export function planCard(opts: {
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
}) {
  const children: unknown[] = [];
  if (opts.badge) {
    children.push(
      inlineContainer(
        [
          inlineText(opts.badge, {
            fontSize: size(11, "px"),
            fontWeight: sv("700"),
            textTransform: sv("uppercase"),
            letterSpacing: sv({ value: 0.025, unit: "rem" }),
            color: sv(C.primaryFg),
            whiteSpace: sv("nowrap"),
          }),
        ],
        {
          position: sv("absolute"),
          inset: sv({
            top: { value: -0.75, unit: "rem" },
            left: { value: 1.5, unit: "rem" },
          }),
          zIndex: sv(1),
          padding: pad(0.125, 0.5, 0.125, 0.5),
          borderRadius: radius(10),
          backgroundColor: sv(C.primary),
          width: [{ value: "max-content" }],
        },
      ),
    );
  }
  children.push(heading("h3", opts.name, { fontSize: size(1.5) }));
  children.push(
    inlineText(opts.subtitle, { color: sv(C.mutedFg), fontSize: size(0.875) }),
  );
  children.push(
    inlineText(`${opts.price}${opts.period}`, {
      fontSize: size(1.75),
      fontWeight: sv("700"),
    }),
  );
  children.push(
    inlineText(opts.footnote, { fontSize: size(0.875), color: sv(C.mutedFg) }),
  );
  if (opts.includes)
    children.push(text(opts.includes, { fontWeight: sv("600") }));
  children.push(
    container(
      opts.benefits.map((b) =>
        inlineContainer(
          [checkMark(1), inlineText(b, { fontSize: size(0.875) })],
          { gap: gap(0.5), alignItems: sv("flex-start") },
        ),
      ),
      { gap: gap(0.5), flexGrow: sv("1") },
    ),
  );
  children.push(
    button(opts.cta, SIGNUP_URL, opts.featured ? "primary" : "outline"),
  );
  return container(children, {
    gap: gap(0.75),
    padding: pad(2, 1.5, 2, 1.5),
    borderRadius: radius(16),
    borderStyle: sv("solid"),
    borderWidth: size(opts.featured ? 2 : 1, "px"),
    borderColor: sv(opts.featured ? C.primary : C.border),
    backgroundColor: sv(C.card),
    position: sv("relative"),
    overflow: sv("visible"),
    height: size(100, "%"),
  });
}

const px = (n: number) => ({ value: n, unit: "px" as const });

export function accordion(items: { q: string; a: string }[]) {
  return block("Accordion", {
    style: {
      textAlign: sv("left"),
      width: size(100, "%"),
      display: sv("flex"),
      flexDirection: sv("column"),
      gap: gap(0),
      backgroundColor: sv(C.white),
      borderRadius: radius(16),
    },
    props: {
      allowMultipleOpen: false,
      defaultOpenFirst: false,
      animation: "slide",
      iconPosition: "right",
      iconStyle: "plus-x",
      children: items.map((item, index, array) => {
        const isFirst = index === 0;
        const isLast = index === array.length - 1;
        return block("AccordionItem", {
          style: {
            width: size(100, "%"),
            borderStyle: sv("solid"),
            borderColor: sv(C.border),
            borderWidth: sv({
              top: px(isFirst ? 1 : 0),
              right: px(1),
              bottom: px(1),
              left: px(1),
            }),
            borderRadius: sv({
              topLeft: px(isFirst ? 16 : 0),
              topRight: px(isFirst ? 16 : 0),
              bottomRight: px(isLast ? 16 : 0),
              bottomLeft: px(isLast ? 16 : 0),
            }),
            overflow: sv("hidden"),
            padding: pad(0.75, 1, 0.75, 1),
            backgroundColor: [{ value: C.white }],
          },
          props: {
            isOpen: false,
            title: {
              children: [
                inlineContainer([
                  inlineText(item.q, { fontWeight: sv("600") }),
                ]),
              ],
            },
            content: {
              children: [container([text(item.a, { color: sv(C.mutedFg) })])],
            },
          },
        });
      }),
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function comparisonCellHtml(
  value: string,
  opts?: { checkmarks?: boolean; muted?: boolean },
) {
  if (opts?.checkmarks) {
    if (value === "yes") {
      return `<img src="${escapeHtml(assetUrl("/assets/svg/check.svg"))}" alt="Yes" width="20" height="20" />`;
    }
    if (value === "no") {
      return `<img src="${escapeHtml(assetUrl("/assets/svg/dash.svg"))}" alt="No" width="20" height="20" />`;
    }
    if (value === "partial") {
      return `<span class="hcd-cmp-table__limited">Limited</span>`;
    }
  }
  const text = escapeHtml(value);
  return opts?.muted
    ? `<span class="hcd-cmp-table__muted">${text}</span>`
    : text;
}

/** Rounded bordered comparison table matching the marketing prototype. */
export function comparisonTable(opts: {
  cornerHeader: string;
  columns: string[];
  rows: { feature: string; cells: string[] }[];
  highlightCol?: number;
  checkmarks?: boolean;
  minWidth?: string;
  stickyFirst?: boolean;
  /** Pin the highlighted vendor column while scrolling horizontally (default: with sticky first + highlightCol 0). */
  stickyHighlight?: boolean;
}) {
  const highlight = opts.highlightCol ?? -1;
  const sticky = opts.stickyFirst ?? Boolean(opts.checkmarks);
  const stickyHighlight = opts.stickyHighlight ?? (sticky && highlight === 0);
  const minWidth = opts.minWidth ?? (opts.checkmarks ? "52rem" : "0");
  const stickyLabelWidth = "9rem";
  const headers = opts.columns
    .map((col, i) => {
      const hi = i === highlight ? " hcd-cmp-table__hi" : "";
      return `<th class="${hi.trim()}">${escapeHtml(col)}</th>`;
    })
    .join("");
  const body = opts.rows
    .map((row) => {
      const cells = row.cells
        .map((cell, i) => {
          const hi = i === highlight ? " hcd-cmp-table__hi" : "";
          const muted = !opts.checkmarks && i !== highlight;
          return `<td class="${hi.trim()}">${comparisonCellHtml(cell, {
            checkmarks: opts.checkmarks,
            muted,
          })}</td>`;
        })
        .join("");
      return `<tr><th scope="row">${escapeHtml(row.feature)}</th>${cells}</tr>`;
    })
    .join("");

  const rootClass = [
    "hcd-cmp-table",
    sticky ? "hcd-cmp-table--sticky" : "",
    stickyHighlight ? "hcd-cmp-table--sticky-hi" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return customHtml(`<div class="${rootClass}">
<style>
.hcd-cmp-table{overflow-x:auto;border-radius:1rem;border:1px solid hsl(var(--value-border-color));background:hsl(var(--value-card-color));width:100%;}
.hcd-cmp-table table{width:100%;min-width:${minWidth};border-collapse:separate;border-spacing:0;font-size:.875rem;}
.hcd-cmp-table thead tr{border-bottom:1px solid hsl(var(--value-border-color));}
.hcd-cmp-table th,.hcd-cmp-table td{padding:.75rem;text-align:center;vertical-align:middle;border-bottom:1px solid hsl(var(--value-border-color));}
.hcd-cmp-table thead th{background:hsl(var(--value-muted-color));font-weight:500;}
.hcd-cmp-table thead th:first-child,.hcd-cmp-table tbody th{text-align:left;font-weight:500;}
.hcd-cmp-table tbody tr:last-child th,.hcd-cmp-table tbody tr:last-child td{border-bottom:0;}
.hcd-cmp-table--sticky thead th:first-child{position:sticky;left:0;z-index:4;min-width:${stickyLabelWidth};width:${stickyLabelWidth};background:hsl(var(--value-muted-color));}
.hcd-cmp-table--sticky tbody th{position:sticky;left:0;z-index:3;min-width:${stickyLabelWidth};width:${stickyLabelWidth};background:hsl(var(--value-card-color));}
.hcd-cmp-table thead .hcd-cmp-table__hi{background:linear-gradient(hsl(var(--value-primary-color)/.15),hsl(var(--value-primary-color)/.15)),hsl(var(--value-muted-color));color:hsl(var(--value-foreground-color));}
.hcd-cmp-table tbody .hcd-cmp-table__hi{background:linear-gradient(hsl(var(--value-primary-color)/.05),hsl(var(--value-primary-color)/.05)),hsl(var(--value-card-color));font-weight:500;}
.hcd-cmp-table--sticky-hi thead .hcd-cmp-table__hi{position:sticky;left:${stickyLabelWidth};z-index:4;min-width:4.5rem;box-shadow:4px 0 8px -4px hsl(var(--value-foreground-color)/.18);}
.hcd-cmp-table--sticky-hi tbody .hcd-cmp-table__hi{position:sticky;left:${stickyLabelWidth};z-index:3;min-width:4.5rem;box-shadow:4px 0 8px -4px hsl(var(--value-foreground-color)/.18);}
.hcd-cmp-table__limited{font-size:.75rem;color:hsl(var(--value-muted-foreground-color));}
.hcd-cmp-table__muted{color:hsl(var(--value-muted-foreground-color));}
.hcd-cmp-table img{display:block;margin:0 auto;width:1.25rem;height:1.25rem;}
</style>
<table>
<thead><tr><th>${escapeHtml(opts.cornerHeader)}</th>${headers}</tr></thead>
<tbody>${body}</tbody>
</table>
</div>`);
}

export function comparePointCard(opts: {
  title: string;
  hacadoTitle?: string;
  otherTitle?: string;
  hacado: string;
  other: string;
  competitor: string;
}) {
  const col = (
    eyebrow: string,
    headingText: string,
    body: string,
    brand = false,
  ) =>
    container(
      [
        inlineText(eyebrow, {
          fontWeight: sv("600"),
          fontSize: size(0.75),
          textTransform: sv("uppercase"),
          letterSpacing: sv({ value: 0.025, unit: "rem" }),
          color: sv(brand ? C.brand : C.mutedFg),
        }),
        heading("h3", headingText, { fontSize: size(1.25) }),
        text(body, { color: sv(C.mutedFg), fontSize: size(0.875) }),
      ],
      { gap: gap(0.5) },
    );

  return container(
    [
      grid(
        [
          col("Hacado", opts.hacadoTitle ?? opts.title, opts.hacado, true),
          col(opts.competitor, opts.otherTitle ?? opts.title, opts.other),
        ],
        "repeat(2, minmax(0, 1fr))",
        {
          gridTemplateColumns: [
            { value: "1fr" },
            {
              value: "repeat(2, minmax(0, 1fr))",
              breakpoint: ["md"],
            },
          ],
          gap: gap(1),
        },
      ),
    ],
    {
      padding: pad(1.5, 1.5, 1.5, 1.5),
      borderRadius: radius(16),
      borderStyle: sv("solid"),
      borderWidth: size(1, "px"),
      borderColor: sv(C.border),
      backgroundColor: sv(C.card),
      gap: gap(0),
    },
  );
}


const FEATURE_ICONS: Record<string, string> = {
  calendar: "calendar-days",
  clipboard: "clipboard-list",
  globe: "globe",
  card: "credit-card",
  bell: "bell",
  video: "video",
  gift: "gift",
  users: "users",
  percent: "percent",
  package: "package",
  user: "user-round",
  chart: "chart-column",
  activity: "activity",
  plus: "circle-plus",
};

export function marketingFeatureItem(opts: {
  title: string;
  summary: string;
  detailHeadline: string;
  bullets: string[];
  icon: string;
}) {
  const iconName = FEATURE_ICONS[opts.icon] ?? "sparkles";
  return block("MarketingFeatureItem", {
    style: {},
    props: {
      cardIcon: slot([
        icon(iconName, { width: size(1.75), height: size(1.75) }),
      ]),
      title: slot([
        heading("h3", opts.title, {
          fontSize: size(1.25),
          textAlign: sv("center"),
        }),
      ]),
      description: slot([text(opts.summary, { color: sv(C.mutedFg) })]),
      detailHeadline: slot([
        heading("h3", opts.detailHeadline, { fontSize: size(1.125) }),
      ]),
      detailBullets: slot([
        container(
          opts.bullets
            .slice(0, 4)
            .map((b) =>
              inlineContainer(
                [checkMark(1), inlineText(b, { fontSize: size(0.875) })],
                { gap: gap(0.5) },
              ),
            ),
          { gap: gap(0.5) },
        ),
      ]),
    },
  });
}

function detailLabel(label: string, body: string) {
  return container(
    [
      inlineText(label, {
        fontWeight: sv("600"),
        fontSize: size(0.75),
        textTransform: sv("uppercase"),
        letterSpacing: sv({ value: 0.025, unit: "rem" }),
        color: sv(C.brand),
      }),
      text(body, { color: sv(C.mutedFg), fontSize: size(0.875) }),
    ],
    { gap: gap(0.25) },
  );
}

export function integrationFeatureItem(opts: {
  name: string;
  src: string;
  what: string;
  why: string;
  how: string;
  docsPath?: string;
}) {
  const details = [
    detailLabel("What", opts.what),
    detailLabel("Why", opts.why),
    detailLabel("How", opts.how),
  ];
  if (opts.docsPath) {
    details.push(
      link("Read the setup guide →", `${DOCS_URL}${opts.docsPath}`, {
        color: sv(C.primary),
        fontWeight: sv("600"),
      }),
    );
  }
  return block("MarketingFeatureItem", {
    style: {},
    props: {
      cardIcon: slot([
        image(opts.src, opts.name, {
          width: size(2.5),
          height: size(2.5),
          maxWidth: size(2.5),
          objectFit: sv("contain"),
          borderRadius: radius(0),
        }),
      ]),
      title: slot([
        heading("h3", opts.name, {
          fontSize: size(1.125),
          textAlign: sv("center"),
        }),
      ]),
      description: slot([
        text("What / why / how", {
          color: sv(C.mutedFg),
          fontSize: size(0.75),
          textAlign: sv("center"),
        }),
      ]),
      detailHeadline: slot([
        heading("h3", "What, why, and how it connects", {
          fontSize: size(1.125),
        }),
      ]),
      detailBullets: slot([container(details, { gap: gap(1.25) })]),
    },
  });
}

export function featuresShowcase(
  items: unknown[],
  opts?: { transparentIcon?: boolean; maxColumns?: number },
) {
  return block("MarketingFeaturesShowcase", {
    style: {
      backgroundColor: opts?.transparentIcon
        ? [
            {
              value: "transparent",
              state: [
                {
                  state: "default",
                  target: {
                    type: "selector",
                    data: {
                      stateType: "selector",
                      selector: ".feature-card-icon-container",
                    },
                  },
                },
                {
                  state: "default",
                  target: {
                    type: "selector",
                    data: {
                      stateType: "selector",
                      selector: ".group:hover .feature-card-icon-container",
                    },
                  },
                },
                {
                  state: "default",
                  target: {
                    type: "selector",
                    data: {
                      stateType: "selector",
                      selector: ".feature-card-icon-container-expanded",
                    },
                  },
                },
              ],
            },
          ]
        : [],
      ...(opts?.maxColumns
        ? {
            gridTemplateColumns: [
              {
                value: `repeat(${opts.maxColumns}, 1fr)`,
                breakpoint: ["lg"],
                state: [
                  {
                    state: "default",
                    target: {
                      type: "selector",
                      data: {
                        stateType: "selector",
                        selector: ".marketing-features-showcase-cards",
                      },
                    },
                  },
                ],
              },
            ],
          }
        : {}),
    },
    props: {
      features: {
        children: items,
      },
    },
  });
}

export function checkMark(sizeRem = 1.25) {
  return image("/assets/svg/check.svg", "", {
    width: size(sizeRem),
    height: size(sizeRem),
    minWidth: size(sizeRem),
    borderRadius: radius(0),
    objectFit: sv("contain"),
    display: sv("inline-block"),
    flexShrink: sv("0"),
  });
}

export function dashMark(sizeRem = 1.25) {
  return image("/assets/svg/dash.svg", "", {
    width: size(sizeRem),
    height: size(sizeRem),
    minWidth: size(sizeRem),
    borderRadius: radius(0),
    objectFit: sv("contain"),
    display: sv("inline-block"),
    flexShrink: sv("0"),
  });
}

export function bulletRow(label: string) {
  return inlineContainer([checkMark(1.25), inlineText(label)], {
    gap: gap(0.5),
    alignItems: sv("center"),
  });
}

export function cardLink(opts: {
  href: string;
  title: string;
  body?: string;
  eyebrow?: string;
  image?: string;
}) {
  const bodyChildren: unknown[] = [];
  if (opts.eyebrow) {
    bodyChildren.push(
      inlineText(opts.eyebrow, {
        fontSize: size(0.75),
        fontWeight: sv("600"),
      }),
    );
  }
  bodyChildren.push(heading("h3", opts.title, { fontSize: size(1.25) }));
  if (opts.body) {
    bodyChildren.push(
      text(opts.body, { color: sv(C.mutedFg), flexGrow: sv("1") }),
    );
  }
  bodyChildren.push(
    link("Read more →", opts.href, {
      color: sv(C.primary),
      fontWeight: sv("600"),
    }),
  );

  const body = container(bodyChildren, {
    padding: pad(1.5, 1.5, 1.5, 1.5),
    gap: gap(0.5),
    flexGrow: sv("1"),
  });

  const children: unknown[] = opts.image
    ? [
        image(
          opts.image,
          opts.title,
          { height: size(14), borderRadius: radius(0) },
          opts.href,
        ),
        body,
      ]
    : [body];

  return container(children, {
    padding: emptyPad,
    borderRadius: radius(16),
    borderStyle: sv("solid"),
    borderWidth: size(1, "px"),
    borderColor: sv(C.border),
    backgroundColor: sv(C.card),
    gap: gap(0),
    overflow: sv("hidden"),
  });
}
