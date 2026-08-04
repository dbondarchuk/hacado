import { Value } from "@udecode/plate";
import { MarkdownPlugin, remarkMdx } from "@udecode/plate-markdown";
import { fontRules } from "./font-rules";
import { createPlateStaticEditor } from "./plate-static-editor";

export const deserializeMarkdown = (
  value: string,
  options?: { allowHtml?: boolean },
): Value => {
  const editor = createPlateStaticEditor(undefined, { includeMarkdown: true });
  const api = editor.getApi(MarkdownPlugin);

  const result = api.markdown.deserialize(
    value,
    options?.allowHtml
      ? { remarkPlugins: [remarkMdx], rules: fontRules }
      : undefined,
  );

  return result;
};
