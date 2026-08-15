// @ts-ignore lodash is not a dependency of the project
import kebabCase from "lodash/kebabCase.js";

import type { MdMdxJsxTextElement, TRules } from "@udecode/plate-markdown";

import { convertChildrenDeserialize } from "@udecode/plate-markdown";

const getStyleValue = (
  mdastNode: MdMdxJsxTextElement,
  styleName: string,
): string | undefined => {
  const styleAttribute = mdastNode.attributes.find(
    (attr) => "name" in attr && attr.name === "style",
  ) as any;

  if (!styleAttribute?.value) return;

  const styles = styleAttribute.value.split(";");
  for (const style of styles) {
    const [name, value] = style.split(":").map((s: string) => s.trim());
    if (name === styleName) {
      return value;
    }
  }
  return;
};

function createFontRule(propName: string) {
  const styleName = kebabCase(propName);

  return {
    mark: true,
    serialize: (slateNode: any): MdMdxJsxTextElement => {
      return {
        attributes: [
          {
            name: "style",
            type: "mdxJsxAttribute",
            value: `${styleName}: ${slateNode[propName]};`,
          },
        ],
        children: [{ type: "text", value: slateNode.text }],
        name: "span",
        type: "mdxJsxTextElement",
      };
    },
  };
}

export const fontRules: TRules = {
  backgroundColor: createFontRule("backgroundColor"),
  color: createFontRule("color"),
  fontFamily: createFontRule("fontFamily"),
  fontSize: createFontRule("fontSize"),
  fontWeight: createFontRule("fontWeight"),
  span: {
    mark: true,
    deserialize: (mdastNode: MdMdxJsxTextElement, deco: any, options: any) => {
      const fontFamily = getStyleValue(mdastNode, "font-family");
      const fontSize = getStyleValue(mdastNode, "font-size");
      const fontWeight = getStyleValue(mdastNode, "font-weight");
      const color = getStyleValue(mdastNode, "color");
      const backgroundColor = getStyleValue(mdastNode, "background-color");

      return convertChildrenDeserialize(
        mdastNode.children,
        {
          ...deco,
          backgroundColor,
          color,
          fontFamily,
          fontSize,
          fontWeight,
        },
        options,
      ) as any;
    },
  },
};
