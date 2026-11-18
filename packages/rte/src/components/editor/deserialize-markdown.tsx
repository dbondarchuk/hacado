import { Value } from "@udecode/plate";
import { MarkdownPlugin, remarkMdx } from "@udecode/plate-markdown";
import remarkGfm from "remark-gfm";
import { fontRules } from "./font-rules";
import { createPlateStaticEditor } from "./plate-static-editor";

export const deserializeMarkdown = (
  value: string,
  options?: { allowHtml?: boolean },
): Value => {
  const editor = createPlateStaticEditor(undefined, { includeMarkdown: true });
  const api = editor.getApi(MarkdownPlugin);

  const result = api.markdown.deserialize(value, {
    remarkPlugins: options?.allowHtml ? [remarkGfm, remarkMdx] : [remarkGfm],
    ...(options?.allowHtml ? { rules: fontRules } : {}),
  });

  return result;
};
