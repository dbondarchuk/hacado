import {
  generateId,
  TEditorBlock,
  TemplatesConfiguration,
} from "@hacado/builder";
import type { BaseAllKeys, I18nFn } from "@hacado/i18n";
import { COLORS } from "@hacado/page-builder-base/style";
import {
  LayoutTemplate,
  MonitorPlay,
  PanelLeft,
  Sparkles,
  SplitSquareHorizontal,
} from "lucide-react";
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
import { ImagePropsDefaults } from "../blocks/image/schema";
import { InlineContainerPropsDefaults } from "../blocks/inline-container";
import { TextPropsDefaults } from "../blocks/text/schema";

const heroesCategory =
  "builder.pageBuilder.blocks.categories.heroes" satisfies BaseAllKeys;

const UNSPLASH_CENTERED =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80";
const UNSPLASH_SPLIT =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80";
const UNSPLASH_VIDEO_POSTER =
  "https://images.unsplash.com/photo-1468931467769-06a09c69aad3?auto=format&fit=crop&w=1920&q=80";
/** Ocean waves — stable hotlink-friendly Pexels CDN URL. */
const PEXELS_HERO_VIDEO =
  "https://videos.pexels.com/video-files/1409899/1409899-uhd_2560_1440_25fps.mp4";

const BUTTON_COL_SPAN = 3;
const BUTTON_COL_SPAN_MOBILE = 4;
const BUTTON_ROW_SPAN = 1;

const previewUrl = (base: string) => {
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}w=640&h=360&fit=crop`;
};

const heroSectionStyle: FluidLayoutProps["style"] = {
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

function imageBackgroundStyle(
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

function videoBackgroundStyle(
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

function fluidSection(
  children: TEditorBlock[],
  placements: Record<string, FluidPlacement>,
  style: FluidLayoutProps["style"] = heroSectionStyle,
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

function buttonPlacement(
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

function centeredButtonColStart(columns: number): number {
  return Math.floor((columns - BUTTON_COL_SPAN) / 2) + 1;
}

type CopyAlign = "center" | "left";

type CopyBlockOptions = {
  level?: "h1" | "h2" | "h3";
  textAlign?: CopyAlign;
  titleFontSize?: { value: number; unit: "rem" };
  lightText?: boolean;
};

function titleHeading(
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

function bodyText(
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

function primaryButton(t: I18nFn<undefined, undefined>): TEditorBlock {
  const btn = structuredClone(ButtonPropsDefaults());
  const label = t("builder.pageBuilder.heroDefaults.primaryCta");
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

function heroCopyBlocks(
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

function centeredCopyPlacements(
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

function centeredCopyOverrides(
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

function leftOverlayPlacements(
  headingId: string,
  textId: string,
  buttonId: string,
): Record<string, FluidPlacement> {
  return {
    [headingId]: {
      colStart: 2,
      colEnd: 14,
      rowStart: 8,
      rowEnd: 10,
      zIndex: 1,
    },
    [textId]: {
      colStart: 2,
      colEnd: 16,
      rowStart: 10,
      rowEnd: 12,
      zIndex: 1,
    },
    [buttonId]: buttonPlacement(2, 12),
  };
}

function leftOverlayOverrides(
  headingId: string,
  textId: string,
  buttonId: string,
): FluidPlacementOverrides {
  return {
    tablet: {
      [headingId]: {
        colStart: 1,
        colEnd: 9,
        rowStart: 7,
        rowEnd: 9,
        zIndex: 1,
      },
      [textId]: {
        colStart: 1,
        colEnd: 11,
        rowStart: 9,
        rowEnd: 11,
        zIndex: 1,
      },
      [buttonId]: buttonPlacement(1, 11),
    },
    mobile: {
      [headingId]: {
        colStart: 1,
        colEnd: FLUID_MOBILE_COLUMNS + 1,
        rowStart: 8,
        rowEnd: 10,
        zIndex: 1,
      },
      [textId]: {
        colStart: 1,
        colEnd: FLUID_MOBILE_COLUMNS + 1,
        rowStart: 10,
        rowEnd: 12,
        zIndex: 1,
      },
      [buttonId]: buttonPlacement(1, 12, 1, true),
    },
  };
}

function splitCopyPlacements(
  headingId: string,
  textId: string,
  buttonId: string,
): Record<string, FluidPlacement> {
  return {
    [headingId]: {
      colStart: 14,
      colEnd: FLUID_COLUMNS + 1,
      rowStart: 3,
      rowEnd: 5,
      zIndex: 0,
    },
    [textId]: {
      colStart: 14,
      colEnd: FLUID_COLUMNS + 1,
      rowStart: 5,
      rowEnd: 7,
      zIndex: 0,
    },
    [buttonId]: buttonPlacement(14, 7, 0),
  };
}

function splitOverrides(
  imageId: string,
  headingId: string,
  textId: string,
  buttonId: string,
): FluidPlacementOverrides {
  return {
    tablet: {
      [imageId]: {
        colStart: 1,
        colEnd: FLUID_TABLET_COLUMNS + 1,
        rowStart: 1,
        rowEnd: 6,
        zIndex: 0,
      },
      [headingId]: {
        colStart: 1,
        colEnd: FLUID_TABLET_COLUMNS + 1,
        rowStart: 6,
        rowEnd: 8,
        zIndex: 0,
      },
      [textId]: {
        colStart: 1,
        colEnd: FLUID_TABLET_COLUMNS + 1,
        rowStart: 8,
        rowEnd: 10,
        zIndex: 0,
      },
      [buttonId]: buttonPlacement(1, 10, 0),
    },
    mobile: {
      [imageId]: {
        colStart: 1,
        colEnd: FLUID_MOBILE_COLUMNS + 1,
        rowStart: 1,
        rowEnd: 7,
        zIndex: 0,
      },
      [headingId]: {
        colStart: 1,
        colEnd: FLUID_MOBILE_COLUMNS + 1,
        rowStart: 7,
        rowEnd: 9,
        zIndex: 0,
      },
      [textId]: {
        colStart: 1,
        colEnd: FLUID_MOBILE_COLUMNS + 1,
        rowStart: 9,
        rowEnd: 11,
        zIndex: 0,
      },
      [buttonId]: buttonPlacement(1, 11, 0, true),
    },
  };
}

export const heroEditorTemplates: TemplatesConfiguration = {
  HeroCenteredImage: {
    displayName:
      "builder.pageBuilder.templates.heroes.centeredImage" satisfies BaseAllKeys,
    icon: <LayoutTemplate />,
    category: heroesCategory,
    previewImage: "/pages/templates/heroes/centered-image.png",
    getBlock: (t) => {
      const { heading, text, button } = heroCopyBlocks(
        t,
        "builder.pageBuilder.heroDefaults.title",
        "builder.pageBuilder.heroDefaults.subtitle",
        { lightText: true },
      );
      return fluidSection(
        [heading, text, button],
        centeredCopyPlacements(heading.id, text.id, button.id),
        imageBackgroundStyle(UNSPLASH_CENTERED, 45),
        centeredCopyOverrides(heading.id, text.id, button.id),
      );
    },
  },

  HeroSplitImage: {
    displayName:
      "builder.pageBuilder.templates.heroes.splitImage" satisfies BaseAllKeys,
    icon: <SplitSquareHorizontal />,
    category: heroesCategory,
    previewImage: "/pages/templates/heroes/split-image.png",
    getBlock: (t) => {
      const imageId = generateId();
      const { heading, text, button } = heroCopyBlocks(
        t,
        "builder.pageBuilder.heroDefaults.split.title",
        "builder.pageBuilder.heroDefaults.split.subtitle",
        { textAlign: "left" },
      );
      const imageBlock: TEditorBlock = {
        type: "Image",
        id: imageId,
        data: {
          ...ImagePropsDefaults,
          props: {
            src: UNSPLASH_SPLIT,
            alt: t("builder.pageBuilder.heroDefaults.split.imageAlt"),
            linkHref: null,
          },
          style: {
            ...ImagePropsDefaults.style,
            width: [{ value: { value: 100, unit: "%" } }],
            height: [{ value: { value: 100, unit: "%" } }],
            objectFit: [{ value: "cover" }],
          },
        },
      };
      return fluidSection(
        [imageBlock, heading, text, button],
        {
          [imageId]: {
            colStart: 1,
            colEnd: 13,
            rowStart: 1,
            rowEnd: 11,
            zIndex: 0,
          },
          ...splitCopyPlacements(heading.id, text.id, button.id),
        },
        {
          ...heroSectionStyle,
          minHeight: [{ value: { value: 24, unit: "rem" } }],
        },
        splitOverrides(imageId, heading.id, text.id, button.id),
      );
    },
  },

  HeroVideoBackground: {
    displayName:
      "builder.pageBuilder.templates.heroes.videoBackground" satisfies BaseAllKeys,
    icon: <MonitorPlay />,
    category: heroesCategory,
    previewImage: "/pages/templates/heroes/video-background.png",
    getBlock: (t) => {
      const { heading, text, button } = heroCopyBlocks(
        t,
        "builder.pageBuilder.heroDefaults.title",
        "builder.pageBuilder.heroDefaults.subtitle",
        { lightText: true },
      );
      return fluidSection(
        [heading, text, button],
        centeredCopyPlacements(heading.id, text.id, button.id),
        videoBackgroundStyle(UNSPLASH_VIDEO_POSTER, PEXELS_HERO_VIDEO, 40),
        centeredCopyOverrides(heading.id, text.id, button.id),
      );
    },
  },

  HeroMinimal: {
    displayName:
      "builder.pageBuilder.templates.heroes.minimal" satisfies BaseAllKeys,
    icon: <Sparkles />,
    category: heroesCategory,
    previewImage: "/pages/templates/heroes/minimal.png",
    getBlock: (t) => {
      const { heading, text, button } = heroCopyBlocks(
        t,
        "builder.pageBuilder.heroDefaults.minimal.title",
        "builder.pageBuilder.heroDefaults.minimal.subtitle",
        { titleFontSize: { value: 3.5, unit: "rem" } },
      );
      return fluidSection(
        [heading, text, button],
        centeredCopyPlacements(heading.id, text.id, button.id),
        {
          ...heroSectionStyle,
          backgroundColor: [{ value: COLORS.background.value }],
          minHeight: [{ value: { value: 24, unit: "rem" } }],
        },
        centeredCopyOverrides(heading.id, text.id, button.id),
      );
    },
  },

  HeroLeftOverlay: {
    displayName:
      "builder.pageBuilder.templates.heroes.leftOverlay" satisfies BaseAllKeys,
    icon: <PanelLeft />,
    category: heroesCategory,
    previewImage: "/pages/templates/heroes/left-overlay.png",
    getBlock: (t) => {
      const { heading, text, button } = heroCopyBlocks(
        t,
        "builder.pageBuilder.heroDefaults.leftOverlay.title",
        "builder.pageBuilder.heroDefaults.leftOverlay.subtitle",
        { textAlign: "left", lightText: true },
      );
      return fluidSection(
        [heading, text, button],
        leftOverlayPlacements(heading.id, text.id, button.id),
        imageBackgroundStyle(UNSPLASH_CENTERED, 50),
        leftOverlayOverrides(heading.id, text.id, button.id),
      );
    },
  },
};
