import {
  generateId,
  TEditorBlock,
  TemplatesConfiguration,
} from "@hacado/builder";
import type { BaseAllKeys, I18nFn } from "@hacado/i18n";
import { COLORS } from "@hacado/page-builder-base/style";
import { Cookie, CreditCard, Flag, Megaphone } from "lucide-react";
import { ButtonPropsDefaults } from "../blocks/button";
import { ContainerPropsDefaults } from "../blocks/container";
import { InlineContainerPropsDefaults } from "../blocks/inline-container";
import { LinkPropsDefaults } from "../blocks/link";
import { StickyBannerPropsDefaults } from "../blocks/sticky-banner";
import { TextPropsDefaults } from "../blocks/text/schema";
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

const emptyPad = [
  {
    value: {
      top: { value: 0, unit: "rem" as const },
      right: { value: 0, unit: "rem" as const },
      bottom: { value: 0, unit: "rem" as const },
      left: { value: 0, unit: "rem" as const },
    },
  },
];

function cookieAcknowledgmentBanner(
  t: I18nFn<undefined, undefined>,
): TEditorBlock {
  const defaults = StickyBannerPropsDefaults();
  const label = t(`${prefix}.cookieAcknowledgmentBanner.button` as BaseAllKeys);
  const privacyLabel = t(
    `${prefix}.cookieAcknowledgmentBanner.privacyPolicy` as BaseAllKeys,
  );

  const btn = structuredClone(ButtonPropsDefaults());
  const inlineText = (btn as any).props?.children?.[0]?.data?.props
    ?.children?.[0];
  if (inlineText?.data?.props) {
    inlineText.data.props.text = label;
  }

  const linkDefaults = LinkPropsDefaults();

  return {
    type: "StickyBanner",
    id: generateId(),
    data: {
      ...defaults,
      style: {
        ...defaults.style,
        backgroundColor: [{ value: COLORS.muted.value }],
        boxShadow: boxShadowValue(0, 8, 0, COLORS.foreground.value),
        padding: emptyPad,
      },
      props: {
        show: "one-time",
        position: "bottom",
        showCloseButton: true,
        content: {
          children: [
            {
              type: "Container",
              id: generateId(),
              data: {
                ...ContainerPropsDefaults,
                style: {
                  ...ContainerPropsDefaults.style,
                  display: [{ value: "flex" }],
                  flexDirection: [
                    { value: "column" },
                    { value: "row", breakpoint: ["sm"] },
                  ],
                  alignItems: [
                    { value: "stretch" },
                    { value: "center", breakpoint: ["sm"] },
                  ],
                  justifyContent: [{ value: "space-between" }],
                  gap: [{ value: { value: 1, unit: "rem" } }],
                  width: [{ value: { value: 100, unit: "%" } }],
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
                },
                props: {
                  children: [
                    {
                      type: "Container",
                      id: generateId(),
                      data: {
                        ...ContainerPropsDefaults,
                        style: {
                          ...ContainerPropsDefaults.style,
                          padding: emptyPad,
                          display: [{ value: "flex" }],
                          flexDirection: [{ value: "column" }],
                          gap: [{ value: { value: 0.35, unit: "rem" } }],
                          flexGrow: [{ value: 1 }],
                          width: [{ value: { value: 100, unit: "%" } }],
                        },
                        props: {
                          children: [
                            {
                              type: "Text",
                              id: generateId(),
                              data: {
                                ...TextPropsDefaults,
                                style: {
                                  ...TextPropsDefaults.style,
                                  padding: emptyPad,
                                  fontSize: [
                                    { value: { value: 0.875, unit: "rem" } },
                                  ],
                                  fontWeight: [{ value: "500" }],
                                  color: [{ value: COLORS.foreground.value }],
                                },
                                props: {
                                  value: [
                                    {
                                      type: "p",
                                      children: [
                                        {
                                          text: t(
                                            `${prefix}.cookieAcknowledgmentBanner.message` as BaseAllKeys,
                                          ),
                                        },
                                      ],
                                    },
                                  ],
                                },
                              },
                            },
                            {
                              type: "Link",
                              id: generateId(),
                              data: {
                                ...linkDefaults,
                                props: {
                                  url: "/privacy",
                                  target: "_self",
                                  children: [
                                    {
                                      type: "InlineText",
                                      id: generateId(),
                                      data: {
                                        props: { text: privacyLabel },
                                      },
                                    },
                                  ],
                                },
                                style: {
                                  ...linkDefaults.style,
                                  fontSize: [
                                    { value: { value: 0.875, unit: "rem" } },
                                  ],
                                  fontWeight: [{ value: "600" }],
                                  color: [{ value: COLORS.foreground.value }],
                                  textDecoration: [{ value: "underline" }],
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                    {
                      type: "Button",
                      id: generateId(),
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
                          fontWeight: [{ value: "600" }],
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
                          flexShrink: [{ value: "0" }],
                        },
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
        imageBackgroundStyle(CTA_BACKGROUND, {
          opacity: 55,
          backgroundColor: COLORS.background.value,
        }),
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
