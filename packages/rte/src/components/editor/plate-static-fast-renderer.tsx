/**
 * Performance-oriented static read renderer: mirrors our `plate-ui/*-element-static`
 * markup/classes without Slate/Plate runtime per node.
 */
import {
  BaseEquationPlugin,
  BaseInlineEquationPlugin,
  getEquationHtml,
  type TEquationElement,
} from "@udecode/plate-math";
import type { Descendant, TText } from "@udecode/slate";
import { ChevronRight, FileUp, RadicalIcon } from "lucide-react";
import React from "react";

import { Button, cn } from "@hacado/ui";
import { BaseParagraphPlugin, type Value } from "@udecode/plate";
import {
  BaseBoldPlugin,
  BaseCodePlugin,
  BaseItalicPlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseUnderlinePlugin,
} from "@udecode/plate-basic-marks";
import { BaseBlockquotePlugin } from "@udecode/plate-block-quote";
import {
  BaseCodeBlockPlugin,
  BaseCodeLinePlugin,
  BaseCodeSyntaxPlugin,
} from "@udecode/plate-code-block";
import { BaseCommentsPlugin } from "@udecode/plate-comments";
import { BaseDatePlugin } from "@udecode/plate-date";
import {
  BaseTocPlugin,
  HEADING_KEYS,
  isHeading,
  type Heading,
} from "@udecode/plate-heading";
import { BaseHighlightPlugin } from "@udecode/plate-highlight";
import { BaseHorizontalRulePlugin } from "@udecode/plate-horizontal-rule";
import {
  BaseIndentListPlugin,
  INDENT_LIST_KEYS,
} from "@udecode/plate-indent-list";
import { BaseKbdPlugin } from "@udecode/plate-kbd";
import { BaseColumnItemPlugin, BaseColumnPlugin } from "@udecode/plate-layout";
import { BaseLinkPlugin } from "@udecode/plate-link";
import {
  BaseAudioPlugin,
  BaseFilePlugin,
  BaseImagePlugin,
  BaseVideoPlugin,
} from "@udecode/plate-media";
import { BaseMentionPlugin } from "@udecode/plate-mention";
import {
  BaseTableCellHeaderPlugin,
  BaseTableCellPlugin,
  BaseTablePlugin,
  BaseTableRowPlugin,
  getColSpan,
  getTableOverriddenColSizes,
} from "@udecode/plate-table";
import { BaseTogglePlugin } from "@udecode/plate-toggle";
import { Element, Text } from "slate";

import { editorVariants } from "../plate-ui/editor-static";
import { FireLiComponent, FireMarker } from "../plate-ui/indent-fire-marker";
import {
  TodoLiStatic,
  TodoMarkerStatic,
} from "../plate-ui/indent-todo-marker-static";
import { languages } from "../plate-ui/prism";
import { renderHighlightedCodeLineSegments } from "./prism-decorate-code-line";

const ULIST_STYLE_TYPES = new Set([
  "disc",
  "circle",
  "square",
  "disclosure-open",
  "disclosure-closed",
]);

const HEADING_TYPE_SET = new Set<string>(Object.values(HEADING_KEYS));

const HEADING_DEPTH: Record<string, number> = {
  [HEADING_KEYS.h1]: 1,
  [HEADING_KEYS.h2]: 2,
  [HEADING_KEYS.h3]: 3,
  [HEADING_KEYS.h4]: 4,
  [HEADING_KEYS.h5]: 5,
  [HEADING_KEYS.h6]: 6,
};

const headingItemVariants = cn(
  "block h-auto w-full cursor-pointer truncate rounded-none px-0.5 py-1.5 text-left font-medium text-muted-foreground underline decoration-[0.5px] underline-offset-4 hover:bg-accent hover:text-muted-foreground",
);

type FastRenderCtx = {
  codeBlockLang?: string;
  tableColSizes?: number[];
  cellColStart?: number;
  rowMinHeight?: number;
  /**
   * When true, block `indent` is applied on the enclosing list `<li>` (Plate inject
   * pattern), not on inner blocks like `<p>`.
   */
  listIndentOnLi?: boolean;
};

function linkOpensInNewTab(url: string): boolean {
  return /^(https?:|\/\/)/i.test(url.trim());
}

function stringFromDescendants(nodes: Descendant[]): string {
  let s = "";
  for (const n of nodes) {
    if (Text.isText(n)) s += n.text;
    else if (Element.isElement(n) && n.children)
      s += stringFromDescendants(n.children as Descendant[]);
  }
  return s;
}

/**
 * Some persisted values store a line as `{ type: "code_line", text: "..." }`. Slate
 * classifies that as a {@link Text} node (`Text.isText` is true), not an {@link Element},
 * so {@link renderBlock} would skip it. Rewrap as a real `code_line` element.
 */
function normalizeCodeBlockChildForRender(child: Descendant): Descendant {
  if (!Text.isText(child)) return child;
  const leaf = child as TText & { type?: unknown; id?: unknown };
  if (leaf.type !== BaseCodeLinePlugin.key) return child;
  return {
    type: BaseCodeLinePlugin.key,
    children: [{ text: leaf.text }],
    ...(typeof leaf.id === "string" ? { id: leaf.id } : {}),
  } as Descendant;
}

function collectHeadings(nodes: Descendant[]): Heading[] {
  const out: Heading[] = [];
  const walk = (list: Descendant[]) => {
    for (const n of list) {
      if (!Element.isElement(n)) continue;
      if (isHeading(n)) {
        const title = stringFromDescendants(n.children as Descendant[]);
        if (title)
          out.push({
            depth: HEADING_DEPTH[n.type as string] ?? 1,
            id: (n as { id?: string }).id ?? title,
            path: [],
            title,
            type: n.type,
          });
      }
      if (n.children) walk(n.children as Descendant[]);
    }
  };
  walk(nodes);
  return out;
}

function renderTextMarks(
  leaf: TText & Record<string, unknown>,
): React.ReactNode {
  const { text, ...rest } = leaf;
  let inner: React.ReactNode = text;

  if (rest[BaseCodeSyntaxPlugin.key] && typeof rest.tokenType === "string") {
    const tt = String(rest.tokenType);
    inner = (
      <span className={cn("prism-token", `token-${tt}`, `token_${tt}`)}>
        {inner}
      </span>
    );
  }
  if (rest[BaseCodePlugin.key]) {
    inner = (
      <code className="rounded-md bg-muted px-[0.3em] py-[0.2em] font-mono text-sm whitespace-pre-wrap">
        {inner}
      </code>
    );
  }
  if (rest[BaseSuperscriptPlugin.key]) inner = <sup>{inner}</sup>;
  if (rest[BaseSubscriptPlugin.key]) inner = <sub>{inner}</sub>;
  if (rest[BaseStrikethroughPlugin.key]) inner = <del>{inner}</del>;
  if (rest[BaseUnderlinePlugin.key]) inner = <u>{inner}</u>;
  if (rest[BaseItalicPlugin.key]) inner = <em>{inner}</em>;
  if (rest[BaseBoldPlugin.key]) inner = <strong>{inner}</strong>;
  if (rest[BaseKbdPlugin.key]) {
    inner = (
      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-sm shadow-[rgba(255,_255,_255,_0.1)_0px_0.5px_0px_0px_inset,_rgb(248,_249,_250)_0px_1px_5px_0px_inset,_rgb(193,_200,_205)_0px_0px_0px_0.5px,_rgb(193,_200,_205)_0px_2px_1px_-1px,_rgb(193,_200,_205)_0px_1px_0px_0px] dark:shadow-[rgba(255,_255,_255,_0.1)_0px_0.5px_0px_0px_inset,_rgb(26,_29,_30)_0px_1px_5px_0px_inset,_rgb(76,_81,_85)_0px_0px_0px_0.5px,_rgb(76,_81,_85)_0px_2px_1px_-1px,_rgb(76,_81,_85)_0px_1px_0px_0px]">
        {inner}
      </kbd>
    );
  }
  if (rest[BaseHighlightPlugin.key]) {
    inner = <mark className="bg-highlight/30 text-inherit">{inner}</mark>;
  }
  if (rest[BaseCommentsPlugin.key]) {
    inner = (
      <span className="border-b-2 border-b-highlight/35 bg-highlight/15">
        {inner}
      </span>
    );
  }

  const style: React.CSSProperties = {};
  if (typeof rest.color === "string") style.color = rest.color;
  if (typeof rest.backgroundColor === "string")
    style.backgroundColor = rest.backgroundColor as string;
  if (typeof rest.fontSize === "string")
    style.fontSize = rest.fontSize as string;
  if (typeof rest.fontFamily === "string")
    style.fontFamily = rest.fontFamily as string;
  if (Object.keys(style).length) {
    inner = <span style={style}>{inner}</span>;
  }

  return inner;
}

function renderPhrasing(
  children: Descendant[],
  pathKey: string,
): React.ReactNode[] {
  return children.map((child, i) => {
    const k = `${pathKey}-${i}`;
    if (Text.isText(child)) {
      return (
        <React.Fragment key={k}>
          {renderTextMarks(child as TText & Record<string, unknown>)}
        </React.Fragment>
      );
    }
    if (!Element.isElement(child)) return null;
    const el = child as {
      type: string;
      children?: Descendant[];
      [k: string]: unknown;
    };
    const ch = (el.children ?? []) as Descendant[];

    if (el.type === BaseLinkPlugin.key) {
      const url = typeof el.url === "string" ? el.url : "";
      console.log("LinkElement", el);
      const openInNewTab = el.target === "_blank";
      return (
        <a
          key={k}
          href={url || undefined}
          target={openInNewTab ? "_blank" : undefined}
          rel={openInNewTab ? "noopener noreferrer" : undefined}
          className="font-medium text-primary underline decoration-primary underline-offset-4"
        >
          {renderPhrasing(ch, k)}
        </a>
      );
    }
    if (el.type === BaseMentionPlugin.key) {
      const value = typeof el.value === "string" ? el.value : "";
      const first = ch[0] as (TText & Record<string, unknown>) | undefined;
      return (
        <span
          key={k}
          data-slate-value={value}
          className={cn(
            "inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm font-medium",
            !!first?.[BaseBoldPlugin.key] && "font-bold",
            !!first?.[BaseItalicPlugin.key] && "italic",
            !!first?.[BaseUnderlinePlugin.key] && "underline",
          )}
        >
          {value}
          {renderPhrasing(ch, k)}
        </span>
      );
    }
    if (el.type === BaseInlineEquationPlugin.key) {
      const tex = (el as unknown as TEquationElement).texExpression ?? "";
      const html = getEquationHtml({
        element: el as unknown as TEquationElement,
        options: {
          displayMode: true,
          errorColor: "#cc0000",
          fleqn: false,
          leqno: false,
          macros: { "\\f": "#1f(#2)" },
          output: "htmlAndMathml",
          strict: "warn",
          throwOnError: false,
          trust: false,
        },
      });
      return (
        <span
          key={k}
          className="inline-block rounded-sm select-none [&_.katex-display]:my-0"
        >
          <span
            className={cn(
              'relative after:absolute after:inset-0 after:-top-0.5 after:-left-1 after:z-1 after:h-[calc(100%+4px)] after:w-[calc(100%+8px)] after:rounded-sm after:content-[""]',
              "h-6",
              tex.length === 0 &&
                "text-muted-foreground after:bg-neutral-500/10",
            )}
          >
            {tex.length > 0 ? (
              <span
                className="font-mono leading-none"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : null}
          </span>
          {renderPhrasing(ch, k)}
        </span>
      );
    }
    if (el.type === BaseDatePlugin.key) {
      const dateStr = el.date as string | undefined;
      let label = "Pick a date";
      if (dateStr) {
        const today = new Date();
        const elementDate = new Date(dateStr);
        const isToday =
          elementDate.getDate() === today.getDate() &&
          elementDate.getMonth() === today.getMonth() &&
          elementDate.getFullYear() === today.getFullYear();
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const isYesterday = y.toDateString() === elementDate.toDateString();
        const t = new Date();
        t.setDate(t.getDate() + 1);
        const isTomorrow = t.toDateString() === elementDate.toDateString();
        if (isToday) label = "Today";
        else if (isYesterday) label = "Yesterday";
        else if (isTomorrow) label = "Tomorrow";
        else
          label = elementDate.toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
      }
      return (
        <span key={k} className="inline-block">
          <span className="w-fit rounded-sm bg-muted px-1 text-muted-foreground">
            {label}
          </span>
          {renderPhrasing(ch, k)}
        </span>
      );
    }

    return (
      <span key={k} data-unknown-inline={el.type}>
        {renderPhrasing(ch, k)}
      </span>
    );
  });
}

/** Matches {@link BaseIndentPlugin} default `offset` + `unit` (see `plate-static-editor`). */
const INDENT_OFFSET_PX = 24;

function indentBlockStyle(el: { [k: string]: unknown }): React.CSSProperties {
  const raw = el.indent;
  if (typeof raw !== "number" || raw <= 0 || !Number.isFinite(raw)) {
    return {};
  }
  return { marginLeft: raw * INDENT_OFFSET_PX };
}

function listStyleOnBlock(el: { [k: string]: unknown }): string | undefined {
  const v = el[BaseIndentListPlugin.key];
  return typeof v === "string" ? v : undefined;
}

function isListBlock(el: Descendant): boolean {
  if (!Element.isElement(el)) return false;
  if (!listStyleOnBlock(el as { [k: string]: unknown })) return false;
  return el.type === BaseParagraphPlugin.key || HEADING_TYPE_SET.has(el.type);
}

/**
 * Renders children for block containers (e.g. blockquote) where Slate may store
 * bare {@link Text} nodes alongside block nodes. {@link renderBlock} skips non-elements.
 */
function renderBlockContainerChildren(
  children: Descendant[],
  keyPrefix: string,
  ctx: FastRenderCtx,
): React.ReactNode[] {
  return children.map((c, i) => {
    const k = `${keyPrefix}-${i}`;
    if (Text.isText(c)) {
      return (
        <span key={k}>
          {renderTextMarks(c as TText & Record<string, unknown>)}
        </span>
      );
    }
    if (Element.isElement(c)) {
      return renderBlock(c, k, ctx);
    }
    return null;
  });
}

function renderBlock(
  node: Descendant,
  pathKey: string,
  ctx: FastRenderCtx = {},
): React.ReactNode {
  if (!Element.isElement(node)) return null;
  const el = node as {
    type: string;
    children?: Descendant[];
    [k: string]: unknown;
  };
  const ch = (el.children ?? []) as Descendant[];
  const ph = renderPhrasing(ch, pathKey);
  const blockIndent = ctx.listIndentOnLi ? {} : indentBlockStyle(el);

  switch (el.type) {
    case BaseParagraphPlugin.key:
      return (
        <p
          key={pathKey}
          className="m-0 px-0 py-1"
          style={{ whiteSpace: "pre-line", ...blockIndent }}
        >
          {ph}
        </p>
      );
    case BaseBlockquotePlugin.key:
      return (
        <blockquote
          key={pathKey}
          className="my-1 border-l-2 pl-6 italic"
          style={blockIndent}
        >
          {renderBlockContainerChildren(ch, `${pathKey}-bq`, ctx)}
        </blockquote>
      );
    case HEADING_KEYS.h1:
    case HEADING_KEYS.h2:
    case HEADING_KEYS.h3:
    case HEADING_KEYS.h4:
    case HEADING_KEYS.h5:
    case HEADING_KEYS.h6: {
      const Tag = el.type as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      const cls = {
        h1: "relative mb-1 mt-[1.6em] pb-1 font-heading text-4xl font-bold",
        h2: "relative mb-1 mt-[1.4em] pb-px font-heading text-2xl font-semibold tracking-tight",
        h3: "relative mb-1 mt-[1em] pb-px font-heading text-xl font-semibold tracking-tight",
        h4: "relative mb-1 mt-[0.75em] font-heading text-lg font-semibold tracking-tight",
        h5: "relative mb-1 mt-[0.75em] text-lg font-semibold tracking-tight",
        h6: "relative mb-1 mt-[0.75em] text-base font-semibold tracking-tight",
      }[Tag];
      return React.createElement(
        Tag,
        { key: pathKey, className: cls, style: blockIndent },
        ph,
      );
    }
    case BaseHorizontalRulePlugin.key:
      return (
        <div key={pathKey} className="cursor-text py-6">
          <hr className="h-0.5 rounded-sm border-none bg-muted bg-clip-content" />
          {ph}
        </div>
      );
    case BaseCodeBlockPlugin.key: {
      const lang = (el.lang as string | undefined) ?? "";
      const langClass = lang ? `${lang} language-${lang}` : "";
      const label =
        languages.find((l) => l.value === lang)?.label || lang || "Plain Text";
      const lineCtx: FastRenderCtx = { ...ctx, codeBlockLang: lang };
      return (
        <div
          key={pathKey}
          className={cn("relative py-1", langClass)}
          style={blockIndent}
        >
          <pre className="overflow-x-auto rounded-md bg-muted px-6 py-8 font-mono text-sm leading-[normal] [tab-size:2] line-numbers">
            <code>
              {ch.map((c, i) =>
                renderBlock(
                  normalizeCodeBlockChildForRender(c),
                  `${pathKey}-cl-${i}`,
                  lineCtx,
                ),
              )}
            </code>
          </pre>
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 select-none text-xs text-muted-foreground">
            {label}
          </div>
        </div>
      );
    }
    case BaseCodeLinePlugin.key: {
      const lang = ctx.codeBlockLang ?? "";
      const fromChildren = stringFromDescendants(ch);
      const rawLegacy = (el as unknown as { text?: unknown }).text;
      const legacyTop = typeof rawLegacy === "string" ? rawLegacy : "";
      const lineText = fromChildren || legacyTop;
      const highlighted =
        lineText.length > 0
          ? renderHighlightedCodeLineSegments(lineText, lang, pathKey)
          : null;
      return (
        <div key={pathKey} className="block">
          {highlighted ?? ph}
        </div>
      );
    }
    case BaseLinkPlugin.key:
    case BaseMentionPlugin.key:
    case BaseInlineEquationPlugin.key:
    case BaseDatePlugin.key:
      return <React.Fragment key={pathKey}>{ph}</React.Fragment>;
    case BaseImagePlugin.key: {
      const url = el.url as string | undefined;
      const width = el.width as number | undefined;
      const align = (el.align as string) ?? "center";
      const caption = el.caption as Descendant[] | undefined;
      const capText = caption?.[0]
        ? stringFromDescendants([caption[0]] as Descendant[])
        : "";
      return (
        <div
          key={pathKey}
          className="py-2.5 flex flex-col items-center justify-center"
        >
          <figure className="group relative m-0 inline-block" style={{ width }}>
            <div
              className="relative max-w-full min-w-[92px]"
              style={{ textAlign: align as React.CSSProperties["textAlign"] }}
            >
              <img
                className="w-full max-w-full cursor-default object-cover px-0 rounded-sm"
                alt=""
                src={url}
              />
              {capText ? (
                <figcaption className="mx-auto mt-2 h-[24px] max-w-full">
                  {capText}
                </figcaption>
              ) : null}
            </div>
          </figure>
          {ph}
        </div>
      );
    }
    case BaseVideoPlugin.key: {
      const url = el.url as string | undefined;
      const width = el.width as number | undefined;
      const align = (el.align as string) ?? "center";
      const caption = el.caption as Descendant[] | undefined;
      const capText = caption?.[0]
        ? stringFromDescendants([caption[0]] as Descendant[])
        : "";
      return (
        <div key={pathKey} className="py-2.5">
          <div style={{ textAlign: align as React.CSSProperties["textAlign"] }}>
            <figure
              className="group relative m-0 inline-block cursor-default"
              style={{ width }}
            >
              <video
                className="w-full max-w-full object-cover px-0 rounded-sm"
                src={url}
                controls
              />
              {capText ? <figcaption>{capText}</figcaption> : null}
            </figure>
          </div>
          {ph}
        </div>
      );
    }
    case BaseAudioPlugin.key: {
      const url = el.url as string | undefined;
      return (
        <div key={pathKey} className="mb-1">
          <figure className="group relative cursor-default">
            <div className="h-16">
              <audio className="size-full" src={url} controls />
            </div>
          </figure>
          {ph}
        </div>
      );
    }
    case BaseFilePlugin.key: {
      const name = el.name as string | undefined;
      const url = el.url as string | undefined;
      return (
        <div key={pathKey} className="my-px rounded-sm">
          <a
            className="group relative m-0 flex cursor-pointer items-center rounded px-0.5 py-[3px] hover:bg-muted"
            contentEditable={false}
            download={name}
            href={url}
            rel="noopener noreferrer"
            role="button"
            target="_blank"
          >
            <div className="flex items-center gap-1 p-1">
              <FileUp className="size-5" />
              <div>{name}</div>
            </div>
          </a>
          {ph}
        </div>
      );
    }
    case BaseEquationPlugin.key: {
      const tex = (el as unknown as TEquationElement).texExpression ?? "";
      const html = getEquationHtml({
        element: el as unknown as TEquationElement,
        options: {
          displayMode: true,
          errorColor: "#cc0000",
          fleqn: false,
          leqno: false,
          macros: { "\\f": "#1f(#2)" },
          output: "htmlAndMathml",
          strict: "warn",
          throwOnError: false,
          trust: false,
        },
      });
      return (
        <div key={pathKey} className="my-1">
          <div
            className={cn(
              "group flex items-center justify-center rounded-sm select-none hover:bg-primary/10 data-[selected=true]:bg-primary/10",
              tex.length === 0 ? "bg-muted p-3 pr-9" : "px-2 py-1",
            )}
          >
            {tex.length > 0 ? (
              <span dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <div className="flex h-7 w-full items-center gap-2 text-sm whitespace-nowrap text-muted-foreground">
                <RadicalIcon className="size-6 text-muted-foreground/80" />
                <div>Add a Tex equation</div>
              </div>
            )}
          </div>
          {ph}
        </div>
      );
    }
    case BaseTogglePlugin.key:
      return (
        <div key={pathKey} className="relative pl-6" style={blockIndent}>
          <div
            className="absolute top-0 -left-0.5 size-6 cursor-pointer items-center justify-center rounded-md p-px text-muted-foreground transition-colors select-none hover:bg-accent [&_svg]:size-4"
            contentEditable={false}
          >
            <ChevronRight className="size-4 transition-transform duration-75 rotate-0" />
          </div>
          {ch.map((c, i) => renderBlock(c, `${pathKey}-tg-${i}`, ctx))}
        </div>
      );
    case BaseTocPlugin.key: {
      const headingList = collectHeadings(ch);
      return (
        <div key={pathKey} className="mb-1 p-0">
          <div>
            {headingList.length > 0 ? (
              headingList.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  className={cn(
                    headingItemVariants,
                    item.depth === 1 && "pl-0.5",
                    item.depth === 2 && "pl-[26px]",
                    item.depth === 3 && "pl-[50px]",
                  )}
                >
                  {item.title}
                </Button>
              ))
            ) : (
              <div className="text-sm text-gray-500">
                Create a heading to display the table of contents.
              </div>
            )}
          </div>
          {ch.map((c, i) => renderBlock(c, `${pathKey}-toc-${i}`, ctx))}
        </div>
      );
    }
    case BaseColumnPlugin.key:
      return (
        <div key={pathKey} className="mb-2">
          <div className="flex size-full rounded">
            {ch.map((c, i) => renderBlock(c, `${pathKey}-cg-${i}`, ctx))}
          </div>
        </div>
      );
    case BaseColumnItemPlugin.key: {
      const width = el.width as string | number | undefined;
      return (
        <div
          key={pathKey}
          className="group/column relative"
          style={{ width: width ?? "100%" }}
        >
          <div className="h-full px-2 pt-2 group-first/column:pl-0 group-last/column:pr-0">
            <div className="relative h-full border border-transparent p-1.5">
              {ch.map((c, i) => renderBlock(c, `${pathKey}-ci-${i}`, ctx))}
            </div>
          </div>
        </div>
      );
    }
    case BaseTablePlugin.key: {
      const marginLeft = (el.marginLeft as number | undefined) ?? 0;
      const tableNode = el as {
        colSizes?: number[];
        children?: Descendant[];
      };
      const colSizes = getTableOverriddenColSizes(
        tableNode as Parameters<typeof getTableOverriddenColSizes>[0],
      ) as number[];
      const tableCtx: FastRenderCtx = { ...ctx, tableColSizes: colSizes };
      return (
        <div
          key={pathKey}
          className="overflow-x-auto py-5"
          style={{ paddingLeft: marginLeft }}
        >
          <div className="group/table relative w-fit">
            <table className="mr-0 ml-px table h-px table-fixed border-collapse">
              <tbody className="min-w-full">
                {ch.map((c, i) =>
                  renderBlock(c, `${pathKey}-tb-${i}`, tableCtx),
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    case BaseTableRowPlugin.key: {
      const rowSize = Number((el as { size?: number }).size) || 0;
      let colCursor = 0;
      return (
        <tr key={pathKey} className="h-full">
          {ch.map((c, i) => {
            if (!Element.isElement(c)) return null;
            const span = getColSpan(c as Parameters<typeof getColSpan>[0]);
            const cellStart = colCursor;
            colCursor += span;
            return renderBlock(c, `${pathKey}-tr-${i}`, {
              ...ctx,
              cellColStart: cellStart,
              rowMinHeight: rowSize,
            });
          })}
        </tr>
      );
    }
    case BaseTableCellPlugin.key:
    case BaseTableCellHeaderPlugin.key: {
      const isHeader = el.type === BaseTableCellHeaderPlugin.key;
      const Tag = isHeader ? "th" : "td";
      const colSpan = getColSpan(el as Parameters<typeof getColSpan>[0]);
      const rowSpan =
        Number(
          el.rowSpan ?? (el.attributes as { rowspan?: number })?.rowspan,
        ) || 1;
      const bg = el.background as string | undefined;
      const colSizes = ctx.tableColSizes ?? [];
      const colStart = ctx.cellColStart ?? 0;
      const widthPx = colSizes
        .slice(colStart, colStart + colSpan)
        .reduce((t, w) => t + (Number(w) || 0), 0);
      const minH = ctx.rowMinHeight ?? 0;
      return React.createElement(
        Tag,
        {
          key: pathKey,
          colSpan,
          rowSpan,
          className: cn(
            "h-full overflow-visible border border-border bg-background p-0",
            bg && "bg-(--cellBackground)",
            isHeader && "text-left font-normal *:m-0",
          ),
          style: {
            minWidth: widthPx || 120,
            maxWidth: widthPx || 240,
            ...(bg ? ({ "--cellBackground": bg } as React.CSSProperties) : {}),
          },
        },
        <div
          className="relative z-20 box-border h-full px-4 py-2"
          style={minH ? { minHeight: minH } : undefined}
        >
          {ph}
        </div>,
      );
    }
    default:
      return (
        <div key={pathKey} data-slate-type={el.type} className="my-1">
          {ch.map((c, i) => renderBlock(c, `${pathKey}-x-${i}`, ctx))}
        </div>
      );
  }
}

function renderRootBlocks(
  nodes: Descendant[],
  rootCtx: FastRenderCtx = {},
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < nodes.length) {
    const n = nodes[i]!;
    if (isListBlock(n)) {
      const lst = listStyleOnBlock(n as { [k: string]: unknown })!;
      const ordered = !ULIST_STYLE_TYPES.has(lst);
      const ListTag = ordered ? "ol" : "ul";
      const group: Descendant[] = [];
      while (i < nodes.length && isListBlock(nodes[i]!)) {
        group.push(nodes[i]!);
        i++;
      }
      const listStart = (() => {
        const first = group[0];
        if (!Element.isElement(first)) return undefined;
        const v = (first as Record<string, unknown>)[
          INDENT_LIST_KEYS.listStart
        ];
        return typeof v === "number" ? v : undefined;
      })();
      out.push(
        <ListTag
          key={`list-${out.length}`}
          className={cn(
            `slate-${BaseIndentListPlugin.key}-${lst}`,
            ordered ? "slate-ol" : "slate-ul",
          )}
          style={{
            listStyleType: lst,
            margin: 0,
            padding: 0,
            position: "relative",
          }}
          {...(ordered && listStart != null ? { start: listStart } : {})}
        >
          {group.map((item, j) => {
            const listCtx: FastRenderCtx = { ...rootCtx, listIndentOnLi: true };
            const liIndent = indentBlockStyle(item as Record<string, unknown>);
            if (lst === INDENT_LIST_KEYS.todo) {
              return (
                <React.Fragment key={j}>
                  {React.createElement(TodoMarkerStatic, {
                    element: item,
                  } as never)}
                  {React.createElement(TodoLiStatic, {
                    element: item,
                    style: liIndent,
                    children: renderBlock(item, `li-${j}`, listCtx),
                  } as never)}
                </React.Fragment>
              );
            }
            if (lst === "fire") {
              return (
                <React.Fragment key={j}>
                  {React.createElement(FireMarker, {
                    element: item,
                  } as never)}
                  {React.createElement(FireLiComponent, {
                    element: item,
                    style: liIndent,
                    children: renderBlock(item, `li-${j}`, listCtx),
                  } as never)}
                </React.Fragment>
              );
            }
            return (
              <li key={j} style={liIndent}>
                {renderBlock(item, `li-${j}`, listCtx)}
              </li>
            );
          })}
        </ListTag>,
      );
      continue;
    }
    out.push(renderBlock(n, `root-${i}`, rootCtx));
    i++;
  }
  return out;
}

export type PlateStaticFastRendererProps = {
  value?: Value;
} & import("class-variance-authority").VariantProps<typeof editorVariants> &
  Omit<React.HTMLAttributes<HTMLDivElement>, "children">;

export const PlateStaticFastRenderer = React.forwardRef<
  HTMLDivElement,
  PlateStaticFastRendererProps
>(function PlateStaticFastRenderer(
  { value, className, style, id, variant, ...rest },
  ref,
) {
  const nodes = Array.isArray(value) ? (value as Descendant[]) : [];
  return (
    <div
      ref={ref}
      id={id}
      style={style}
      className={cn(editorVariants({ variant }), className)}
      {...rest}
    >
      {renderRootBlocks(nodes, {})}
    </div>
  );
});
PlateStaticFastRenderer.displayName = "PlateStaticFastRenderer";
