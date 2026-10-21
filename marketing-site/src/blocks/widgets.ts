/** Marketing composites: plans, FAQ, tables, feature cards, etc. */
import {
  C,
  DOCS_URL,
  SIGNUP_URL,
  assetUrl,
  block,
  gap,
  pad,
  radius,
  size,
  sv,
} from "./core";
import { customHtml, slot } from "./layout";
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

const tiltAngles = [-1.2, 1.2, -1];

/** Grow and tilt on hover. Index picks the rotation so a row does not all lean the same way. */
export function tilt(index = 0) {
  const rotate = tiltAngles[((index % 3) + 3) % 3];
  return {
    transition: sv("all 0.3s ease"),
    transformOrigin: sv("center bottom"),
    transform: [
      { value: "none" },
      {
        value: {
          functions: [
            { function: "translateY", values: [{ value: -8, unit: "px" }] },
            { function: "scale", values: [1.025] },
            { function: "rotate", values: [rotate] },
          ],
        },
        state: [{ state: "hover", target: { type: "self" } }],
      },
    ],
  };
}

export function creamCard(children: unknown[], index = 0) {
  return container(children, {
    gap: gap(0.75),
    padding: pad(1.75, 1.5, 1.75, 1.5),
    backgroundColor: sv(C.muted),
    height: size(100, "%"),
    ...tilt(index),
  });
}

export function step(n: string, title: string, body: string) {
  const index = Number.parseInt(n, 10);
  return container(
    [
      inlineText(n, {
        fontFamily: sv("TERTIARY"),
        fontSize: size(0.625),
        color: sv(C.mutedFg),
      }),
      container(
        [
          heading("h3", title, {
            fontSize: size(1.7),
            fontWeight: sv("500"),
            letterSpacing: sv({ value: -0.04, unit: "rem" }),
          }),
          text(body, {
            color: sv(C.mutedFg),
            fontSize: size(0.75),
            lineHeight: sv({ value: 1.7, unit: "" }),
          }),
        ],
        { gap: gap(0.75) },
      ),
    ],
    {
      justifyContent: sv("space-between"),
      gap: gap(1.5),
      padding: pad(1.7, 1.7, 1.7, 1.7),
      backgroundColor: sv(C.muted),
      minHeight: size(17.5, "rem"),
      height: size(100, "%"),
      ...tilt(Number.isFinite(index) ? index - 1 : 0),
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
  const children: unknown[] = [
    inlineText(opts.badge ?? opts.subtitle, {
      fontFamily: sv("TERTIARY"),
      fontSize: size(0.625),
      textTransform: sv("uppercase"),
      letterSpacing: sv({ value: 0.04, unit: "em" }),
      color: sv(C.accentFg),
    }),
    heading("h3", opts.name, { fontSize: size(1.75), fontWeight: sv("500") }),
    container(
      [
        heading("h2", opts.price, {
          fontSize: size(4),
          fontWeight: sv("500"),
          letterSpacing: sv({ value: -0.04, unit: "em" }),
        }),
        inlineText(opts.period, {
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
    text(opts.footnote, { color: sv(C.mutedFg), fontSize: size(0.8125) }),
  ];
  if (opts.includes) {
    children.push(
      text(opts.includes, { fontWeight: sv("600"), fontSize: size(0.8125) }),
    );
  }
  children.push(
    container(
      opts.benefits.map((b) =>
        inlineContainer(
          [checkMark(0.9), inlineText(b, { fontSize: size(0.75) })],
          { gap: gap(0.5), alignItems: sv("flex-start") },
        ),
      ),
      { gap: gap(0.4), flexGrow: sv("1") },
    ),
  );
  children.push(
    button(opts.cta, SIGNUP_URL, "primary", undefined, {
      width: [{ value: "max-content" }],
    }),
  );
  const index = [...opts.name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return container(children, {
    gap: gap(0.75),
    padding: pad(1.75, 1.75, 1.75, 1.75),
    backgroundColor: sv(opts.featured ? C.accent : C.muted),
    height: size(100, "%"),
    ...tilt(index),
  });
}

function childState(selector: string, state: "default" | "hover" = "default") {
  return [
    {
      state,
      target: {
        type: "selector" as const,
        data: { stateType: "selector" as const, selector },
      },
    },
  ];
}

function remSides(top: number, right: number, bottom: number, left: number) {
  return {
    top: { value: top, unit: "rem" as const },
    right: { value: right, unit: "rem" as const },
    bottom: { value: bottom, unit: "rem" as const },
    left: { value: left, unit: "rem" as const },
  };
}

/** Numbered hairline row: slide right and pick up the accent on hover. */
export function listRowMotion() {
  const hover = [
    { state: "hover" as const, target: { type: "self" as const } },
  ];
  return {
    transition: sv("all 0.3s ease"),
    padding: [
      ...pad(1.35, 0, 1.35, 0),
      { value: remSides(1.35, 0, 1.35, 0.65), state: hover },
    ],
    color: [{ value: C.foreground }, { value: C.accentFg, state: hover }],
  };
}

export function accordion(items: { q: string; a: string }[]) {
  return block("Accordion", {
    style: {
      width: size(100, "%"),
      borderStyle: sv("solid"),
      borderWidth: [
        {
          value: {
            top: { value: 1, unit: "px" },
            right: { value: 0, unit: "px" },
            bottom: { value: 0, unit: "px" },
            left: { value: 0, unit: "px" },
          },
        },
      ],
      borderColor: sv(C.border),
    },
    props: {
      allowMultipleOpen: true,
      defaultOpenFirst: false,
      animation: "slide",
      iconPosition: "right",
      iconStyle: "plus",
      children: items.map((item, index) => {
        const n = String(index + 1).padStart(2, "0");
        return block("AccordionItem", {
          style: {
            borderStyle: sv("solid"),
            borderColor: sv(C.border),
            borderRadius: radius(0),
            backgroundColor: [
              { value: "transparent" },
              { value: "transparent", state: childState("button") },
              { value: "transparent", state: childState("button", "hover") },
            ],
            borderWidth: [
              {
                value: {
                  top: { value: 0, unit: "px" },
                  right: { value: 0, unit: "px" },
                  bottom: { value: 1, unit: "px" },
                  left: { value: 0, unit: "px" },
                },
              },
            ],
            color: [
              { value: C.foreground, state: childState("button") },
              { value: C.accentFg, state: childState("button", "hover") },
            ],
            padding: [
              {
                value: remSides(1.35, 0, 1.35, 0),
                state: childState("button"),
              },
              {
                value: remSides(1.35, 0, 1.35, 0.65),
                state: childState("button", "hover"),
              },
              {
                value: remSides(0, 0, 1.25, 0),
                state: childState("button + div > div"),
              },
            ],
            transition: [
              { value: "all 0.3s ease", state: childState("button") },
            ],
            display: [
              {
                value: "none",
                state: childState("button > div > div:last-child"),
              },
            ],
          },
          props: {
            title: {
              children: [
                inlineContainer(
                  [
                    container(
                      [
                        inlineText(n, {
                          fontFamily: sv("TERTIARY"),
                          fontSize: size(0.625),
                          color: sv(C.mutedFg),
                        }),
                      ],
                      {
                        width: [
                          { value: { value: 2.6, unit: "rem" } },
                          {
                            value: { value: 4.4, unit: "rem" },
                            breakpoint: ["md"],
                          },
                        ],
                        flexShrink: sv(0),
                      },
                    ),
                    inlineText(item.q, {
                      fontFamily: sv("SECONDARY"),
                      fontSize: [
                        { value: { value: 1.35, unit: "rem" } },
                        {
                          value: { value: 1.7, unit: "rem" },
                          breakpoint: ["md"],
                        },
                      ],
                      fontWeight: sv("500"),
                    }),
                  ],
                  {
                    alignItems: sv("center"),
                    width: size(100, "%"),
                  },
                ),
              ],
            },
            content: {
              children: [
                container(
                  [
                    text(item.a, {
                      color: sv(C.mutedFg),
                      fontSize: size(0.875),
                      lineHeight: sv({ value: 1.6, unit: "" }),
                    }),
                  ],
                  {
                    padding: [
                      {
                        value: {
                          top: { value: 0, unit: "rem" },
                          right: { value: 0, unit: "rem" },
                          bottom: { value: 0.25, unit: "rem" },
                          left: { value: 2.6, unit: "rem" },
                        },
                      },
                      {
                        value: {
                          top: { value: 0, unit: "rem" },
                          right: { value: 0, unit: "rem" },
                          bottom: { value: 0.25, unit: "rem" },
                          left: { value: 4.4, unit: "rem" },
                        },
                        breakpoint: ["md"],
                      },
                    ],
                  },
                ),
              ],
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
      return `<span class="cmp-table__limited">Limited</span>`;
    }
  }
  const text = escapeHtml(value);
  return opts?.muted ? `<span class="cmp-table__muted">${text}</span>` : text;
}

function planCellHtml(value: string) {
  if (value === "Yes" || value === "yes") {
    return `<img src="${escapeHtml(assetUrl("/assets/svg/check.svg"))}" alt="Yes" width="18" height="18" />`;
  }
  if (value === "-" || value === "No" || value === "no") {
    return `<img src="${escapeHtml(assetUrl("/assets/svg/dash.svg"))}" alt="No" width="18" height="18" />`;
  }
  return escapeHtml(value);
}

const PLAN_TABLE_CSS = `
.plan-table{width:100%;max-width:100%;overflow-x:auto;color:hsl(var(--value-foreground-color));font-family:var(--font-primary-value),Arial,sans-serif;}
html:has(.plan-table),body:has(.plan-table){overflow-x:clip;}
.plan-table table{width:100%;min-width:36rem;border-collapse:separate;border-spacing:0;}
.plan-table th,.plan-table td{padding:15px 16px;text-align:center;vertical-align:middle;border-bottom:1px solid hsl(var(--value-border-color));background:hsl(var(--value-background-color));font-size:13px;line-height:1.45;font-weight:500;}
.plan-table td{white-space:nowrap;}
.plan-table thead th{padding:20px 16px 16px;vertical-align:bottom;font-family:var(--font-secondary-value),Georgia,serif;font-size:28px;font-weight:500;letter-spacing:-.04em;line-height:1;}
.plan-table thead th:first-child,.plan-table tbody th{text-align:left;font-family:var(--font-primary-value),Arial,sans-serif;font-size:13px;font-weight:500;letter-spacing:0;color:hsl(var(--value-foreground-color));width:34%;}
.plan-table .is-on{background:hsl(var(--value-accent-color));}
.plan-table .kicker{display:block;margin-bottom:8px;font:500 10px/1 var(--font-tertiary-value),ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:hsl(var(--value-accent-foreground-color));}
.plan-table tbody tr:last-child th,.plan-table tbody tr:last-child td{border-bottom:0;}
.plan-table img{display:block;margin:0 auto;width:18px;height:18px;}
@media (max-width:700px){
  .plan-table table{min-width:0;}
  .plan-table th,.plan-table td{padding:12px 4px;font-size:11px;}
  .plan-table thead th{font-size:18px;padding:14px 6px 12px;}
  .plan-table thead th:first-child,.plan-table tbody th{font-size:12px;}
}`;

/** Rounded bordered comparison table matching the marketing prototype. */
export function comparisonTable(opts: {
  cornerHeader: string;
  columns: string[];
  rows: { feature: string; cells: string[] }[];
  highlightCol?: number;
  highlightLabel?: string;
  /** Plan matrix: hairline rows, sage featured column, checks instead of Yes/-. */
  variant?: "plans";
  checkmarks?: boolean;
  minWidth?: string;
  stickyFirst?: boolean;
  /** Pin the highlighted vendor column while scrolling horizontally (default: with sticky first + highlightCol 0). */
  stickyHighlight?: boolean;
}) {
  if (opts.variant === "plans") {
    const highlight = opts.highlightCol ?? -1;
    const headers = opts.columns
      .map((col, i) => {
        const on = i === highlight;
        const kicker =
          on && opts.highlightLabel
            ? `<span class="kicker">${escapeHtml(opts.highlightLabel)}</span>`
            : "";
        return `<th class="${on ? "is-on" : ""}">${kicker}${escapeHtml(col)}</th>`;
      })
      .join("");
    const body = opts.rows
      .map((row) => {
        const cells = row.cells
          .map((cell, i) => {
            const on = i === highlight ? "is-on" : "";
            return `<td class="${on}">${planCellHtml(cell)}</td>`;
          })
          .join("");
        return `<tr><th scope="row">${escapeHtml(row.feature)}</th>${cells}</tr>`;
      })
      .join("");
    return customHtml(`<div class="plan-table"><style>${PLAN_TABLE_CSS}</style>
<table>
<thead><tr><th>${escapeHtml(opts.cornerHeader)}</th>${headers}</tr></thead>
<tbody>${body}</tbody>
</table></div>`);
  }

  const highlight = opts.highlightCol ?? -1;
  const sticky = opts.stickyFirst ?? Boolean(opts.checkmarks);
  const stickyHighlight = opts.stickyHighlight ?? (sticky && highlight === 0);
  const minWidth = opts.minWidth ?? (opts.checkmarks ? "52rem" : "0");
  const stickyLabelWidth = "9rem";
  const headers = opts.columns
    .map((col, i) => {
      const hi = i === highlight ? " cmp-table__hi" : "";
      return `<th class="${hi.trim()}">${escapeHtml(col)}</th>`;
    })
    .join("");
  const body = opts.rows
    .map((row) => {
      const cells = row.cells
        .map((cell, i) => {
          const hi = i === highlight ? " cmp-table__hi" : "";
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
    "cmp-table",
    sticky ? "cmp-table--sticky" : "",
    stickyHighlight ? "cmp-table--sticky-hi" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return customHtml(`<div class="${rootClass}">
<style>
html:has(.cmp-table),body:has(.cmp-table){overflow-x:clip;}
.cmp-table{width:100%;max-width:100%;overflow-x:auto;border:0;border-radius:0;background:transparent;color:hsl(var(--value-foreground-color));font-family:var(--font-primary-value),Arial,sans-serif;}
.cmp-table table{width:100%;min-width:${minWidth};border-collapse:separate;border-spacing:0;font-size:13px;}
.cmp-table th,.cmp-table td{padding:14px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid hsl(var(--value-border-color));background:hsl(var(--value-background-color));font-weight:500;}
.cmp-table thead th{font-family:var(--font-secondary-value),Georgia,serif;font-size:18px;font-weight:500;letter-spacing:-.03em;background:hsl(var(--value-background-color));color:hsl(var(--value-foreground-color));}
.cmp-table thead th:first-child,.cmp-table tbody th{text-align:left;font-family:var(--font-primary-value),Arial,sans-serif;font-size:13px;font-weight:500;letter-spacing:0;}
.cmp-table tbody tr:last-child th,.cmp-table tbody tr:last-child td{border-bottom:0;}
.cmp-table--sticky thead th:first-child{position:sticky;left:0;z-index:4;min-width:${stickyLabelWidth};width:${stickyLabelWidth};background:hsl(var(--value-background-color));}
.cmp-table--sticky tbody th{position:sticky;left:0;z-index:3;min-width:${stickyLabelWidth};width:${stickyLabelWidth};background:hsl(var(--value-background-color));}
.cmp-table thead .cmp-table__hi,.cmp-table tbody .cmp-table__hi{background:hsl(var(--value-accent-color));color:hsl(var(--value-foreground-color));font-weight:500;}
.cmp-table--sticky-hi thead .cmp-table__hi{position:sticky;left:${stickyLabelWidth};z-index:4;min-width:4.5rem;background:hsl(var(--value-accent-color));box-shadow:4px 0 8px -4px hsl(var(--value-foreground-color) / .12);}
.cmp-table--sticky-hi tbody .cmp-table__hi{position:sticky;left:${stickyLabelWidth};z-index:3;min-width:4.5rem;background:hsl(var(--value-accent-color));box-shadow:4px 0 8px -4px hsl(var(--value-foreground-color) / .12);}
.cmp-table__limited{font:500 10px var(--font-tertiary-value),ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:hsl(var(--value-muted-foreground-color));}
.cmp-table__muted{color:hsl(var(--value-muted-foreground-color));}
.cmp-table img{display:block;margin:0 auto;width:18px;height:18px;}
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
          fontFamily: sv("TERTIARY"),
          fontSize: size(0.625),
          textTransform: sv("uppercase"),
          letterSpacing: sv({ value: 0.08, unit: "em" }),
          color: sv(brand ? C.accentFg : C.mutedFg),
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
      backgroundColor: sv(C.muted),
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
  const cardSelector = {
    type: "selector" as const,
    data: {
      stateType: "selector" as const,
      selector: ".feature-card-container",
    },
  };
  const cardHover = (selector: string, rotate: number) => ({
    value: {
      functions: [
        { function: "translateY", values: [{ value: -8, unit: "px" }] },
        { function: "scale", values: [1.025] },
        { function: "rotate", values: [rotate] },
      ],
    },
    state: [
      {
        state: "hover" as const,
        target: {
          type: "selector" as const,
          data: { stateType: "selector" as const, selector },
        },
      },
    ],
  });
  return block("MarketingFeaturesShowcase", {
    style: {
      borderStyle: [
        {
          value: "none",
          state: [{ state: "default", target: cardSelector }],
        },
      ],
      borderRadius: [
        {
          value: { value: 0, unit: "px" },
          state: [{ state: "default", target: cardSelector }],
        },
      ],
      transition: [
        {
          value: "all 0.3s ease",
          state: [{ state: "default", target: cardSelector }],
        },
      ],
      transformOrigin: [
        {
          value: "center bottom",
          state: [{ state: "default", target: cardSelector }],
        },
      ],
      transform: [
        cardHover(".feature-card-container", -1.2),
        cardHover(
          ".marketing-features-showcase-cards > .feature-card-container:nth-child(2)",
          1.2,
        ),
        cardHover(
          ".marketing-features-showcase-cards > .feature-card-container:nth-child(3)",
          -1,
        ),
      ],
      backgroundColor: [
        {
          value: C.muted,
          state: [{ state: "default", target: cardSelector }],
        },
        ...(opts?.transparentIcon
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
          : []),
      ],
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
  index?: number;
}) {
  const index =
    opts.index ??
    [...opts.title].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const children: unknown[] = [];
  if (opts.image) {
    children.push(
      image(opts.image, opts.title, {
        height: size(11.25, "rem"),
        borderRadius: radius(0),
        objectPosition: [{ value: { x: 50, y: 0 } }],
      }),
    );
  }
  const copy: unknown[] = [];
  if (opts.eyebrow) {
    copy.push(
      inlineText(opts.eyebrow, {
        fontFamily: sv("TERTIARY"),
        fontSize: size(0.625),
        textTransform: sv("uppercase"),
        letterSpacing: sv({ value: 0.08, unit: "rem" }),
        color: sv(C.mutedFg),
      }),
    );
  }
  copy.push(
    heading("h3", opts.title, {
      fontSize: size(1.625),
      fontWeight: sv("500"),
      letterSpacing: sv({ value: -0.04, unit: "rem" }),
    }),
  );
  if (opts.body) {
    copy.push(
      text(opts.body, {
        color: sv(C.mutedFg),
        fontSize: size(0.75),
        lineHeight: sv({ value: 1.6, unit: "" }),
      }),
    );
  }
  copy.push(
    inlineText("Read more", {
      fontSize: size(0.7),
      fontWeight: sv("700"),
    }),
  );
  children.push(
    container(copy, {
      padding: pad(1.35, 1.5, 1.6, 1.5),
      gap: gap(0.65),
      flexGrow: sv(1),
    }),
  );
  const external = /^https?:\/\//.test(opts.href);
  return block("Link", {
    props: {
      url: opts.href,
      target: external ? "_blank" : "_self",
      children,
    },
    style: {
      display: sv("flex"),
      flexDirection: sv("column"),
      backgroundColor: sv(C.muted),
      color: sv(C.foreground),
      textDecoration: sv("none"),
      overflow: sv("hidden"),
      minHeight: size(17.5, "rem"),
      height: size(100, "%"),
      ...tilt(index),
    },
  });
}

/** Numbered hairline statements, same row as the home lists, without a link arrow. */
export function statementList(items: string[]) {
  const line = {
    top: { value: 0, unit: "px" as const },
    right: { value: 0, unit: "px" as const },
    bottom: { value: 1, unit: "px" as const },
    left: { value: 0, unit: "px" as const },
  };
  return container(
    items.map((item, index) =>
      container(
        [
          inlineText(String(index + 1).padStart(2, "0"), {
            fontFamily: sv("TERTIARY"),
            fontSize: size(0.625),
            color: sv(C.mutedFg),
          }),
          heading("h3", item, {
            fontSize: [
              { value: { value: 1, unit: "rem" } },
              { value: { value: 1.125, unit: "rem" }, breakpoint: ["md"] },
            ],
            fontWeight: sv("500"),
            letterSpacing: sv({ value: -0.03, unit: "rem" }),
          }),
        ],
        {
          display: sv("grid"),
          gridTemplateColumns: [{ value: "1.75rem 1fr" }],
          alignItems: sv("center"),
          gap: gap(0.5),
          borderStyle: sv("solid"),
          borderColor: sv(C.border),
          borderWidth: [{ value: line }],
          width: size(100, "%"),
          ...listRowMotion(),
          padding: [
            ...pad(0.65, 0, 0.65, 0),
            {
              value: {
                top: { value: 0.65, unit: "rem" },
                right: { value: 0, unit: "rem" },
                bottom: { value: 0.65, unit: "rem" },
                left: { value: 0.4, unit: "rem" },
              },
              state: [
                { state: "hover" as const, target: { type: "self" as const } },
              ],
            },
          ],
        },
      ),
    ),
    {
      borderStyle: sv("solid"),
      borderColor: sv(C.border),
      borderWidth: [
        {
          value: {
            top: { value: 1, unit: "px" },
            right: { value: 0, unit: "px" },
            bottom: { value: 0, unit: "px" },
            left: { value: 0, unit: "px" },
          },
        },
      ],
      width: size(100, "%"),
      gap: gap(0),
    },
  );
}

export function relatedLinks(items: { label: string; href: string }[]) {
  return container(
    items.map((item, index) => {
      const label = item.label.replace(/\s*→\s*$/, "");
      const n = String(index + 1).padStart(2, "0");
      const external = /^https?:\/\//.test(item.href);
      return block("Link", {
        props: {
          url: item.href,
          target: external ? "_blank" : "_self",
          children: [
            inlineText(n, {
              fontFamily: sv("TERTIARY"),
              fontSize: size(0.625),
              color: sv(C.mutedFg),
            }),
            heading("h3", label, {
              fontSize: [
                { value: { value: 1.25, unit: "rem" } },
                { value: { value: 1.5, unit: "rem" }, breakpoint: ["md"] },
              ],
              fontWeight: sv("500"),
              letterSpacing: sv({ value: -0.04, unit: "rem" }),
            }),
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
            { value: "2.6rem 1fr 1.25rem" },
            { value: "4.4rem 1fr 1.5rem", breakpoint: ["md"] },
          ],
          alignItems: sv("center"),
          gap: gap(0.75),
          borderStyle: sv("solid"),
          borderColor: sv(C.border),
          borderWidth: [
            {
              value: {
                top: { value: 0, unit: "px" },
                right: { value: 0, unit: "px" },
                bottom: { value: 1, unit: "px" },
                left: { value: 0, unit: "px" },
              },
            },
          ],
          textDecoration: sv("none"),
          width: size(100, "%"),
          ...listRowMotion(),
        },
      });
    }),
    {
      borderStyle: sv("solid"),
      borderColor: sv(C.border),
      borderWidth: [
        {
          value: {
            top: { value: 1, unit: "px" },
            right: { value: 0, unit: "px" },
            bottom: { value: 0, unit: "px" },
            left: { value: 0, unit: "px" },
          },
        },
      ],
      width: size(100, "%"),
      gap: gap(0),
    },
  );
}
