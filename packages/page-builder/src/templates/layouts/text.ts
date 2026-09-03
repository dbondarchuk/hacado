import { generateId, type TEditorBlock } from "@hacado/builder";
import { COLORS } from "@hacado/page-builder-base/style";
import { ButtonPropsDefaults } from "../../blocks/button";
import { HeadingPropsDefaults } from "../../blocks/heading/schema";
import { InlineContainerPropsDefaults } from "../../blocks/inline-container";
import { TextPropsDefaults } from "../../blocks/text/schema";
import type { CopyBlockOptions } from "../fluid-helpers";

export function headingFromText(
  text: string,
  options: CopyBlockOptions = {},
): TEditorBlock {
  const headingDefaults = HeadingPropsDefaults();
  const {
    level = "h1",
    textAlign = "center",
    titleFontSize,
    lightText,
  } = options;
  return {
    type: "Heading",
    id: generateId(),
    data: {
      ...headingDefaults,
      style: {
        ...headingDefaults.style,
        textAlign: [{ value: textAlign }],
        ...(titleFontSize
          ? { fontSize: [{ value: titleFontSize }] }
          : undefined),
        ...(lightText
          ? { color: [{ value: COLORS.foreground.value }] }
          : undefined),
        padding: [
          {
            value: {
              top: { value: 0, unit: "rem" },
              right: { value: 0, unit: "rem" },
              bottom: { value: 0, unit: "rem" },
              left: { value: 0, unit: "rem" },
            },
          },
        ],
      },
      props: {
        level,
        children: [
          {
            type: "InlineContainer",
            id: generateId(),
            data: {
              style: InlineContainerPropsDefaults.style,
              props: {
                children: [
                  {
                    type: "InlineText",
                    id: generateId(),
                    data: {
                      props: { text },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
}

export function paragraphFromText(
  text: string,
  options: Pick<CopyBlockOptions, "textAlign" | "lightText"> = {},
): TEditorBlock {
  const { textAlign = "center", lightText } = options;
  return {
    type: "Text",
    id: generateId(),
    data: {
      ...TextPropsDefaults,
      style: {
        ...TextPropsDefaults.style,
        textAlign: [{ value: textAlign }],
        ...(lightText
          ? { color: [{ value: COLORS.foreground.value }] }
          : undefined),
        padding: [
          {
            value: {
              top: { value: 0, unit: "rem" },
              right: { value: 0, unit: "rem" },
              bottom: { value: 0, unit: "rem" },
              left: { value: 0, unit: "rem" },
            },
          },
        ],
      },
      props: {
        value: [{ type: "p", children: [{ text }] }],
      },
    },
  };
}

export function buttonFromLabel(label: string, url = "/book"): TEditorBlock {
  const btn = structuredClone(ButtonPropsDefaults());
  const inlineText = (btn as any).props?.children?.[0]?.data?.props
    ?.children?.[0];
  if (inlineText?.data?.props) {
    inlineText.data.props.text = label;
  }
  if ((btn as any).props) {
    (btn as any).props.url = url;
  }
  return {
    type: "Button",
    id: generateId(),
    data: {
      ...btn,
      style: {
        ...btn.style,
        justifyContent: [{ value: "center" }],
      },
    },
  };
}

export function heroCopyFromText(
  title: string,
  subtitle: string,
  ctaLabel: string,
  options: CopyBlockOptions = {},
) {
  return {
    heading: headingFromText(title, options),
    text: paragraphFromText(subtitle, {
      textAlign: options.textAlign,
      lightText: options.lightText,
    }),
    button: buttonFromLabel(ctaLabel),
  };
}
