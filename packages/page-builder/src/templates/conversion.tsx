import {
  generateId,
  TEditorBlock,
  TemplatesConfiguration,
} from "@hacado/builder";
import type { BaseAllKeys, I18nFn } from "@hacado/i18n";
import { COLORS } from "@hacado/page-builder-base/style";
import { Cookie, CreditCard, Flag, Megaphone } from "lucide-react";
import { ButtonPropsDefaults } from "../blocks/button";
import {
  FLUID_DEFAULT_GAP,
  FLUID_DEFAULT_ROW_HEIGHT,
  FLUID_MOBILE_COLUMNS,
  FLUID_TABLET_COLUMNS,
} from "../blocks/fluid-layout/schema";
import { InlineContainerPropsDefaults } from "../blocks/inline-container";
import { InlineTextPropsDefaults } from "../blocks/inline-text";
import { StickyBannerPropsDefaults } from "../blocks/sticky-banner";
import {
  fluidSection,
  fullWidthPlacement,
  imageBackgroundStyle,
} from "./fluid-helpers";
import { sectionTemplatePreviewPath } from "./preview-manifest";
import {
  boxShadowValue,
  buildSectionIntro,
  compositeContainer,
  flexFill,
  flexRow,
  marketingBlock,
  roundedLg,
  sectionShell,
  translateYRem,
  withBlockStyle,
} from "./section-helpers";

const category =
  "builder.pageBuilder.blocks.categories.conversion" satisfies BaseAllKeys;

const prefix = "builder.pageBuilder.sectionDefaults.conversion";

const CTA_BACKGROUND =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1920&q=80";

function cookieAcknowledgmentBanner(
  t: I18nFn<undefined, undefined>,
): TEditorBlock {
  const defaults = StickyBannerPropsDefaults();
  const messageId = generateId();
  const buttonId = generateId();
  const fluidId = generateId();

  const btn = structuredClone(ButtonPropsDefaults());
  const label = t(`${prefix}.cookieAcknowledgmentBanner.button` as BaseAllKeys);
  const inlineText = (btn as any).props?.children?.[0]?.data?.props
    ?.children?.[0];
  if (inlineText?.data?.props) {
    inlineText.data.props.text = label;
  }

  return {
    type: "StickyBanner",
    id: generateId(),
    data: {
      ...defaults,
      style: {
        ...defaults.style,
        backgroundColor: [{ value: COLORS.muted.value }],
        boxShadow: boxShadowValue(0, 8, 0, COLORS.foreground.value),
        padding: [
          {
            value: {
              top: { value: 0, unit: "rem" },
              right: { value: 2.5, unit: "rem" },
              bottom: { value: 0, unit: "rem" },
              left: { value: 0, unit: "rem" },
            },
          },
        ],
      },
      props: {
        show: "one-time",
        position: "bottom",
        showCloseButton: true,
        content: {
          children: [
            {
              type: "FluidLayout",
              id: fluidId,
              data: {
                style: {
                  padding: [
                    {
                      value: {
                        top: { value: 1, unit: "rem" },
                        right: { value: 1.5, unit: "rem" },
                        bottom: { value: 1, unit: "rem" },
                        left: { value: 1.5, unit: "rem" },
                      },
                    },
                  ],
                  width: [{ value: { value: 100, unit: "%" } }],
                  minHeight: [{ value: { value: 3.5, unit: "rem" } }],
                  alignItems: [{ value: "center" }],
                },
                props: {
                  children: [
                    {
                      type: "InlineText",
                      id: messageId,
                      data: {
                        ...InlineTextPropsDefaults,
                        props: {
                          text: t(
                            `${prefix}.cookieAcknowledgmentBanner.message` as BaseAllKeys,
                          ),
                        },
                        style: {
                          fontSize: [{ value: { value: 0.875, unit: "rem" } }],
                          fontWeight: [{ value: "500" }],
                          display: [{ value: "block" }],
                          width: [{ value: { value: 100, unit: "%" } }],
                          alignContent: [{ value: "center" }],
                          textAlign: [{ value: "center" }],
                        },
                      },
                    },
                    {
                      type: "Button",
                      id: buttonId,
                      data: {
                        ...btn,
                        props: {
                          type: "action",
                          action: "close-current-banner",
                          children: btn.props?.children ?? [
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
                                        props: { text: label },
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          ],
                        },
                        style: {
                          ...btn.style,
                          fontSize: [{ value: { value: 0.875, unit: "rem" } }],
                          padding: [
                            {
                              value: {
                                top: { value: 0.5, unit: "rem" },
                                right: { value: 1, unit: "rem" },
                                bottom: { value: 0.5, unit: "rem" },
                                left: { value: 1, unit: "rem" },
                              },
                            },
                          ],
                          justifySelf: [{ value: "end" }],
                          alignSelf: [{ value: "center" }],
                        },
                      },
                    },
                  ],
                  placements: {
                    [messageId]: {
                      colStart: 1,
                      colEnd: 20,
                      rowStart: 1,
                      rowEnd: 2,
                      zIndex: 0,
                    },
                    [buttonId]: {
                      colStart: 20,
                      colEnd: 25,
                      rowStart: 1,
                      rowEnd: 2,
                      zIndex: 1,
                    },
                  },
                  placementOverrides: {
                    tablet: {
                      [messageId]: {
                        colStart: 1,
                        colEnd: 9,
                        rowStart: 1,
                        rowEnd: 2,
                        zIndex: 0,
                      },
                      [buttonId]: {
                        colStart: 9,
                        colEnd: FLUID_TABLET_COLUMNS + 1,
                        rowStart: 1,
                        rowEnd: 2,
                        zIndex: 1,
                      },
                    },
                    mobile: {
                      [messageId]: {
                        colStart: 1,
                        colEnd: FLUID_MOBILE_COLUMNS + 1,
                        rowStart: 1,
                        rowEnd: 3,
                        zIndex: 0,
                      },
                      [buttonId]: {
                        colStart: 1,
                        colEnd: FLUID_MOBILE_COLUMNS + 1,
                        rowStart: 3,
                        rowEnd: 4,
                        zIndex: 1,
                      },
                    },
                  },
                  rowHeight: FLUID_DEFAULT_ROW_HEIGHT,
                  gap: FLUID_DEFAULT_GAP,
                },
              },
            },
          ],
        },
      },
    },
  };
}

export const conversionEditorTemplates: TemplatesConfiguration = {
  PricingThreeColumn: {
    displayName:
      "builder.pageBuilder.templates.conversion.pricingThreeColumn" satisfies BaseAllKeys,
    icon: <CreditCard />,
    category,
    previewImage: sectionTemplatePreviewPath("pricing-three-column.png"),
    allowedBuilderTypes: ["page"],
    getBlock: (t) => {
      const plans = [1, 2, 3].map(() => marketingBlock("PlanCard", t));
      const highlighted = withBlockStyle(plans[1], {
        borderColor: [{ value: COLORS.primary.value }],
        borderWidth: [{ value: { value: 2, unit: "px" } }],
        backgroundColor: [{ value: COLORS.card.value }],
        boxShadow: boxShadowValue(16, 40, -12, COLORS.primary.value),
        transform: translateYRem(-0.5),
      });
      plans[1] = highlighted;
      return sectionShell(
        [
          buildSectionIntro(t, {
            title: `${prefix}.pricingThreeColumn.title` as BaseAllKeys,
            body: `${prefix}.pricingThreeColumn.body` as BaseAllKeys,
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
    },
  },

  CtaBandSection: {
    displayName:
      "builder.pageBuilder.templates.conversion.ctaBandSection" satisfies BaseAllKeys,
    icon: <Megaphone />,
    category,
    previewImage: sectionTemplatePreviewPath("cta-band-section.png"),
    allowedBuilderTypes: ["page"],
    getBlock: (t) => {
      const cta = withBlockStyle(marketingBlock("CtaBand", t), {
        backgroundColor: [{ value: "transparent" }],
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
      return fluidSection(
        [cta],
        { [cta.id]: fullWidthPlacement(cta.id, 1, 10) },
        imageBackgroundStyle(CTA_BACKGROUND, 55),
      );
    },
  },

  AnnouncementBar: {
    displayName:
      "builder.pageBuilder.templates.conversion.announcementBar" satisfies BaseAllKeys,
    icon: <Flag />,
    category,
    previewImage: sectionTemplatePreviewPath("announcement-bar.png"),
    allowedBuilderTypes: ["page"],
    getBlock: (t) =>
      compositeContainer([marketingBlock("Banner", t)], 0, {
        padding: [
          {
            value: {
              top: { value: 0.5, unit: "rem" },
              bottom: { value: 0.5, unit: "rem" },
              left: { value: 0, unit: "rem" },
              right: { value: 0, unit: "rem" },
            },
          },
        ],
      }),
  },

  CookieAcknowledgmentBanner: {
    displayName:
      "builder.pageBuilder.templates.conversion.cookieAcknowledgmentBanner" satisfies BaseAllKeys,
    icon: <Cookie />,
    category,
    previewImage: sectionTemplatePreviewPath(
      "cookie-acknowledgment-banner.png",
    ),
    allowedBuilderTypes: ["page", "footer"],
    getBlock: (t) => cookieAcknowledgmentBanner(t),
  },
};
