import { generateId, type TEditorBlock } from "@hacado/builder";
import { COLORS } from "@hacado/page-builder-base/style";
import { ButtonPropsDefaults } from "../../blocks/button";
import { HeadingPropsDefaults } from "../../blocks/heading/schema";
import { InlineContainerPropsDefaults } from "../../blocks/inline-container";
import { TextPropsDefaults } from "../../blocks/text/schema";
import { type CopyBlockOptions, typographyStylePatch } from "../fluid-helpers";

export function headingFromText(
  text: string,
  options: CopyBlockOptions = {},
): TEditorBlock {
  const headingDefaults = HeadingPropsDefaults();
  const { level = "h1", textAlign = "center" } = options;
  return {
    type: "Heading",
    id: generateId(),
    data: {
      ...headingDefaults,
      style: {
        ...headingDefaults.style,
        textAlign: [{ value: textAlign }],
        ...typographyStylePatch(options),
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
        ...(lightText ? { color: [{ value: "0 0% 100%" }] } : undefined),
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

export function buttonFromLabel(
  label: string,
  url = "/book",
  variant: "primary" | "outline" = "primary",
): TEditorBlock {
  const btn = structuredClone(ButtonPropsDefaults());
  const inlineText = (btn as any).props?.children?.[0]?.data?.props
    ?.children?.[0];
  if (inlineText?.data?.props) {
    inlineText.data.props.text = label;
  }
  if ((btn as any).props) {
    (btn as any).props.url = url;
  }

  const outlineStyle =
    variant === "outline"
      ? {
          backgroundColor: [{ value: COLORS.background.value }],
          backgroundColorOpacity: [{ value: 0 }],
          color: [{ value: COLORS.foreground.value }],
          borderStyle: [{ value: "solid" }],
          borderWidth: [{ value: { value: 1, unit: "px" } }],
          borderColor: [{ value: COLORS.foreground.value }],
        }
      : {};

  return {
    type: "Button",
    id: generateId(),
    data: {
      ...btn,
      style: {
        ...btn.style,
        justifyContent: [{ value: "center" }],
        borderRadius: [{ value: { value: 9999, unit: "px" } }],
        ...outlineStyle,
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
