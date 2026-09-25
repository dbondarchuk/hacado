import {
  generateId,
  type LayoutTemplateContext,
  type TEditorBlock,
} from "@hacado/builder";
import type { BaseAllKeys, I18nFn } from "@hacado/i18n";
import { BookingPropsDefaults } from "../../blocks/booking/modern/schema";
import { CarouselPropsDefaults } from "../../blocks/carousel/schema";
import {
  FLUID_COLUMNS,
  FLUID_TABLET_COLUMNS,
  type FluidPlacement,
  type FluidPlacementOverrides,
} from "../../blocks/fluid-layout/schema";
import { GridContainerPropsDefaults } from "../../blocks/grid-container/schema";
import { ImagePropsDefaults } from "../../blocks/image/schema";
import { LightboxPropsDefaults } from "../../blocks/lightbox/schema";
import { MarketingFeatureItemPropsDefaults } from "../../blocks/marketing-feature-item/schema";
import { TablePropsDefaults } from "../../blocks/table/schema";
import { VideoPropsDefaults } from "../../blocks/video/schema";
import { YouTubeVideoPropsDefaults } from "../../blocks/youtube-video/schema";
import {
  buttonPlacement,
  centeredCopyOverrides,
  centeredCopyPlacements,
  type CopyBlockOptions,
  FLUID_MOBILE_COLUMNS,
  fluidSection,
  fullBleedHeroStyle,
  heroSectionStyle,
  imageBackgroundStyle,
  videoBackgroundStyle,
} from "../fluid-helpers";
import {
  bentoGrid,
  boxShadowValue,
  buildAccordion,
  buildBeforeAfter,
  buildScrollingLogos,
  buildSectionIntro,
  COLORS,
  compositeContainer,
  entranceAnimation,
  flexFill,
  flexRow,
  logoImageCard,
  marketingBlock,
  responsiveCardsGrid,
  roundedLg,
  sectionShell,
  splitColumns,
  styledStatCell,
  styledStep,
  translateYRem,
  withBlockStyle,
  withEntrance,
} from "../section-helpers";
import { matchServiceImage } from "./media";
import {
  buttonFromLabel,
  headingFromText,
  heroCopyFromText,
  paragraphFromText,
} from "./text";
import type {
  PackHomeSection,
  PackMood,
  ResolvedLayoutService,
  WebsitePackDefinition,
  WebsitePackId,
} from "./types";

type TFn = I18nFn<undefined, undefined>;

export function k(packId: WebsitePackId, ...parts: string[]): BaseAllKeys {
  return `builder.pageBuilder.pageTemplates.${packId}.${parts.join(".")}` as BaseAllKeys;
}

function sk(...parts: string[]): BaseAllKeys {
  return `builder.pageBuilder.pageTemplates.shared.${parts.join(".")}` as BaseAllKeys;
}

export function resolveServices(
  pack: WebsitePackDefinition,
  t: TFn,
  ctx?: LayoutTemplateContext,
): ResolvedLayoutService[] {
  if (ctx?.services && ctx.services.length > 0) {
    return ctx.services.map((service) => ({
      ...service,
      imageUrl: service.imageUrl || matchServiceImage(pack.id, service.name),
    }));
  }
  return pack.demoServices.map((demo) => {
    const name = t(demo.nameKey);
    return {
      id: demo.id,
      name,
      description: t(demo.descriptionKey),
      slug: demo.slug,
      pageSlug: `service/${demo.slug}`,
      imageUrl: matchServiceImage(pack.id, name),
      keywords: demo.keywords,
    };
  });
}

/** Matches HeroLeftOverlay placements in heroes.tsx (bottom-left copy). */
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
        colStart: 2,
        colEnd: FLUID_TABLET_COLUMNS,
        rowStart: 6,
        rowEnd: 8,
        zIndex: 0,
      },
      [textId]: {
        colStart: 2,
        colEnd: FLUID_TABLET_COLUMNS,
        rowStart: 8,
        rowEnd: 10,
        zIndex: 0,
      },
      [buttonId]: buttonPlacement(2, 10, 0),
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
        colStart: 2,
        colEnd: FLUID_MOBILE_COLUMNS,
        rowStart: 7,
        rowEnd: 9,
        zIndex: 0,
      },
      [textId]: {
        colStart: 2,
        colEnd: FLUID_MOBILE_COLUMNS,
        rowStart: 9,
        rowEnd: 11,
        zIndex: 0,
      },
      [buttonId]: buttonPlacement(2, 11, 0, true),
    },
  };
}

export { leftOverlayOverrides, leftOverlayPlacements };

function heroImageUrl(pack: WebsitePackDefinition): string {
  return pack.media.generic;
}

/** Per-hero typography so packs don't share one display voice. */
function packHeroType(
  pack: WebsitePackDefinition,
  base: CopyBlockOptions = {},
): CopyBlockOptions {
  const display = "SECONDARY" as const;
  switch (pack.hero) {
    case "galleryFirst":
      return {
        ...base,
        textAlign: "left",
        titleFontSize: { value: 4.25, unit: "rem" },
        fontFamily: display ?? "HEAVY_SANS",
        fontWeight: "900",
        lineHeight: { value: 0.95, unit: "" },
        letterSpacing: { value: -0.04, unit: "rem" },
      };
    case "overlay":
      return {
        ...base,
        textAlign: "left",
        lightText: true,
        titleFontSize: { value: 4.5, unit: "rem" },
        fontFamily:
          display ?? (pack.mood === "dark" ? "HEAVY_SANS" : "MODERN_SANS"),
        fontWeight: "800",
        letterSpacing: { value: 0.02, unit: "rem" },
        lineHeight: { value: 1, unit: "" },
      };
    case "leftOverlay":
      return {
        ...base,
        textAlign: "left",
        lightText: true,
        titleFontSize: { value: 2.75, unit: "rem" },
        fontFamily: display ?? "MODERN_SERIF",
        fontWeight: "600",
        lineHeight: { value: 1.1, unit: "" },
      };
    case "video":
      return {
        ...base,
        lightText: true,
        textAlign: pack.mood === "muted" ? "left" : "center",
        titleFontSize: {
          value: pack.mood === "bold" ? 4 : 3.25,
          unit: "rem",
        },
        fontFamily:
          display ?? (pack.mood === "bold" ? "GEOMETRIC_SANS" : "BOOK_SERIF"),
        fontWeight: pack.mood === "bold" ? "800" : "500",
        letterSpacing:
          pack.mood === "bold"
            ? { value: -0.02, unit: "rem" }
            : { value: 0.01, unit: "rem" },
        lineHeight: { value: 1.05, unit: "" },
      };
    case "minimal":
      return {
        ...base,
        textAlign: "center",
        titleFontSize: { value: 4.75, unit: "rem" },
        fontFamily: display ?? "MODERN_SERIF",
        fontWeight: "400",
        lineHeight: { value: 1.05, unit: "" },
        letterSpacing: { value: -0.03, unit: "rem" },
      };
    case "split":
      return {
        ...base,
        textAlign: "left",
        titleFontSize: {
          value: pack.mood === "bold" ? 3.5 : 3.25,
          unit: "rem",
        },
        fontFamily:
          display ??
          (pack.mood === "bold"
            ? "ROUNDED_SANS"
            : pack.mood === "muted"
              ? "GEOMETRIC_SANS"
              : "BOOK_SERIF"),
        fontWeight: pack.mood === "bold" ? "700" : "600",
        lineHeight: { value: 1.1, unit: "" },
      };
    case "centered":
      return {
        ...base,
        lightText: true,
        titleFontSize: { value: 3.25, unit: "rem" },
        fontFamily: display ?? "MODERN_SANS",
        fontWeight: "700",
      };
    case "announcementSplit":
      return {
        ...base,
        textAlign: "left",
        titleFontSize: { value: 3.15, unit: "rem" },
        fontFamily: display ?? "ORGANIC_SANS",
        fontWeight: "600",
        lineHeight: { value: 1.15, unit: "" },
      };
    default:
      return base;
  }
}

function packHeroCopy(
  pack: WebsitePackDefinition,
  t: TFn,
  options: CopyBlockOptions = {},
) {
  return heroCopyFromText(
    t(k(pack.id, "home", "heroTitle")),
    t(k(pack.id, "home", "heroSubtitle")),
    t(k(pack.id, "home", "bookCta")),
    packHeroType(pack, options),
  );
}

function buildSplitHero(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  const imageId = generateId();
  const { heading, text, button } = packHeroCopy(pack, t);
  const pullQuote =
    pack.mood === "light"
      ? paragraphFromText(
          `“${t(`builder.pageBuilder.pageTemplates.packs.${pack.id}.tagline` as BaseAllKeys)}”`,
          { textAlign: "left" },
        )
      : null;
  // Stacked secondary photo for editorial / playful splits (coach, pet, home).
  const stackImage =
    pack.media.items[1] != null
      ? galleryImage(
          pack.media.items[1].src,
          t(k(pack.id, "home", "heroTitle")),
          14,
        )
      : null;
  const imageBlock: TEditorBlock = {
    type: "Image",
    id: imageId,
    data: {
      ...ImagePropsDefaults,
      props: {
        src: heroImageUrl(pack),
        alt: t(k(pack.id, "home", "heroTitle")),
        linkHref: null,
      },
      style: {
        ...ImagePropsDefaults.style,
        width: [{ value: { value: 100, unit: "%" } }],
        height: [{ value: { value: 100, unit: "%" } }],
        objectFit: [{ value: "cover" }],
        borderRadius: [{ value: { value: 24, unit: "px" } }],
      },
    },
  };
  const mediaColumn = stackImage
    ? compositeContainer([imageBlock, stackImage], 1)
    : imageBlock;
  const copyKids = pullQuote
    ? [heading, pullQuote, text, button]
    : [heading, text, button];
  const copy = compositeContainer(copyKids, 1, {
    alignItems: [{ value: "flex-start" }],
    justifyContent: [{ value: "center" }],
  });
  return sectionShell([splitColumns(copy, mediaColumn)], {
    minHeight: [{ value: { value: 28, unit: "rem" } }],
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
  });
}

function buildCenteredHero(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  const { heading, text, button } = packHeroCopy(pack, t);
  return withEntrance(
    fluidSection(
      [heading, text, button],
      centeredCopyPlacements(heading.id, text.id, button.id),
      imageBackgroundStyle(heroImageUrl(pack), {
        opacity: pack.mood === "dark" ? 50 : 32,
        fullBleed: true,
      }),
      centeredCopyOverrides(heading.id, text.id, button.id),
    ),
    0.1,
  );
}

/** Full-bleed editorial overlay — dark packs get denser scrim + display tracking. */
function buildOverlayHero(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  const { heading, text, button } = packHeroCopy(pack, t);
  const dark = pack.mood === "dark";
  return withEntrance(
    fluidSection(
      [heading, text, button],
      {
        [heading.id]: {
          colStart: 2,
          colEnd: 14,
          rowStart: dark ? 8 : 9,
          rowEnd: dark ? 11 : 12,
          zIndex: 1,
        },
        [text.id]: {
          colStart: 2,
          colEnd: 11,
          rowStart: dark ? 11 : 12,
          rowEnd: dark ? 13 : 14,
          zIndex: 1,
        },
        [button.id]: buttonPlacement(2, dark ? 13 : 14),
      },
      {
        ...fullBleedHeroStyle,
        ...imageBackgroundStyle(heroImageUrl(pack), {
          opacity: dark ? 22 : 34,
          fullBleed: true,
        }),
        ...(dark ? { backgroundColor: [{ value: "0 0% 4%" }] } : undefined),
        minHeight: [{ value: { value: 36, unit: "rem" } }],
      },
      {
        tablet: {
          [heading.id]: {
            colStart: 1,
            colEnd: FLUID_TABLET_COLUMNS + 1,
            rowStart: 6,
            rowEnd: 9,
            zIndex: 1,
          },
          [text.id]: {
            colStart: 1,
            colEnd: FLUID_TABLET_COLUMNS + 1,
            rowStart: 9,
            rowEnd: 11,
            zIndex: 1,
          },
          [button.id]: {
            colStart: 1,
            colEnd: Math.min(5, FLUID_TABLET_COLUMNS + 1),
            rowStart: 11,
            rowEnd: 12,
            zIndex: 1,
          },
        },
        mobile: {
          [heading.id]: {
            colStart: 1,
            colEnd: FLUID_MOBILE_COLUMNS + 1,
            rowStart: 5,
            rowEnd: 8,
            zIndex: 1,
          },
          [text.id]: {
            colStart: 1,
            colEnd: FLUID_MOBILE_COLUMNS + 1,
            rowStart: 8,
            rowEnd: 10,
            zIndex: 1,
          },
          [button.id]: {
            colStart: 1,
            colEnd: FLUID_MOBILE_COLUMNS + 1,
            rowStart: 10,
            rowEnd: 11,
            zIndex: 1,
          },
        },
      },
    ),
    0.1,
  );
}

/** Mid-viewport frosted panel over full-bleed media - matches HTML leftOverlay card. */
function buildLeftOverlayHero(
  pack: WebsitePackDefinition,
  t: TFn,
): TEditorBlock {
  const { heading, text, button } = packHeroCopy(pack, t);
  const whiteText = { color: [{ value: "0 0% 100%" }] };
  const panel = withBlockStyle(
    compositeContainer(
      [
        withBlockStyle(heading, whiteText),
        withBlockStyle(text, whiteText),
        withBlockStyle(button, {
          width: [{ value: "max-content" }],
          alignSelf: [{ value: "flex-start" }],
          flexGrow: [{ value: 0 }],
          flexShrink: [{ value: 0 }],
        }),
      ],
      1.25,
      {
        alignItems: [{ value: "flex-start" }],
        justifyContent: [{ value: "center" }],
        padding: [
          {
            value: {
              top: { value: 2.5, unit: "rem" },
              bottom: { value: 2.5, unit: "rem" },
              left: { value: 2.5, unit: "rem" },
              right: { value: 2.5, unit: "rem" },
            },
          },
        ],
        borderRadius: [{ value: { value: 24, unit: "px" } }],
        // HSL channels - hex breaks getColorStyle (`hsl(#000…)`).
        backgroundColor: [{ value: "0 0% 0%" }],
        backgroundColorOpacity: [{ value: 72 }],
        backdropFilter: [
          {
            value: {
              functions: [
                { function: "blur", values: [{ value: 12, unit: "px" }] },
              ],
            },
          },
        ],
        boxShadow: boxShadowValue(24, 48, -12, "0 0% 0%"),
        maxWidth: [{ value: { value: 32, unit: "rem" } }],
        width: [{ value: { value: 100, unit: "%" } }],
      },
    ),
    entranceAnimation(0.1, 0.7),
  );
  return fluidSection(
    [panel],
    {
      [panel.id]: {
        colStart: 2,
        colEnd: 13,
        rowStart: 5,
        rowEnd: 14,
        zIndex: 1,
      },
    },
    imageBackgroundStyle(heroImageUrl(pack), { opacity: 28, fullBleed: true }),
    {
      tablet: {
        [panel.id]: {
          colStart: 1,
          colEnd: 9,
          rowStart: 4,
          rowEnd: 14,
          zIndex: 1,
        },
      },
      mobile: {
        [panel.id]: {
          colStart: 1,
          colEnd: FLUID_MOBILE_COLUMNS + 1,
          rowStart: 4,
          rowEnd: 14,
          zIndex: 1,
        },
      },
    },
  );
}

const HERO_VIDEO_POSTER =
  "https://images.unsplash.com/photo-1468931467769-06a09c69aad3?auto=format&fit=crop&w=1920&q=80";
const HERO_VIDEO_SRC =
  "https://videos.pexels.com/video-files/1409899/1409899-uhd_2560_1440_25fps.mp4";

function buildVideoHero(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  const { heading, text, button } = packHeroCopy(pack, t);
  const bold = pack.mood === "bold";
  const muted = pack.mood === "muted";
  const placements = muted
    ? {
        [heading.id]: {
          colStart: 2,
          colEnd: 12,
          rowStart: 8,
          rowEnd: 11,
          zIndex: 1,
        },
        [text.id]: {
          colStart: 2,
          colEnd: 10,
          rowStart: 11,
          rowEnd: 13,
          zIndex: 1,
        },
        [button.id]: buttonPlacement(2, 13),
      }
    : centeredCopyPlacements(heading.id, text.id, button.id);
  const overrides = muted
    ? undefined
    : centeredCopyOverrides(heading.id, text.id, button.id);

  return withEntrance(
    fluidSection(
      [heading, text, button],
      placements,
      {
        ...fullBleedHeroStyle,
        ...videoBackgroundStyle(
          pack.media.generic || HERO_VIDEO_POSTER,
          HERO_VIDEO_SRC,
          { opacity: bold ? 28 : 48, fullBleed: true },
        ),
        minHeight: [{ value: { value: bold ? 38 : 32, unit: "rem" } }],
      },
      overrides,
    ),
    0.1,
  );
}

function buildMinimalHero(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  const { heading, text, button } = packHeroCopy(pack, t);
  return fluidSection(
    [heading, text, button],
    {
      [heading.id]: {
        colStart: 3,
        colEnd: 15,
        rowStart: 5,
        rowEnd: 9,
        zIndex: 1,
      },
      [text.id]: {
        colStart: 5,
        colEnd: 13,
        rowStart: 9,
        rowEnd: 11,
        zIndex: 1,
      },
      [button.id]: buttonPlacement(7, 11),
    },
    {
      ...heroSectionStyle,
      backgroundColor: [{ value: COLORS.background.value }],
      minHeight: [{ value: { value: 32, unit: "rem" } }],
      padding: [
        {
          value: {
            top: { value: 6, unit: "rem" },
            right: { value: 1.5, unit: "rem" },
            bottom: { value: 5, unit: "rem" },
            left: { value: 1.5, unit: "rem" },
          },
        },
      ],
    },
    centeredCopyOverrides(heading.id, text.id, button.id),
  );
}

function galleryImage(src: string, alt: string, heightRem = 12): TEditorBlock {
  return {
    type: "Image",
    id: generateId(),
    data: {
      ...ImagePropsDefaults,
      props: { src, alt, linkHref: null },
      style: {
        ...ImagePropsDefaults.style,
        width: [{ value: { value: 100, unit: "%" } }],
        height: [{ value: { value: heightRem, unit: "rem" } }],
        objectFit: [{ value: "cover" }],
        borderRadius: [{ value: { value: 16, unit: "px" } }],
      },
    },
  };
}

/** Typography-first + horizontal filmstrip — matches Series D HTML galleryFirst. */
function buildGalleryFirstHero(
  pack: WebsitePackDefinition,
  t: TFn,
): TEditorBlock {
  const type = packHeroType(pack);
  const heading = headingFromText(t(k(pack.id, "home", "heroTitle")), type);
  const text = paragraphFromText(t(k(pack.id, "home", "heroSubtitle")), {
    textAlign: "left",
  });
  const primary = buttonFromLabel(t(k(pack.id, "home", "bookCta")));
  const copyChildren: TEditorBlock[] = [];
  const city = pack.theme.city;

  if (city) {
    const eyebrow = paragraphFromText(city.toUpperCase(), {
      textAlign: "left",
    });
    eyebrow.data.style = {
      ...eyebrow.data.style,
      fontSize: [{ value: { value: 0.875, unit: "rem" } }],
      color: [{ value: COLORS["muted-foreground"].value }],
    };
    copyChildren.push(eyebrow);
  }

  copyChildren.push(heading, text);

  const secondary = buttonFromLabel(
    t(sk("viewServices")),
    "/services",
    "outline",
  );
  copyChildren.push(
    flexRow([primary, secondary], {
      gapRem: 0.75,
      justify: "flex-start",
      align: "center",
    }),
  );

  const copy = compositeContainer(copyChildren, 1.25, {
    alignItems: [{ value: "flex-start" }],
    maxWidth: [{ value: { value: 48, unit: "rem" } }],
  });
  const images = pack.media.items
    .slice(0, 8)
    .map((item) =>
      galleryImage(item.src, t(k(pack.id, "home", "heroTitle")), 20),
    );
  const carouselDefaults = CarouselPropsDefaults();
  const filmstrip = {
    type: "Carousel" as const,
    id: generateId(),
    data: {
      ...carouselDefaults,
      props: {
        ...carouselDefaults.props,
        autoPlay: 3,
        loop: true,
        navigation: false,
        children: images,
      },
      style: {
        ...carouselDefaults.style,
        width: [{ value: { value: 100, unit: "%" } }],
        carouselChildrenAlign: [{ value: "center" }],
        justifyItems: [{ value: "center" }],
        padding: [
          {
            value: {
              top: { value: 1, unit: "rem" },
              bottom: { value: 1, unit: "rem" },
              left: { value: 0, unit: "rem" },
              right: { value: 0, unit: "rem" },
            },
          },
        ],
        carouselChildrenItemsPerSlide: [
          { value: 1, breakpoint: [] },
          { value: 2, breakpoint: ["md"] },
          { value: 3, breakpoint: ["lg"] },
        ],
        margin: [
          {
            value: {
              top: { value: 2.5, unit: "rem" },
              bottom: { value: 0, unit: "rem" },
              left: { value: 0, unit: "rem" },
              right: { value: 0, unit: "rem" },
            },
          },
        ],
      },
    },
  };

  return sectionShell([copy, filmstrip], {
    padding: [
      {
        value: {
          top: { value: 2.5, unit: "rem" },
          bottom: { value: 2, unit: "rem" },
          left: { value: 1.5, unit: "rem" },
          right: { value: 1.5, unit: "rem" },
        },
      },
    ],
  });
}

function withBannerMessage(block: TEditorBlock, message: string): TEditorBlock {
  const text = block.data?.props?.children?.find(
    (child: TEditorBlock) => child.type === "InlineText",
  );
  if (text?.data?.props) {
    text.data.props.text = message;
  }
  return block;
}

function withCtaCopy(
  block: TEditorBlock,
  title: string,
  body: string,
  ctaLabel: string,
): TEditorBlock {
  const children = block.data?.props?.children as TEditorBlock[] | undefined;
  if (!children?.length) return block;
  const heading = children.find((c) => c.type === "Heading");
  const text = children.find((c) => c.type === "Text");
  const buttonHost = children.find((c) => c.type === "Container");
  const button = buttonHost?.data?.props?.children?.find(
    (c: TEditorBlock) => c.type === "Button",
  );

  if (heading) {
    const inline =
      heading.data?.props?.children?.[0]?.data?.props?.children?.[0];
    if (inline?.data?.props) inline.data.props.text = title;
    heading.data.style = {
      ...heading.data.style,
      color: [{ value: COLORS["primary-foreground"].value }],
      textAlign: [{ value: "center" }],
    };
  }

  if (text?.data?.props) {
    text.data.props.value = [{ type: "p", children: [{ text: body }] }];
    text.data.style = {
      ...text.data.style,
      color: [{ value: COLORS["primary-foreground"].value }],
    };
  }

  if (button) {
    const inlineText =
      button.data?.props?.children?.[0]?.data?.props?.children?.[0];
    if (inlineText?.data?.props) inlineText.data.props.text = ctaLabel;
    if (button.data?.props) button.data.props.url = "/book";

    button.data.style = {
      ...button.data.style,
      backgroundColor: [{ value: COLORS["secondary"].value }],
      color: [{ value: COLORS["secondary-foreground"].value }],
    };
  }

  return block;
}

function buildAnnouncementSplitHero(
  pack: WebsitePackDefinition,
  t: TFn,
): TEditorBlock[] {
  const banner = withBlockStyle(
    withBannerMessage(
      marketingBlock("Banner", t),
      t(k(pack.id, "home", "announcement")),
    ),
    {
      borderRadius: [{ value: { value: 0, unit: "px" } }],
      justifyContent: [{ value: "center" }],
    },
  );
  return [banner, buildSplitHero(pack, t)];
}

export function buildPackHero(
  pack: WebsitePackDefinition,
  t: TFn,
  _services: ResolvedLayoutService[],
): TEditorBlock[] {
  switch (pack.hero) {
    case "split":
      return [withEntrance(buildSplitHero(pack, t), 0.1)];
    case "centered":
      return [buildCenteredHero(pack, t)];
    case "overlay":
      return [buildOverlayHero(pack, t)];
    case "leftOverlay":
      return [buildLeftOverlayHero(pack, t)];
    case "video":
      return [buildVideoHero(pack, t)];
    case "minimal":
      return [withEntrance(buildMinimalHero(pack, t), 0.1)];
    case "galleryFirst":
      return [withEntrance(buildGalleryFirstHero(pack, t), 0.1)];
    case "announcementSplit":
      return buildAnnouncementSplitHero(pack, t);
    default:
      return [buildSplitHero(pack, t)];
  }
}

function serviceCoverImage(
  service: ResolvedLayoutService,
  alt: string,
  linkHref: string | null = null,
  heightRem = 12,
): TEditorBlock {
  return {
    type: "Image",
    id: generateId(),
    data: {
      ...ImagePropsDefaults,
      props: {
        src: service.imageUrl || "",
        alt,
        linkHref,
      },
      style: {
        ...ImagePropsDefaults.style,
        width: [{ value: { value: 100, unit: "%" } }],
        height: [{ value: { value: heightRem, unit: "rem" } }],
        minHeight: [{ value: { value: heightRem, unit: "rem" } }],
        objectFit: [{ value: "cover" }],
        borderRadius: [{ value: { value: 12, unit: "px" } }],
        flexShrink: [{ value: 0 }],
      },
    },
  };
}

function buildZigzag(
  pack: WebsitePackDefinition,
  t: TFn,
  services: ResolvedLayoutService[],
): TEditorBlock {
  const rows = services.map((service, index) => {
    const image = serviceCoverImage(service, service.name, null, 18);
    const copy = compositeContainer(
      [
        headingFromText(service.name, { level: "h3", textAlign: "left" }),
        paragraphFromText(service.description, { textAlign: "left" }),
        buttonFromLabel(t(sk("learnMore")), `/${service.pageSlug}`),
      ],
      0.75,
    );
    return index % 2 === 0
      ? splitColumns(image, copy)
      : splitColumns(copy, image);
  });
  return sectionShell([
    buildSectionIntro(t, {
      title: k(pack.id, "home", "servicesTitle"),
      body: k(pack.id, "home", "servicesBody"),
    }),
    ...rows,
  ]);
}

function serviceCard(service: ResolvedLayoutService, t: TFn): TEditorBlock {
  return compositeContainer(
    [
      serviceCoverImage(service, service.name, `/${service.pageSlug}`),
      headingFromText(service.name, { level: "h3", textAlign: "left" }),
      withBlockStyle(
        paragraphFromText(service.description, { textAlign: "left" }),
        { flexGrow: [{ value: 1 }] },
      ),
      buttonFromLabel(t(sk("learnMore")), `/${service.pageSlug}`),
    ],
    0.75,
    {
      padding: [
        {
          value: {
            top: { value: 1.25, unit: "rem" },
            bottom: { value: 1.25, unit: "rem" },
            left: { value: 1.25, unit: "rem" },
            right: { value: 1.25, unit: "rem" },
          },
        },
      ],
      backgroundColor: [{ value: COLORS.card.value }],
      borderStyle: [{ value: "solid" }],
      borderWidth: [{ value: { value: 1, unit: "px" } }],
      borderColor: [{ value: COLORS.border.value }],
      borderRadius: roundedLg(),
      boxShadow: boxShadowValue(6, 24, -6, COLORS.foreground.value),
      height: [{ value: { value: 100, unit: "%" } }],
      alignSelf: [{ value: "stretch" }],
    },
  );
}

function buildBento(
  pack: WebsitePackDefinition,
  t: TFn,
  services: ResolvedLayoutService[],
): TEditorBlock {
  return sectionShell(
    [
      buildSectionIntro(t, {
        title: k(pack.id, "home", "servicesTitle"),
        body: k(pack.id, "home", "servicesBody"),
      }),
      bentoGrid(services.map((service) => serviceCard(service, t))),
    ],
    {
      backgroundColor: [{ value: COLORS.muted.value }],
    },
  );
}

function buildFeatureList(
  pack: WebsitePackDefinition,
  t: TFn,
  services: ResolvedLayoutService[],
): TEditorBlock {
  const listItems = services.map((service) =>
    compositeContainer(
      [
        headingFromText(service.name, { level: "h3", textAlign: "left" }),
        paragraphFromText(service.description, { textAlign: "left" }),
      ],
      0.35,
      {
        padding: [
          {
            value: {
              top: { value: 1, unit: "rem" },
              bottom: { value: 1, unit: "rem" },
              left: { value: 1, unit: "rem" },
              right: { value: 1, unit: "rem" },
            },
          },
        ],
        borderStyle: [{ value: "solid" }],
        borderWidth: [{ value: { value: 1, unit: "px" } }],
        borderColor: [{ value: COLORS.border.value }],
        borderRadius: roundedLg(),
      },
    ),
  );
  const list = compositeContainer(
    [
      headingFromText(t(k(pack.id, "home", "servicesTitle")), {
        level: "h2",
        textAlign: "left",
      }),
      ...listItems,
    ],
    1,
  );
  const image = galleryImage(
    pack.media.items[0]?.src || pack.media.generic,
    t(k(pack.id, "home", "servicesTitle")),
    24,
  );
  return sectionShell([splitColumns(list, image)]);
}

function buildGallery(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  const images = pack.media.items.map((item) =>
    galleryImage(item.src, t(k(pack.id, "home", "galleryTitle")), 14),
  );
  return sectionShell(
    [
      buildSectionIntro(t, {
        title: k(pack.id, "home", "galleryTitle"),
        body: k(pack.id, "home", "servicesBody"),
      }),
      {
        type: "Lightbox",
        id: generateId(),
        data: {
          ...LightboxPropsDefaults,
          props: {
            ...LightboxPropsDefaults.props,
            children: [
              {
                type: "GridContainer",
                id: generateId(),
                data: {
                  ...GridContainerPropsDefaults,
                  props: { children: images },
                },
              },
            ],
          },
        },
      },
    ],
    pack.mood === "dark" ? { backgroundColor: [{ value: "240 5% 6%" }] } : {},
  );
}

/** Column stacks with staggered image heights (masonry lookbook). */
function buildGalleryMasonry(
  pack: WebsitePackDefinition,
  t: TFn,
): TEditorBlock {
  const alt = t(k(pack.id, "home", "galleryTitle"));
  const heights = [11, 17, 13, 19, 12, 16, 14, 18, 10, 15];
  const items = pack.media.items.slice(0, 9);
  const columns: TEditorBlock[][] = [[], [], []];

  items.forEach((item, index) => {
    columns[index % 3]!.push(
      galleryImage(item.src, alt, heights[index % heights.length]!),
    );
  });

  const columnBlocks = columns
    .filter((col) => col.length > 0)
    .map((col) =>
      compositeContainer(col, 1, {
        width: [{ value: { value: 100, unit: "%" } }],
        minWidth: [{ value: { value: 0, unit: "rem" } }],
      }),
    );

  return sectionShell(
    [
      buildSectionIntro(t, {
        title: k(pack.id, "home", "galleryTitle"),
        body: k(pack.id, "home", "servicesBody"),
      }),
      {
        type: "Lightbox",
        id: generateId(),
        data: {
          ...LightboxPropsDefaults,
          props: {
            ...LightboxPropsDefaults.props,
            children: [
              {
                type: "Container",
                id: generateId(),
                data: {
                  ...GridContainerPropsDefaults,
                  style: {
                    ...GridContainerPropsDefaults.style,
                    display: [{ value: "grid" }],
                    gridTemplateColumns: [
                      { value: "1fr" },
                      { value: "repeat(2, 1fr)", breakpoint: ["sm"] },
                      { value: "repeat(3, 1fr)", breakpoint: ["md"] },
                    ],
                    gap: [{ value: { value: 1, unit: "rem" } }],
                    alignItems: [{ value: "flex-start" }],
                    padding: [
                      {
                        value: {
                          top: { value: 0, unit: "rem" },
                          bottom: { value: 0, unit: "rem" },
                          left: { value: 0, unit: "rem" },
                          right: { value: 0, unit: "rem" },
                        },
                      },
                    ],
                  },
                  props: { children: columnBlocks },
                },
              },
            ],
          },
        },
      },
    ],
    pack.mood === "dark" ? { backgroundColor: [{ value: "240 5% 6%" }] } : {},
  );
}

function buildGalleryCarousel(
  pack: WebsitePackDefinition,
  t: TFn,
): TEditorBlock {
  const images = pack.media.items
    .slice(0, 8)
    .map((item) =>
      galleryImage(item.src, t(k(pack.id, "home", "galleryTitle")), 18),
    );
  const carouselDefaults = CarouselPropsDefaults();
  return sectionShell([
    buildSectionIntro(t, {
      title: k(pack.id, "home", "galleryTitle"),
      body: k(pack.id, "home", "servicesBody"),
    }),
    {
      type: "Lightbox",
      id: generateId(),
      data: {
        ...LightboxPropsDefaults,
        props: {
          ...LightboxPropsDefaults.props,
          children: [
            {
              type: "Carousel",
              id: generateId(),
              data: {
                ...carouselDefaults,
                props: {
                  ...carouselDefaults.props,
                  autoPlay: 5,
                  loop: true,
                  children: images,
                },
                style: {
                  ...carouselDefaults.style,
                  carouselChildrenAlign: [{ value: "center" }],
                  justifyItems: [{ value: "center" }],
                  padding: [
                    {
                      value: {
                        top: { value: 1, unit: "rem" },
                        bottom: { value: 1, unit: "rem" },
                        left: { value: 0, unit: "rem" },
                        right: { value: 0, unit: "rem" },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
  ]);
}

function serviceFilmstripCard(service: ResolvedLayoutService): TEditorBlock {
  const cover = serviceCoverImage(
    service,
    service.name,
    `/${service.pageSlug}`,
  );
  cover.data.style = {
    ...cover.data.style,
    height: [{ value: { value: 10, unit: "rem" } }],
    minHeight: [{ value: { value: 10, unit: "rem" } }],
    borderRadius: [{ value: { value: 0, unit: "px" } }],
  };
  return compositeContainer(
    [
      cover,
      compositeContainer(
        [
          headingFromText(service.name, { level: "h3", textAlign: "left" }),
          paragraphFromText(service.description, { textAlign: "left" }),
        ],
        0.35,
        {
          padding: [
            {
              value: {
                top: { value: 1, unit: "rem" },
                bottom: { value: 1, unit: "rem" },
                left: { value: 1, unit: "rem" },
                right: { value: 1, unit: "rem" },
              },
            },
          ],
        },
      ),
    ],
    0,
    {
      backgroundColor: [{ value: COLORS.card.value }],
      borderStyle: [{ value: "solid" }],
      borderWidth: [{ value: { value: 1, unit: "px" } }],
      borderColor: [{ value: COLORS.border.value }],
      borderRadius: roundedLg(),
      boxShadow: boxShadowValue(6, 24, -6, COLORS.foreground.value),
      overflow: [{ value: "hidden" }],
      maxWidth: [{ value: { value: 18, unit: "rem" } }],
      width: [{ value: { value: 100, unit: "%" } }],
      margin: [
        {
          value: {
            top: { value: 0, unit: "rem" },
            bottom: { value: 0, unit: "rem" },
            left: "auto",
            right: "auto",
          },
        },
      ],
    },
  );
}

function buildCarousel(
  pack: WebsitePackDefinition,
  t: TFn,
  services: ResolvedLayoutService[],
): TEditorBlock {
  const cards = services
    .slice(0, 4)
    .map((service) => serviceFilmstripCard(service));
  const carouselDefaults = CarouselPropsDefaults();
  return sectionShell([
    buildSectionIntro(t, {
      title: k(pack.id, "home", "servicesTitle"),
      body: k(pack.id, "home", "servicesBody"),
    }),
    {
      type: "Carousel",
      id: generateId(),
      data: {
        ...carouselDefaults,
        props: {
          ...carouselDefaults.props,
          autoPlay: 3,
          loop: true,
          navigation: false,
          children: cards,
        },
        style: {
          ...carouselDefaults.style,
          carouselChildrenAlign: [{ value: "center" }],
          justifyItems: [{ value: "center" }],
          padding: [
            {
              value: {
                top: { value: 1, unit: "rem" },
                bottom: { value: 1, unit: "rem" },
                left: { value: 0, unit: "rem" },
                right: { value: 0, unit: "rem" },
              },
            },
          ],
          carouselChildrenItemsPerSlide: [
            { value: 1, breakpoint: [] },
            { value: 2, breakpoint: ["md"] },
            { value: 3, breakpoint: ["lg"] },
          ],
        },
      },
    },
  ]);
}

function buildBeforeAfterSection(
  pack: WebsitePackDefinition,
  t: TFn,
): TEditorBlock {
  const before =
    pack.media.before || pack.media.items[0]?.src || pack.media.generic;
  const after =
    pack.media.after || pack.media.items[1]?.src || pack.media.generic;
  return sectionShell([
    buildSectionIntro(t, {
      title: sk("beforeAfter", "title"),
      body: sk("beforeAfter", "body"),
    }),
    buildBeforeAfter(
      before,
      after,
      t(sk("beforeAfter", "beforeAlt")),
      t(sk("beforeAfter", "afterAlt")),
    ),
  ]);
}

function buildTestimonials(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  return sectionShell([
    buildSectionIntro(t, {
      title: k(pack.id, "home", "testimonialsTitle"),
      body: k(pack.id, "home", "servicesBody"),
    }),
    responsiveCardsGrid(
      [1, 2, 3, 4].map(() =>
        withBlockStyle(marketingBlock("TestimonialCard", t), {
          backgroundColor: [{ value: COLORS.card.value }],
          boxShadow: boxShadowValue(8, 30, -8, COLORS.foreground.value),
          borderRadius: roundedLg(),
          height: [{ value: { value: 100, unit: "%" } }],
        }),
      ),
    ),
  ]);
}

function buildStats(_pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  return sectionShell(
    [
      buildSectionIntro(t, {
        title: sk("stats", "title"),
        body: sk("stats", "body"),
      }),
      responsiveCardsGrid(
        ([1, 2, 3, 4] as const).map((index) =>
          styledStatCell(
            t,
            {
              value: sk("stats", `stat${index}Value`),
              label: sk("stats", `stat${index}Label`),
              supporting: sk("stats", `stat${index}Supporting`),
            },
            { highlight: index === 2 },
          ),
        ),
      ),
    ],
    {
      backgroundColor: [{ value: COLORS.muted.value }],
    },
  );
}

function packLogos(pack: WebsitePackDefinition) {
  return pack.media.logos ?? [];
}

function buildLogoMarquee(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  return sectionShell([
    buildSectionIntro(t, {
      title: sk("logos", "title"),
      body: sk("logos", "body"),
    }),
    buildScrollingLogos(t, packLogos(pack)),
  ]);
}

function buildLogoCloud(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  return sectionShell([
    buildSectionIntro(t, {
      title: sk("logos", "title"),
      body: sk("logos", "body"),
    }),
    responsiveCardsGrid(
      packLogos(pack)
        .slice(0, 8)
        .map((logo) => logoImageCard(t, logo.src, logo.name)),
    ),
  ]);
}

function buildHowItWorks(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  return sectionShell([
    buildSectionIntro(t, {
      title: k(pack.id, "home", "howTitle"),
      body: k(pack.id, "home", "howBody"),
    }),
    responsiveCardsGrid([
      styledStep(t, {
        number: sk("how", "step1Number"),
        title: sk("how", "step1Title"),
        bullets: sk("how", "step1Bullets"),
      }),
      styledStep(t, {
        number: sk("how", "step2Number"),
        title: sk("how", "step2Title"),
        bullets: sk("how", "step2Bullets"),
      }),
      styledStep(t, {
        number: sk("how", "step3Number"),
        title: sk("how", "step3Title"),
        bullets: sk("how", "step3Bullets"),
      }),
      styledStep(t, {
        number: sk("how", "step4Number"),
        title: sk("how", "step4Title"),
        bullets: sk("how", "step4Bullets"),
      }),
    ]),
  ]);
}

function faqItems(
  pack: WebsitePackDefinition,
  count: number,
): Array<{ title: BaseAllKeys; content: BaseAllKeys }> {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return {
      title: k(pack.id, "home", `faqQ${n}`),
      content: k(pack.id, "home", `faqA${n}`),
    };
  });
}

function buildFaq(
  pack: WebsitePackDefinition,
  t: TFn,
  teaser = false,
): TEditorBlock {
  return sectionShell([
    buildSectionIntro(t, {
      title: k(pack.id, "home", "faqTitle"),
      body: k(pack.id, "home", "faqBody"),
    }),
    buildAccordion(t, faqItems(pack, teaser ? 2 : 4)),
  ]);
}

function buildPricing(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  const plans = [1, 2, 3].map(() => marketingBlock("PlanCard", t));
  plans[1] = withBlockStyle(plans[1], {
    borderColor: [{ value: COLORS.primary.value }],
    borderWidth: [{ value: { value: 2, unit: "px" } }],
    backgroundColor: [{ value: COLORS.card.value }],
    boxShadow: boxShadowValue(16, 40, -12, COLORS.primary.value),
    transform: translateYRem(-0.5),
  });
  return sectionShell(
    [
      buildSectionIntro(t, {
        title: k(pack.id, "home", "pricingTitle"),
        body: k(pack.id, "home", "servicesBody"),
      }),
      flexRow(
        plans.map((plan, index) =>
          withBlockStyle(plan, {
            ...flexFill(16),
            maxWidth: [{ value: { value: 22, unit: "rem" } }],
            borderRadius: roundedLg(),
            ...(index !== 1
              ? {
                  backgroundColor: [{ value: COLORS.card.value }],
                  borderStyle: [{ value: "solid" }],
                  borderWidth: [{ value: { value: 1, unit: "px" } }],
                  borderColor: [{ value: COLORS.border.value }],
                }
              : {}),
          }),
        ),
        { gapRem: 1.5, align: "stretch" },
      ),
    ],
    {
      backgroundColor: [{ value: COLORS.muted.value }],
    },
  );
}

function buildComparison(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  return sectionShell([
    buildSectionIntro(t, {
      title: k(pack.id, "home", "comparisonTitle"),
      body: k(pack.id, "home", "servicesBody"),
    }),
    {
      type: "Table",
      id: generateId(),
      data: TablePropsDefaults(t),
    },
  ]);
}

function buildFeaturesShowcase(
  pack: WebsitePackDefinition,
  t: TFn,
  services: ResolvedLayoutService[],
): TEditorBlock {
  const featureServices = services.slice(0, 4);
  if (featureServices.length > 0) {
    return sectionShell([
      buildSectionIntro(t, {
        title: k(pack.id, "home", "servicesTitle"),
        body: k(pack.id, "home", "servicesBody"),
      }),
      responsiveCardsGrid(
        featureServices.map((service) => serviceCard(service, t)),
      ),
    ]);
  }
  return compositeContainer([
    buildSectionIntro(t, {
      title: k(pack.id, "home", "servicesTitle"),
      body: k(pack.id, "home", "servicesBody"),
    }),
    {
      type: "MarketingFeaturesShowcase",
      id: generateId(),
      data: {
        style: {},
        props: {
          features: {
            children: Array.from({ length: 4 }, () => ({
              type: "MarketingFeatureItem",
              id: generateId(),
              data: MarketingFeatureItemPropsDefaults(t),
            })),
          },
        },
      },
    },
  ]);
}

function buildCta(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  const cta = withCtaCopy(
    marketingBlock("CtaBand", t),
    t(k(pack.id, "home", "ctaTitle")),
    t(k(pack.id, "home", "ctaBody")),
    t(k(pack.id, "home", "bookCta")),
  );
  // HTML: rounded primary band inside the page column — not a full-bleed shell.
  return sectionShell(
    [
      withBlockStyle(cta, {
        backgroundColor: [{ value: COLORS.primary.value }],
        color: [{ value: COLORS["primary-foreground"].value }],
        borderRadius: [{ value: { value: 24, unit: "px" } }],
        alignItems: [{ value: "center" }],
        textAlign: [{ value: "center" }],
        width: [{ value: { value: 100, unit: "%" } }],
        padding: [
          {
            value: {
              top: { value: 2.5, unit: "rem" },
              bottom: { value: 2.5, unit: "rem" },
              left: { value: 2, unit: "rem" },
              right: { value: 2, unit: "rem" },
            },
          },
        ],
      }),
    ],
    {
      padding: [
        {
          value: {
            top: { value: 2.5, unit: "rem" },
            bottom: { value: 2.5, unit: "rem" },
            left: { value: 1.5, unit: "rem" },
            right: { value: 1.5, unit: "rem" },
          },
        },
      ],
    },
  );
}

function buildVideoHomeSection(
  pack: WebsitePackDefinition,
  t: TFn,
): TEditorBlock {
  const videoSrc = pack.media.video;
  const videoBlock: TEditorBlock = videoSrc
    ? {
        type: "Video",
        id: generateId(),
        data: {
          ...VideoPropsDefaults,
          props: {
            ...VideoPropsDefaults.props,
            src: videoSrc,
            poster: pack.media.generic,
            controls: true,
            muted: true,
            loop: true,
            autoplay: false,
          },
          style: {
            ...VideoPropsDefaults.style,
            width: [{ value: { value: 100, unit: "%" } }],
            maxWidth: [{ value: { value: 100, unit: "%" } }],
            display: [{ value: "block" }],
            borderRadius: [{ value: { value: 24, unit: "px" } }],
            overflow: [{ value: "hidden" }],
          },
        },
      }
    : {
        type: "YouTubeVideo",
        id: generateId(),
        data: {
          ...YouTubeVideoPropsDefaults,
          props: {
            ...YouTubeVideoPropsDefaults.props,
            youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          },
        },
      };

  return sectionShell([
    buildSectionIntro(t, {
      title: sk("video", "title"),
      body: sk("video", "body"),
    }),
    videoBlock,
  ]);
}

function moodBandStyle(
  mood: PackMood | undefined,
  index: number,
  darkTheme = false,
): Record<string, unknown> {
  if (!mood) return {};

  // Dark pack themes use light foreground — never put light pastel bands under them.
  if (darkTheme || mood === "dark") {
    return index % 2 === 1
      ? {
          backgroundColor: [{ value: "240 6% 10%" }],
          color: [{ value: "0 0% 98%" }],
        }
      : {
          backgroundColor: [{ value: "240 5% 6%" }],
          color: [{ value: "0 0% 96%" }],
        };
  }

  if (mood === "muted") {
    return index % 2 === 1
      ? { backgroundColor: [{ value: COLORS.muted.value }] }
      : {};
  }
  if (mood === "bold") {
    return index % 2 === 1
      ? { backgroundColor: [{ value: "33 100% 96%" }] }
      : { backgroundColor: [{ value: COLORS.background.value }] };
  }
  return index % 2 === 1 ? { backgroundColor: [{ value: "210 40% 98%" }] } : {};
}

function packUsesMotion(pack: WebsitePackDefinition): boolean {
  if (pack.motion === false) return false;
  if (pack.motion === true) return true;
  return Boolean(pack.mood);
}

export function buildHomeSection(
  key: PackHomeSection,
  pack: WebsitePackDefinition,
  t: TFn,
  services: ResolvedLayoutService[],
): TEditorBlock {
  switch (key) {
    case "zigzag":
      return buildZigzag(pack, t, services);
    case "bento":
      return buildBento(pack, t, services);
    case "featureList":
      return buildFeatureList(pack, t, services);
    case "gallery":
      return buildGallery(pack, t);
    case "galleryMasonry":
      return buildGalleryMasonry(pack, t);
    case "galleryCarousel":
      return buildGalleryCarousel(pack, t);
    case "carousel":
      return buildCarousel(pack, t, services);
    case "beforeAfter":
      return buildBeforeAfterSection(pack, t);
    case "testimonials":
      return buildTestimonials(pack, t);
    case "stats":
      return buildStats(pack, t);
    case "logoMarquee":
      return buildLogoMarquee(pack, t);
    case "logoCloud":
      return buildLogoCloud(pack, t);
    case "howItWorks":
      return buildHowItWorks(pack, t);
    case "faq":
      return buildFaq(pack, t, false);
    case "faqTeaser":
      return buildFaq(pack, t, true);
    case "pricing":
      return buildPricing(pack, t);
    case "comparison":
      return buildComparison(pack, t);
    case "featuresShowcase":
      return buildFeaturesShowcase(pack, t, services);
    case "video":
      return buildVideoHomeSection(pack, t);
    case "cta":
      return buildCta(pack, t);
    default:
      return buildCta(pack, t);
  }
}

export function composeHome(
  pack: WebsitePackDefinition,
  t: TFn,
  ctx?: LayoutTemplateContext,
): TEditorBlock[] {
  const services = resolveServices(pack, t, ctx);
  const motion = packUsesMotion(pack);
  let bandIndex = 0;

  const sections = pack.homeMix.map((key, index) => {
    let block = buildHomeSection(key, pack, t, services);

    if (!block.data?.style?.backgroundColor) {
      const band = moodBandStyle(pack.mood, bandIndex, pack.theme.dark);
      if (Object.keys(band).length > 0) {
        block = withBlockStyle(block, band);
        bandIndex++;
      }
    }

    if (motion) {
      block = withEntrance(block, index * 0.1);
    }

    return block;
  });

  return [...buildPackHero(pack, t, services), ...sections];
}

export function composeBooking(
  pack: WebsitePackDefinition,
  t: TFn,
  ctx?: LayoutTemplateContext,
): TEditorBlock[] {
  resolveServices(pack, t, ctx);
  const copy = compositeContainer(
    [
      headingFromText(t(k(pack.id, "booking", "title")), {
        level: "h1",
        textAlign: "center",
      }),
      paragraphFromText(t(k(pack.id, "booking", "body")), {
        textAlign: "center",
      }),
    ],
    1,
  );
  const booking: TEditorBlock = {
    type: "BookingModern",
    id: generateId(),
    data: BookingPropsDefaults,
  };
  return [
    sectionShell([splitColumns(copy, booking)]),
    buildHowItWorks(pack, t),
    buildFaq(pack, t, false),
  ];
}

function buildServiceExtra(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  switch (pack.serviceExtra) {
    case "beforeAfter":
      return buildBeforeAfterSection(pack, t);
    case "gallery":
      return buildGallery(pack, t);
    case "galleryMasonry":
      return buildGalleryMasonry(pack, t);
    case "galleryCarousel":
      return buildGalleryCarousel(pack, t);
    case "video":
      return sectionShell([
        buildSectionIntro(t, {
          title: sk("video", "title"),
          body: sk("video", "body"),
        }),
        pack.media.video
          ? {
              type: "Video",
              id: generateId(),
              data: {
                ...VideoPropsDefaults,
                props: {
                  ...VideoPropsDefaults.props,
                  src: pack.media.video,
                  poster: pack.media.generic,
                  controls: true,
                  muted: true,
                },
                style: {
                  ...VideoPropsDefaults.style,
                  width: [{ value: { value: 100, unit: "%" } }],
                  maxWidth: [{ value: { value: 100, unit: "%" } }],
                  display: [{ value: "block" }],
                  borderRadius: [{ value: { value: 24, unit: "px" } }],
                  overflow: [{ value: "hidden" }],
                },
              },
            }
          : {
              type: "YouTubeVideo",
              id: generateId(),
              data: {
                ...YouTubeVideoPropsDefaults,
                props: {
                  ...YouTubeVideoPropsDefaults.props,
                  youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                },
              },
            },
      ]);
    default:
      return buildGallery(pack, t);
  }
}

export function composeService(
  pack: WebsitePackDefinition,
  t: TFn,
  ctx?: LayoutTemplateContext,
  service?: ResolvedLayoutService,
): TEditorBlock[] {
  const services = resolveServices(pack, t, ctx);
  const selected = service ?? services[0];
  if (!selected) {
    return [buildCta(pack, t)];
  }
  const image = serviceCoverImage(selected, selected.name, null, 22);
  const bullets = compositeContainer(
    [1, 2, 3].map((n) =>
      paragraphFromText(`• ${t(k(pack.id, "service", `bullet${n}`))}`, {
        textAlign: "left",
      }),
    ),
    0.35,
  );
  const copy = compositeContainer(
    [
      headingFromText(selected.name, { level: "h1", textAlign: "left" }),
      paragraphFromText(selected.description, { textAlign: "left" }),
      bullets,
      buttonFromLabel(t(sk("bookService")), "/book"),
    ],
    1,
  );
  return [
    sectionShell([splitColumns(image, copy)]),
    buildServiceExtra(pack, t),
    buildCta(pack, t),
  ];
}

export function composeAbout(
  pack: WebsitePackDefinition,
  t: TFn,
  ctx?: LayoutTemplateContext,
): TEditorBlock[] {
  resolveServices(pack, t, ctx);
  const intro = sectionShell([
    headingFromText(t(k(pack.id, "about", "title")), {
      level: "h1",
      textAlign: "left",
    }),
    paragraphFromText(t(k(pack.id, "about", "body1")), {
      textAlign: "left",
    }),
    paragraphFromText(t(k(pack.id, "about", "body2")), {
      textAlign: "left",
    }),
  ]);
  return [
    intro,
    buildStats(pack, t),
    buildTestimonials(pack, t),
    buildCta(pack, t),
  ];
}

function policyBlock(title: string, body: string): TEditorBlock {
  return compositeContainer(
    [
      headingFromText(title, { level: "h2", textAlign: "left" }),
      paragraphFromText(body, { textAlign: "left" }),
    ],
    0.75,
  );
}

export function composeTerms(
  pack: WebsitePackDefinition,
  t: TFn,
  _ctx?: LayoutTemplateContext,
): TEditorBlock[] {
  return [
    sectionShell([
      headingFromText(t(k(pack.id, "terms", "title")), {
        level: "h1",
        textAlign: "left",
      }),
      paragraphFromText(t(k(pack.id, "terms", "intro")), {
        textAlign: "left",
      }),
      policyBlock(
        t(k(pack.id, "terms", "appointmentsTitle")),
        t(k(pack.id, "terms", "appointmentsBody")),
      ),
      policyBlock(
        t(k(pack.id, "terms", "cancelTitle")),
        t(k(pack.id, "terms", "cancelBody")),
      ),
      policyBlock(
        t(k(pack.id, "terms", "paymentsTitle")),
        t(k(pack.id, "terms", "paymentsBody")),
      ),
      policyBlock(
        t(k(pack.id, "terms", "liabilityTitle")),
        t(k(pack.id, "terms", "liabilityBody")),
      ),
      policyBlock(
        t(k(pack.id, "terms", "contactTitle")),
        t(k(pack.id, "terms", "contactBody")),
      ),
    ]),
  ];
}
