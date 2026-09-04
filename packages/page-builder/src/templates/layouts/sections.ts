import {
  generateId,
  type LayoutTemplateContext,
  type TEditorBlock,
} from "@hacado/builder";
import type { BaseAllKeys, I18nFn } from "@hacado/i18n";
import { BookingPropsDefaults } from "../../blocks/booking/modern/schema";
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
import { YouTubeVideoPropsDefaults } from "../../blocks/youtube-video/schema";
import {
  buttonPlacement,
  centeredCopyOverrides,
  centeredCopyPlacements,
  type CopyBlockOptions,
  FLUID_MOBILE_COLUMNS,
  fluidSection,
  heroSectionStyle,
  imageBackgroundStyle,
} from "../fluid-helpers";
import {
  bentoGrid,
  boxShadowValue,
  buildAccordion,
  buildBeforeAfter,
  buildBrowserCarousel,
  buildScrollingLogos,
  buildSectionIntro,
  COLORS,
  compositeContainer,
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

export { leftOverlayOverrides, leftOverlayPlacements };

function heroImageUrl(pack: WebsitePackDefinition): string {
  return pack.media.generic;
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
    options,
  );
}

function buildSplitHero(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  const imageId = generateId();
  const { heading, text, button } = packHeroCopy(pack, t, {
    textAlign: "left" as const,
  });
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
}

function buildCenteredHero(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  const { heading, text, button } = packHeroCopy(pack, t, {
    lightText: true,
  });
  return fluidSection(
    [heading, text, button],
    centeredCopyPlacements(heading.id, text.id, button.id),
    imageBackgroundStyle(heroImageUrl(pack), 45),
    centeredCopyOverrides(heading.id, text.id, button.id),
  );
}

function buildOverlayHero(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  const { heading, text, button } = packHeroCopy(pack, t, {
    textAlign: "left" as const,
    lightText: true,
  });
  return fluidSection(
    [heading, text, button],
    leftOverlayPlacements(heading.id, text.id, button.id),
    imageBackgroundStyle(heroImageUrl(pack), 50),
    leftOverlayOverrides(heading.id, text.id, button.id),
  );
}

function buildMinimalHero(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  const { heading, text, button } = packHeroCopy(pack, t, {
    titleFontSize: { value: 3.5, unit: "rem" as const },
  });
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
        borderRadius: [{ value: { value: 8, unit: "px" } }],
      },
    },
  };
}

function buildGalleryFirstHero(
  pack: WebsitePackDefinition,
  t: TFn,
): TEditorBlock {
  const images = pack.media.items
    .slice(0, 7)
    .map((item, index) =>
      galleryImage(item.src, t(k(pack.id, "home", "heroTitle")), 12),
    );
  const copy = compositeContainer(
    [
      headingFromText(t(k(pack.id, "home", "heroTitle")), {
        level: "h1",
        textAlign: "left",
      }),
      paragraphFromText(t(k(pack.id, "home", "heroSubtitle")), {
        textAlign: "left",
      }),
      buttonFromLabel(t(k(pack.id, "home", "bookCta"))),
    ],
    1,
  );
  return sectionShell([
    {
      type: "GridContainer",
      id: generateId(),
      data: {
        ...GridContainerPropsDefaults,
        props: { children: images },
      },
    },
    copy,
  ]);
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
  }

  if (text?.data?.props) {
    text.data.props.value = [{ type: "p", children: [{ text: body }] }];
    text.data.style.color = [{ value: COLORS["primary-foreground"].value }];
  }

  if (button) {
    const inlineText =
      button.data?.props?.children?.[0]?.data?.props?.children?.[0];
    if (inlineText?.data?.props) inlineText.data.props.text = ctaLabel;
    if (button.data?.props) button.data.props.url = "/book";

    button.data.style.backgroundColor = [{ value: COLORS["secondary"].value }];
    button.data.style.color = [{ value: COLORS["secondary-foreground"].value }];
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
      return [buildSplitHero(pack, t)];
    case "centered":
      return [buildCenteredHero(pack, t)];
    case "overlay":
    case "leftOverlay":
      return [buildOverlayHero(pack, t)];
    case "minimal":
      return [buildMinimalHero(pack, t)];
    case "galleryFirst":
      return [buildGalleryFirstHero(pack, t)];
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
        minHeight: [{ value: { value: 16, unit: "rem" } }],
        objectFit: [{ value: "cover" }],
        borderRadius: [{ value: { value: 12, unit: "px" } }],
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
    const image = serviceCoverImage(service, service.name);
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
      paragraphFromText(service.description, { textAlign: "left" }),
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
    galleryImage(item.src, t(k(pack.id, "home", "galleryTitle"))),
  );
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
  ]);
}

function buildCarousel(pack: WebsitePackDefinition, t: TFn): TEditorBlock {
  const slides = pack.media.items.slice(0, 4).map((item, index) => ({
    src: item.src,
    label: t(sk("carousel", `slide${index + 1}Label`)),
    addressBar: t(sk("carousel", `slide${index + 1}Address`)),
  }));
  return sectionShell([
    buildSectionIntro(t, {
      title: k(pack.id, "home", "lookInsideTitle"),
      body: k(pack.id, "home", "servicesBody"),
    }),
    buildBrowserCarousel(t, slides),
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
  return withBlockStyle(cta, {
    backgroundColor: [{ value: COLORS.primary.value }],
    color: [{ value: COLORS["primary-foreground"].value }],
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
    alignItems: [{ value: "center" }],
    textAlign: [{ value: "center" }],
  });
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
    case "carousel":
      return buildCarousel(pack, t);
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
  return [
    ...buildPackHero(pack, t, services),
    ...pack.homeMix.map((key) => buildHomeSection(key, pack, t, services)),
  ];
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
    case "video":
      return sectionShell([
        buildSectionIntro(t, {
          title: sk("video", "title"),
          body: sk("video", "body"),
        }),
        {
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
  const image = serviceCoverImage(selected, selected.name);
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
