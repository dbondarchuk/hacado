import {
  generateId,
  TEditorBlock,
  TemplatesConfiguration,
} from "@hacado/builder";
import type { BaseAllKeys } from "@hacado/i18n";
import { COLORS } from "@hacado/page-builder-base/style";
import {
  LayoutTemplate,
  MonitorPlay,
  PanelLeft,
  Sparkles,
  SplitSquareHorizontal,
} from "lucide-react";
import {
  FLUID_COLUMNS,
  FLUID_MOBILE_COLUMNS,
  FLUID_TABLET_COLUMNS,
  FluidPlacementOverrides,
} from "../blocks/fluid-layout/schema";
import { ImagePropsDefaults } from "../blocks/image/schema";
import {
  buttonPlacement,
  centeredCopyOverrides,
  centeredCopyPlacements,
  fluidSection,
  heroCopyBlocks,
  heroSectionStyle,
  imageBackgroundStyle,
  videoBackgroundStyle,
} from "./fluid-helpers";
import { heroTemplatePreviewPath } from "./preview-manifest";

const heroesCategory =
  "builder.pageBuilder.blocks.categories.heroes" satisfies BaseAllKeys;

const UNSPLASH_CENTERED =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80";
const UNSPLASH_SPLIT =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80";
const UNSPLASH_VIDEO_POSTER =
  "https://images.unsplash.com/photo-1468931467769-06a09c69aad3?auto=format&fit=crop&w=1920&q=80";
const PEXELS_HERO_VIDEO =
  "https://videos.pexels.com/video-files/1409899/1409899-uhd_2560_1440_25fps.mp4";

function leftOverlayPlacements(
  headingId: string,
  textId: string,
  buttonId: string,
): Record<string, import("../blocks/fluid-layout/schema").FluidPlacement> {
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
): Record<string, import("../blocks/fluid-layout/schema").FluidPlacement> {
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
    previewImage: heroTemplatePreviewPath("centered-image.png"),
    allowedBuilderTypes: ["page"],
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
    previewImage: heroTemplatePreviewPath("split-image.png"),
    allowedBuilderTypes: ["page"],
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
    previewImage: heroTemplatePreviewPath("video-background.png"),
    allowedBuilderTypes: ["page"],
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
    previewImage: heroTemplatePreviewPath("minimal.png"),
    allowedBuilderTypes: ["page"],
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
    previewImage: heroTemplatePreviewPath("left-overlay.png"),
    allowedBuilderTypes: ["page"],
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
