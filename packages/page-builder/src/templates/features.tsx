import { generateId, TemplatesConfiguration } from "@hacado/builder";
import type { BaseAllKeys, I18nFn } from "@hacado/i18n";
import { Grid2x2, LayoutGrid, List, Sparkles } from "lucide-react";
import { FLUID_MOBILE_COLUMNS } from "../blocks/fluid-layout/schema";
import { IconPropsDefaults } from "../blocks/icon/schema";
import { ImagePropsDefaults } from "../blocks/image/schema";
import { MarketingFeatureItemPropsDefaults } from "../blocks/marketing-feature-item/schema";
import {
  bodyText,
  columnPlacement,
  fluidSection,
  titleHeading,
} from "./fluid-helpers";
import { sectionTemplatePreviewPath } from "./preview-manifest";
import {
  bentoGrid,
  boxShadowValue,
  buildSectionIntro,
  COLORS,
  compositeContainer,
  roundedLg,
  sectionShell,
} from "./section-helpers";
import { SALON_IMAGES } from "./template-media";

const category =
  "builder.pageBuilder.blocks.categories.features" satisfies BaseAllKeys;

const prefix = "builder.pageBuilder.sectionDefaults.features";

function bentoTile(
  t: I18nFn<undefined, undefined>,
  titleKey: BaseAllKeys,
  bodyKey: BaseAllKeys,
  options: { icon?: string; includeIcon?: boolean } = {},
) {
  const { icon = "sparkles", includeIcon = true } = options;
  const children: ReturnType<
    typeof compositeContainer
  >["data"]["props"]["children"] = [];
  if (includeIcon) {
    children.push({
      type: "Icon",
      id: generateId(),
      data: {
        ...IconPropsDefaults,
        props: { icon },
        style: {
          ...IconPropsDefaults.style,
          width: [{ value: { value: 1.5, unit: "rem" } }],
          height: [{ value: { value: 1.5, unit: "rem" } }],
          color: [{ value: COLORS.primary.value }],
        },
      },
    });
  }
  children.push(
    titleHeading(t, titleKey, { level: "h3", textAlign: "left" }),
    bodyText(t, bodyKey, { textAlign: "left" }),
  );
  return compositeContainer(children, 0.75, {
    padding: [
      {
        value: {
          top: { value: 1.5, unit: "rem" },
          bottom: { value: 1.5, unit: "rem" },
          left: { value: 1.5, unit: "rem" },
          right: { value: 1.5, unit: "rem" },
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
  });
}

export const featuresEditorTemplates: TemplatesConfiguration = {
  FeaturesShowcaseSection: {
    displayName:
      "builder.pageBuilder.templates.features.featuresShowcase" satisfies BaseAllKeys,
    icon: <Sparkles />,
    category,
    previewImage: sectionTemplatePreviewPath("features-showcase.png"),
    allowedBuilderTypes: ["page"],
    getBlock: (t) =>
      compositeContainer([
        buildSectionIntro(t, {
          eyebrow: `${prefix}.featuresShowcase.eyebrow` as BaseAllKeys,
          title: `${prefix}.featuresShowcase.title` as BaseAllKeys,
          body: `${prefix}.featuresShowcase.body` as BaseAllKeys,
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
      ]),
  },

  FeaturesBento: {
    displayName:
      "builder.pageBuilder.templates.features.featuresBento" satisfies BaseAllKeys,
    icon: <Grid2x2 />,
    category,
    previewImage: sectionTemplatePreviewPath("features-bento.png"),
    allowedBuilderTypes: ["page"],
    getBlock: (t) =>
      sectionShell(
        [
          buildSectionIntro(t, {
            title: `${prefix}.featuresBento.title` as BaseAllKeys,
            body: `${prefix}.featuresBento.body` as BaseAllKeys,
          }),
          bentoGrid([
            bentoTile(
              t,
              `${prefix}.featuresBento.tile1Title` as BaseAllKeys,
              `${prefix}.featuresBento.tile1Body` as BaseAllKeys,
              { icon: "calendar" },
            ),
            bentoTile(
              t,
              `${prefix}.featuresBento.tile2Title` as BaseAllKeys,
              `${prefix}.featuresBento.tile2Body` as BaseAllKeys,
              { icon: "bell" },
            ),
            bentoTile(
              t,
              `${prefix}.featuresBento.tile3Title` as BaseAllKeys,
              `${prefix}.featuresBento.tile3Body` as BaseAllKeys,
              { icon: "credit-card" },
            ),
            bentoTile(
              t,
              `${prefix}.featuresBento.tile4Title` as BaseAllKeys,
              `${prefix}.featuresBento.tile4Body` as BaseAllKeys,
              { icon: "smartphone" },
            ),
          ]),
        ],
        {
          backgroundColor: [{ value: COLORS.muted.value }],
        },
      ),
  },

  ZigzagFeature: {
    displayName:
      "builder.pageBuilder.templates.features.zigzagFeature" satisfies BaseAllKeys,
    icon: <LayoutGrid />,
    category,
    previewImage: sectionTemplatePreviewPath("zigzag-feature.png"),
    allowedBuilderTypes: ["page"],
    getBlock: (t) => {
      const image1 = {
        type: "Image" as const,
        id: generateId(),
        data: {
          ...ImagePropsDefaults,
          props: {
            src: SALON_IMAGES.interior,
            alt: t(`${prefix}.zigzagFeature.image1Alt` as BaseAllKeys),
            linkHref: null,
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
      const image2 = {
        type: "Image" as const,
        id: generateId(),
        data: {
          ...ImagePropsDefaults,
          props: {
            src: SALON_IMAGES.styling,
            alt: t(`${prefix}.zigzagFeature.image2Alt` as BaseAllKeys),
            linkHref: null,
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
      const copy1 = compositeContainer([
        titleHeading(t, `${prefix}.zigzagFeature.row1Title` as BaseAllKeys, {
          level: "h3",
          textAlign: "left",
        }),
        bodyText(t, `${prefix}.zigzagFeature.row1Body` as BaseAllKeys, {
          textAlign: "left",
        }),
      ]);
      const copy2 = compositeContainer([
        titleHeading(t, `${prefix}.zigzagFeature.row2Title` as BaseAllKeys, {
          level: "h3",
          textAlign: "left",
        }),
        bodyText(t, `${prefix}.zigzagFeature.row2Body` as BaseAllKeys, {
          textAlign: "left",
        }),
      ]);
      return fluidSection(
        [image1, copy1, copy2, image2],
        {
          [image1.id]: columnPlacement(1, 11, 1, 8),
          [copy1.id]: columnPlacement(13, 12, 1, 8),
          [copy2.id]: columnPlacement(1, 12, 9, 16),
          [image2.id]: columnPlacement(13, 12, 9, 16),
        },
        undefined,
        {
          tablet: {
            [image1.id]: columnPlacement(1, 12, 1, 6),
            [copy1.id]: columnPlacement(1, 12, 6, 10),
            [copy2.id]: columnPlacement(1, 12, 10, 14),
            [image2.id]: columnPlacement(1, 12, 14, 19),
          },
          mobile: {
            [image1.id]: {
              colStart: 1,
              colEnd: FLUID_MOBILE_COLUMNS + 1,
              rowStart: 1,
              rowEnd: 5,
              zIndex: 0,
            },
            [copy1.id]: {
              colStart: 1,
              colEnd: FLUID_MOBILE_COLUMNS + 1,
              rowStart: 5,
              rowEnd: 9,
              zIndex: 0,
            },
            [image2.id]: {
              colStart: 1,
              colEnd: FLUID_MOBILE_COLUMNS + 1,
              rowStart: 9,
              rowEnd: 13,
              zIndex: 0,
            },
            [copy2.id]: {
              colStart: 1,
              colEnd: FLUID_MOBILE_COLUMNS + 1,
              rowStart: 13,
              rowEnd: 17,
              zIndex: 0,
            },
          },
        },
      );
    },
  },

  FeatureListWithImage: {
    displayName:
      "builder.pageBuilder.templates.features.featureListWithImage" satisfies BaseAllKeys,
    icon: <List />,
    category,
    previewImage: sectionTemplatePreviewPath("feature-list-with-image.png"),
    allowedBuilderTypes: ["page"],
    getBlock: (t) => {
      const heading = titleHeading(
        t,
        `${prefix}.featureListWithImage.title` as BaseAllKeys,
        { level: "h2", textAlign: "left" },
      );
      const list = bodyText(
        t,
        `${prefix}.featureListWithImage.list` as BaseAllKeys,
        { textAlign: "left" },
      );
      const image = {
        type: "Image" as const,
        id: generateId(),
        data: {
          ...ImagePropsDefaults,
          props: {
            src: SALON_IMAGES.chair,
            alt: t(`${prefix}.featureListWithImage.imageAlt` as BaseAllKeys),
            linkHref: null,
          },
          style: {
            ...ImagePropsDefaults.style,
            width: [{ value: { value: 100, unit: "%" } }],
            minHeight: [{ value: { value: 20, unit: "rem" } }],
            objectFit: [{ value: "cover" }],
            borderRadius: [{ value: { value: 12, unit: "px" } }],
          },
        },
      };
      return fluidSection(
        [heading, list, image],
        {
          [heading.id]: columnPlacement(1, 11, 1, 4),
          [list.id]: columnPlacement(1, 11, 4, 12),
          [image.id]: columnPlacement(13, 12, 1, 12),
        },
        undefined,
        {
          tablet: {
            [heading.id]: columnPlacement(1, 12, 1, 3),
            [list.id]: columnPlacement(1, 12, 3, 9),
            [image.id]: columnPlacement(1, 12, 9, 17),
          },
          mobile: {
            [heading.id]: {
              colStart: 1,
              colEnd: FLUID_MOBILE_COLUMNS + 1,
              rowStart: 1,
              rowEnd: 3,
              zIndex: 0,
            },
            [list.id]: {
              colStart: 1,
              colEnd: FLUID_MOBILE_COLUMNS + 1,
              rowStart: 3,
              rowEnd: 9,
              zIndex: 0,
            },
            [image.id]: {
              colStart: 1,
              colEnd: FLUID_MOBILE_COLUMNS + 1,
              rowStart: 9,
              rowEnd: 17,
              zIndex: 0,
            },
          },
        },
      );
    },
  },
};
