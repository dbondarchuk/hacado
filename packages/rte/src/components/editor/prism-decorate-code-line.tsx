import { cn } from "@hacado/ui";
import { createSlateEditor, type SlateEditor } from "@udecode/plate";
import {
  BaseCodeBlockPlugin,
  BaseCodeLinePlugin,
  decorateCodeLine,
} from "@udecode/plate-code-block";
import Prism from "prismjs";
import "prismjs/components/prism-antlr4.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-c.js";
import "prismjs/components/prism-cmake.js";
import "prismjs/components/prism-coffeescript.js";
import "prismjs/components/prism-cpp.js";
import "prismjs/components/prism-csharp.js";
import "prismjs/components/prism-css.js";
import "prismjs/components/prism-dart.js";
import "prismjs/components/prism-django.js";
import "prismjs/components/prism-docker.js";
import "prismjs/components/prism-ejs.js";
import "prismjs/components/prism-erlang.js";
import "prismjs/components/prism-git.js";
import "prismjs/components/prism-go.js";
import "prismjs/components/prism-graphql.js";
import "prismjs/components/prism-groovy.js";
import "prismjs/components/prism-java.js";
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-jsx.js";
import "prismjs/components/prism-kotlin.js";
import "prismjs/components/prism-latex.js";
import "prismjs/components/prism-less.js";
import "prismjs/components/prism-lua.js";
import "prismjs/components/prism-makefile.js";
import "prismjs/components/prism-markdown.js";
import "prismjs/components/prism-matlab.js";
import "prismjs/components/prism-mermaid.js";
import "prismjs/components/prism-objectivec.js";
import "prismjs/components/prism-perl.js";
import "prismjs/components/prism-php.js";
import "prismjs/components/prism-powershell.js";
import "prismjs/components/prism-properties.js";
import "prismjs/components/prism-protobuf.js";
import "prismjs/components/prism-python.js";
import "prismjs/components/prism-r.js";
import "prismjs/components/prism-ruby.js";
import "prismjs/components/prism-sass.js";
import "prismjs/components/prism-scala.js";
import "prismjs/components/prism-scheme.js";
import "prismjs/components/prism-scss.js";
import "prismjs/components/prism-sql.js";
import "prismjs/components/prism-swift.js";
import "prismjs/components/prism-tsx.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-wasm.js";
import "prismjs/components/prism-yaml.js";
import React from "react";

let decorateEditor: SlateEditor | null = null;

function getDecorateEditor(): SlateEditor {
  if (!decorateEditor) {
    decorateEditor = createSlateEditor({
      plugins: [
        BaseCodeBlockPlugin.configure({
          options: { prism: Prism, syntax: true },
        }),
        BaseCodeLinePlugin,
      ],
    });
  }
  return decorateEditor;
}

type SyntaxDecoration = {
  anchor: { offset: number; path: number[] };
  focus: { offset: number; path: number[] };
  tokenType?: string;
};

/**
 * Uses Plate's {@link decorateCodeLine} with a tiny throwaway editor so Prism token
 * ranges match the interactive/static Plate code block pipeline.
 */
export function renderHighlightedCodeLineSegments(
  text: string,
  lang: string,
  segmentKeyPrefix: string,
): React.ReactNode[] {
  const editor = getDecorateEditor();
  const line = {
    type: BaseCodeLinePlugin.key,
    children: [{ text }],
  };
  const langKey = lang === "plain" ? "" : lang;
  const block = {
    type: BaseCodeBlockPlugin.key,
    lang: langKey || undefined,
    children: [line],
  };
  editor.children = [block] as typeof editor.children;

  const lineNode = editor.children[0]?.children?.[0];
  if (!lineNode) {
    return [text];
  }

  const decs = decorateCodeLine({
    editor,
    entry: [lineNode, [0, 0]],
    type: BaseCodeLinePlugin.key,
  } as any) as SyntaxDecoration[];

  if (!decs.length) {
    return [text];
  }

  const sorted = [...decs].sort((a, b) => a.anchor.offset - b.anchor.offset);
  const out: React.ReactNode[] = [];
  let pos = 0;
  let k = 0;
  for (const d of sorted) {
    const s = d.anchor.offset;
    const e = d.focus.offset;
    const tt = d.tokenType ?? "plain";
    if (pos < s) {
      out.push(text.slice(pos, s));
    }
    out.push(
      <span
        key={`${segmentKeyPrefix}-t-${k++}`}
        className={cn(
          "prism-token",
          `token ${tt}`,
          `token-${tt}`,
          `token_${tt}`,
        )}
      >
        {text.slice(s, e)}
      </span>,
    );
    pos = e;
  }
  if (pos < text.length) {
    out.push(text.slice(pos));
  }
  return out;
}
