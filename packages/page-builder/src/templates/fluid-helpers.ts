import { generateId, TEditorBlock } from "@hacado/builder";
import type { BaseAllKeys, I18nFn } from "@hacado/i18n";
import { COLORS } from "@hacado/page-builder-base/style";
import { ButtonPropsDefaults } from "../blocks/button";
import {
  FLUID_COLUMNS,
  FLUID_DEFAULT_GAP,
  FLUID_DEFAULT_ROW_HEIGHT,
  FLUID_MOBILE_COLUMNS,
  FLUID_TABLET_COLUMNS,
  FluidLayoutProps,
  FluidLayoutPropsDefaults,
  FluidPlacement,
  FluidPlacementOverrides,
} from "../blocks/fluid-layout/schema";
import { HeadingPropsDefaults } from "../blocks/heading/schema";
import { InlineContainerPropsDefaults } from "../blocks/inline-container";
import { TextPropsDefaults } from "../blocks/text/schema";

export { FLUID_COLUMNS, FLUID_MOBILE_COLUMNS, FLUID_TABLET_COLUMNS };

export const BUTTON_COL_SPAN = 3;
export const BUTTON_COL_SPAN_MOBILE = 4;
export const BUTTON_ROW_SPAN = 1;

export const sectionStyle: FluidLayoutProps["style"] = {
  ...FluidLayoutPropsDefaults.style,
  padding: [
    {
      value: {
        top: { value: 3, unit: "rem" },
        right: { value: 1.5, unit: "rem" },
        bottom: { value: 3, unit: "rem" },
        left: { value: 1.5, unit: "rem" },
      },
    },
  ],
  width: [
    {
      value: { value: 100, unit: "%" },
    },
  ],
};

/** @deprecated Use sectionStyle */
export const heroSectionStyle: FluidLayoutProps["style"] = {
  ...FluidLayoutPropsDefaults.style,
  padding: [
    {
      value: {
        top: { value: 0, unit: "rem" },
        right: { value: 0, unit: "rem" },
        bottom: { value: 2, unit: "rem" },
        left: { value: 0, unit: "rem" },
      },
    },
  ],
  minHeight: [
    {
      value: { value: 28, unit: "rem" },
    },
  ],
  width: [
    {
      value: { value: 100, unit: "%" },
    },
  ],
};

export function imageBackgroundStyle(
  url: string,
  opacity = 45,
): FluidLayoutProps["style"] {
  return {
    ...heroSectionStyle,
    backgroundColor: [{ value: COLORS.background.value }],
    backgroundImage: [{ value: { type: "url", value: url } }],
    backgroundSize: [{ value: "cover" }],
    backgroundRepeat: [{ value: "no-repeat" }],
    backgroundPosition: [{ value: "center" }],
    backgroundColorOpacity: [{ value: opacity }],
    backgroundBlendMode: [{ value: "overlay" }],
  };
}

export function videoBackgroundStyle(
  poster: string,
  videoSrc: string,
  opacity = 40,
): FluidLayoutProps["style"] {
  return {
    ...imageBackgroundStyle(poster, opacity),
    backgroundVideo: [
      {
        value: {
          src: videoSrc,
          poster,
        },
      },
    ],
  };
}

export function fluidSection(
  children: TEditorBlock[],
  placements: Record<string, FluidPlacement>,
  style: FluidLayoutProps["style"] = sectionStyle,
  placementOverrides: FluidPlacementOverrides = {},
): TEditorBlock {
  return {
    type: "FluidLayout",
    id: generateId(),
    data: {
      style,
      props: {
        children,
        placements,
        placementOverrides,
        rowHeight: FLUID_DEFAULT_ROW_HEIGHT,
        gap: FLUID_DEFAULT_GAP,
      },
    },
  };
}

export function buttonPlacement(
  colStart: number,
  rowStart: number,
  zIndex = 1,
  isMobile = false,
): FluidPlacement {
  return {
    colStart,
    colEnd: colStart + (isMobile ? BUTTON_COL_SPAN_MOBILE : BUTTON_COL_SPAN),
    rowStart,
    rowEnd: rowStart + BUTTON_ROW_SPAN,
    zIndex,
  };
}

export function centeredButtonColStart(columns: number): number {
  return Math.floor((columns - BUTTON_COL_SPAN) / 2) + 1;
}

export type CopyAlign = "center" | "left";

export type CopyBlockOptions = {
  level?: "h1" | "h2" | "h3";
  textAlign?: CopyAlign;
  titleFontSize?: { value: number; unit: "rem" };
  lightText?: boolean;
};

export function titleHeading(
  t: I18nFn<undefined, undefined>,
  textKey: BaseAllKeys,
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
                      props: { text: t(textKey) },
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

export function bodyText(
  t: I18nFn<undefined, undefined>,
  textKey: BaseAllKeys,
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
        value: [{ type: "p", children: [{ text: t(textKey) }] }],
      },
    },
  };
}

export function primaryButton(
  t: I18nFn<undefined, undefined>,
  labelKey: BaseAllKeys = "builder.pageBuilder.heroDefaults.primaryCta",
): TEditorBlock {
  const btn = structuredClone(ButtonPropsDefaults());
  const label = t(labelKey);
  const inlineText = (btn as any).props?.children?.[0]?.data?.props
    ?.children?.[0];
  if (inlineText?.data?.props) {
    inlineText.data.props.text = label;
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

export function heroCopyBlocks(
  t: I18nFn<undefined, undefined>,
  titleKey: BaseAllKeys,
  subtitleKey: BaseAllKeys,
  options: CopyBlockOptions = {},
) {
  const heading = titleHeading(t, titleKey, options);
  const text = bodyText(t, subtitleKey, {
    textAlign: options.textAlign,
    lightText: options.lightText,
  });
  const button = primaryButton(t);
  return { heading, text, button };
}

export function centeredCopyPlacements(
  headingId: string,
  textId: string,
  buttonId: string,
): Record<string, FluidPlacement> {
  return {
    [headingId]: {
      colStart: 5,
      colEnd: 21,
      rowStart: 4,
      rowEnd: 6,
      zIndex: 1,
    },
    [textId]: {
      colStart: 4,
      colEnd: 22,
      rowStart: 6,
      rowEnd: 8,
      zIndex: 1,
    },
    [buttonId]: buttonPlacement(centeredButtonColStart(FLUID_COLUMNS), 8),
  };
}

export function centeredCopyOverrides(
  headingId: string,
  textId: string,
  buttonId: string,
): FluidPlacementOverrides {
  const tabletBtnCol = centeredButtonColStart(FLUID_TABLET_COLUMNS);
  return {
    tablet: {
      [headingId]: {
        colStart: 2,
        colEnd: FLUID_TABLET_COLUMNS + 1,
        rowStart: 3,
        rowEnd: 5,
        zIndex: 1,
      },
      [textId]: {
        colStart: 2,
        colEnd: FLUID_TABLET_COLUMNS + 1,
        rowStart: 5,
        rowEnd: 7,
        zIndex: 1,
      },
      [buttonId]: buttonPlacement(tabletBtnCol, 7),
    },
    mobile: {
      [headingId]: {
        colStart: 1,
        colEnd: FLUID_MOBILE_COLUMNS + 1,
        rowStart: 2,
        rowEnd: 4,
        zIndex: 1,
      },
      [textId]: {
        colStart: 1,
        colEnd: FLUID_MOBILE_COLUMNS + 1,
        rowStart: 4,
        rowEnd: 6,
        zIndex: 1,
      },
      [buttonId]: buttonPlacement(
        centeredButtonColStart(FLUID_MOBILE_COLUMNS),
        6,
        1,
        true,
      ),
    },
  };
}

export function sectionIntroPlacements(
  headingId: string,
  textId: string,
  headingRow = 1,
): Record<string, FluidPlacement> {
  return {
    [headingId]: {
      colStart: 4,
      colEnd: 22,
      rowStart: headingRow,
      rowEnd: headingRow + 2,
      zIndex: 0,
    },
    [textId]: {
      colStart: 5,
      colEnd: 21,
      rowStart: headingRow + 2,
      rowEnd: headingRow + 4,
      zIndex: 0,
    },
  };
}

export function sectionIntroOverrides(
  headingId: string,
  textId: string,
  headingRow = 1,
): FluidPlacementOverrides {
  return {
    tablet: {
      [headingId]: {
        colStart: 2,
        colEnd: FLUID_TABLET_COLUMNS + 1,
        rowStart: headingRow,
        rowEnd: headingRow + 2,
        zIndex: 0,
      },
      [textId]: {
        colStart: 2,
        colEnd: FLUID_TABLET_COLUMNS + 1,
        rowStart: headingRow + 2,
        rowEnd: headingRow + 4,
        zIndex: 0,
      },
    },
    mobile: {
      [headingId]: {
        colStart: 1,
        colEnd: FLUID_MOBILE_COLUMNS + 1,
        rowStart: headingRow,
        rowEnd: headingRow + 2,
        zIndex: 0,
      },
      [textId]: {
        colStart: 1,
        colEnd: FLUID_MOBILE_COLUMNS + 1,
        rowStart: headingRow + 2,
        rowEnd: headingRow + 4,
        zIndex: 0,
      },
    },
  };
}

export function fullWidthPlacement(
  id: string,
  rowStart: number,
  rowEnd: number,
): FluidPlacement {
  return {
    colStart: 1,
    colEnd: FLUID_COLUMNS + 1,
    rowStart,
    rowEnd,
    zIndex: 0,
  };
}

export function columnPlacement(
  colStart: number,
  colSpan: number,
  rowStart: number,
  rowEnd: number,
  zIndex = 0,
): FluidPlacement {
  return {
    colStart,
    colEnd: colStart + colSpan,
    rowStart,
    rowEnd,
    zIndex,
  };
}

export function stackedColumnOverrides(
  blockIds: string[],
  rowStart: number,
  rowSpan = 4,
): FluidPlacementOverrides {
  const tablet: Record<string, FluidPlacement> = {};
  const mobile: Record<string, FluidPlacement> = {};
  blockIds.forEach((id, index) => {
    const row = rowStart + index * rowSpan;
    tablet[id] = {
      colStart: 1,
      colEnd: FLUID_TABLET_COLUMNS + 1,
      rowStart: row,
      rowEnd: row + rowSpan,
      zIndex: 0,
    };
    mobile[id] = {
      colStart: 1,
      colEnd: FLUID_MOBILE_COLUMNS + 1,
      rowStart: row,
      rowEnd: row + rowSpan,
      zIndex: 0,
    };
  });
  return { tablet, mobile };
}
