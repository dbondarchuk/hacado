import {
  generateId,
  TEditorBlock,
  TemplatesConfiguration,
} from "@hacado/builder";
import type { BaseAllKeys, I18nFn } from "@hacado/i18n";
import { COLORS } from "@hacado/page-builder-base/style";
import {
  BarChart3,
  CreditCard,
  Flag,
  LayoutTemplate,
  ListOrdered,
  Megaphone,
  MessageSquareQuote,
  Puzzle,
  Sparkles,
} from "lucide-react";
import { ButtonPropsDefaults } from "../blocks/button";
import { ContainerPropsDefaults } from "../blocks/container";
import { HeadingPropsDefaults } from "../blocks/heading/schema";
import { IconPropsDefaults } from "../blocks/icon/schema";
import { ImagePropsDefaults } from "../blocks/image/schema";
import { InlineContainerPropsDefaults } from "../blocks/inline-container";
import { InlineTextPropsDefaults } from "../blocks/inline-text";
import { TextPropsDefaults } from "../blocks/text/schema";
import { marketingTemplatePreviewPath } from "./preview-manifest";

const category =
  "builder.pageBuilder.blocks.categories.marketing" satisfies BaseAllKeys;

/** Matches page-builder border radius tokens (numeric px). */
const roundedLg = (): [{ value: { value: number; unit: "px" } }] => [
  { value: { value: 16, unit: "px" } },
];

const eyebrowInline = (t: I18nFn<undefined, undefined>): TEditorBlock => ({
  type: "InlineText",
  id: generateId(),
  data: {
    ...InlineTextPropsDefaults,
    props: {
      text: t(
        "builder.pageBuilder.marketingDefaults.templates.sectionIntro.eyebrow",
      ),
    },
    style: {
      ...InlineTextPropsDefaults.style,
      fontSize: [
        {
          value: { value: 0.875, unit: "rem" },
        },
      ],
    },
  },
});

const titleHeading = (
  t: I18nFn<undefined, undefined>,
  textKey: BaseAllKeys,
  level: "h1" | "h2" | "h3" = "h2",
): TEditorBlock => {
  const headingDefaults = HeadingPropsDefaults();
  return {
    type: "Heading",
    id: generateId(),
    data: {
      ...headingDefaults,
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
};

const bodyText = (
  t: I18nFn<undefined, undefined>,
  textKey: BaseAllKeys,
): TEditorBlock => ({
  type: "Text",
  id: generateId(),
  data: {
    ...TextPropsDefaults,
    props: {
      value: [{ type: "p", children: [{ text: t(textKey) }] }],
    },
  },
});

const planCtaButton = (
  t: I18nFn<undefined, undefined>,
  btn: ReturnType<typeof ButtonPropsDefaults>,
) => {
  const label = t(
    "builder.pageBuilder.marketingDefaults.templates.planCard.cta",
  );
  const child = btn.props?.children?.[0];
  if (child?.type !== "InlineContainer" || !child.data?.props?.children?.[0]) {
    return btn;
  }
  const inlineText = child.data.props.children[0];
  if (inlineText.type !== "InlineText") return btn;
  return {
    ...btn,
    props: {
      ...btn.props,
      children: [
        {
          ...child,
          data: {
            ...child.data,
            props: {
              ...child.data.props,
              children: [
                {
                  ...inlineText,
                  data: {
                    ...inlineText.data,
                    props: {
                      ...inlineText.data.props,
                      text: label,
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  };
};

export const marketingEditorTemplates: TemplatesConfiguration = {
  SectionIntro: {
    displayName:
      "builder.pageBuilder.templates.marketing.sectionIntro" satisfies BaseAllKeys,
    icon: <LayoutTemplate />,
    category,
    previewImage: marketingTemplatePreviewPath("section-intro.png"),
    getBlock: (t: I18nFn<undefined, undefined>): TEditorBlock => {
      const id = generateId();
      return {
        type: "Container",
        id,
        data: {
          ...ContainerPropsDefaults,
          props: {
            children: [
              {
                type: "Container",
                id: generateId(),
                data: {
                  ...ContainerPropsDefaults,
                  style: {
                    ...ContainerPropsDefaults.style,
                    display: [{ value: "flex" }],
                    flexDirection: [{ value: "column" }],
                    alignItems: [{ value: "center" }],
                    justifySelf: [{ value: "center" }],
                    gap: [
                      {
                        value: { value: 0.5, unit: "rem" },
                      },
                    ],
                  },
                  props: {
                    children: [
                      eyebrowInline(t),
                      titleHeading(
                        t,
                        "builder.pageBuilder.marketingDefaults.templates.sectionIntro.sectionTitle",
                        "h2",
                      ),
                      bodyText(
                        t,
                        "builder.pageBuilder.marketingDefaults.templates.sectionIntro.body",
                      ),
                    ],
                  },
                },
              },
            ],
          },
        },
      };
    },
  },
  StatCell: {
    displayName:
      "builder.pageBuilder.templates.marketing.statCell" satisfies BaseAllKeys,
    icon: <BarChart3 />,
    category,
    previewImage: marketingTemplatePreviewPath("stat-cell.png"),
    getBlock: (t: I18nFn<undefined, undefined>): TEditorBlock => {
      const id = generateId();
      return {
        type: "Container",
        id,
        data: {
          ...ContainerPropsDefaults,
          style: {
            ...ContainerPropsDefaults.style,
            display: [{ value: "flex" }],
            flexDirection: [{ value: "column" }],
            alignItems: [{ value: "center" }],
            textAlign: [{ value: "center" }],
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
            borderRadius: roundedLg(),
            borderStyle: [{ value: "solid" }],
            borderWidth: [{ value: { value: 1, unit: "px" } }],
          },
          props: {
            children: [
              titleHeading(
                t,
                "builder.pageBuilder.marketingDefaults.templates.statCell.value",
                "h2",
              ),
              {
                type: "InlineText",
                id: generateId(),
                data: {
                  props: {
                    text: t(
                      "builder.pageBuilder.marketingDefaults.templates.statCell.label",
                    ),
                  },
                  style: {},
                },
              },
              bodyText(
                t,
                "builder.pageBuilder.marketingDefaults.templates.statCell.supporting",
              ),
            ],
          },
        },
      };
    },
  },
  Step: {
    displayName:
      "builder.pageBuilder.templates.marketing.step" satisfies BaseAllKeys,
    icon: <ListOrdered />,
    category,
    previewImage: marketingTemplatePreviewPath("step.png"),
    getBlock: (t: I18nFn<undefined, undefined>): TEditorBlock => {
      const id = generateId();
      return {
        type: "Container",
        id,
        data: {
          ...ContainerPropsDefaults,
          style: {
            ...ContainerPropsDefaults.style,
            display: [{ value: "flex" }],
            flexDirection: [{ value: "column" }],
            gap: [{ value: { value: 0.75, unit: "rem" } }],
          },
          props: {
            children: [
              {
                type: "InlineText",
                id: generateId(),
                data: {
                  props: {
                    text: t(
                      "builder.pageBuilder.marketingDefaults.templates.step.number",
                    ),
                  },
                  style: {},
                },
              },
              titleHeading(
                t,
                "builder.pageBuilder.marketingDefaults.templates.step.title",
                "h3",
              ),
              bodyText(
                t,
                "builder.pageBuilder.marketingDefaults.templates.step.bullets",
              ),
            ],
          },
        },
      };
    },
  },
  TestimonialCard: {
    displayName:
      "builder.pageBuilder.templates.marketing.testimonialCard" satisfies BaseAllKeys,
    icon: <MessageSquareQuote />,
    category,
    previewImage: marketingTemplatePreviewPath("testimonial-card.png"),
    getBlock: (t: I18nFn<undefined, undefined>): TEditorBlock => {
      const id = generateId();
      return {
        type: "Container",
        id,
        data: {
          ...ContainerPropsDefaults,
          style: {
            ...ContainerPropsDefaults.style,
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
            borderRadius: roundedLg(),
            borderStyle: [{ value: "solid" }],
            borderWidth: [{ value: { value: 1, unit: "px" } }],
            display: [{ value: "flex" }],
            flexDirection: [{ value: "column" }],
            gap: [{ value: { value: 1, unit: "rem" } }],
          },
          props: {
            children: [
              bodyText(
                t,
                "builder.pageBuilder.marketingDefaults.templates.testimonial.quote",
              ),
              {
                type: "InlineText",
                id: generateId(),
                data: {
                  props: {
                    text: t(
                      "builder.pageBuilder.marketingDefaults.templates.testimonial.name",
                    ),
                  },
                  style: {},
                },
              },
              {
                type: "InlineText",
                id: generateId(),
                data: {
                  props: {
                    text: t(
                      "builder.pageBuilder.marketingDefaults.templates.testimonial.role",
                    ),
                  },
                  style: {},
                },
              },
            ],
          },
        },
      };
    },
  },
  CtaBand: {
    displayName:
      "builder.pageBuilder.templates.marketing.ctaBand" satisfies BaseAllKeys,
    icon: <Megaphone />,
    category,
    previewImage: marketingTemplatePreviewPath("cta-band.png"),
    getBlock: (t: I18nFn<undefined, undefined>): TEditorBlock => {
      const id = generateId();
      const btn = ButtonPropsDefaults();
      return {
        type: "Container",
        id,
        data: {
          ...ContainerPropsDefaults,
          style: {
            ...ContainerPropsDefaults.style,
            display: [{ value: "flex" }],
            flexDirection: [{ value: "column" }],
            alignItems: [{ value: "center" }],
            textAlign: [{ value: "center" }],
            gap: [{ value: { value: 1, unit: "rem" } }],
            padding: [
              {
                value: {
                  top: { value: 2, unit: "rem" },
                  bottom: { value: 2, unit: "rem" },
                  left: { value: 1.5, unit: "rem" },
                  right: { value: 1.5, unit: "rem" },
                },
              },
            ],
          },
          props: {
            children: [
              titleHeading(
                t,
                "builder.pageBuilder.marketingDefaults.templates.ctaBand.title",
                "h2",
              ),
              bodyText(
                t,
                "builder.pageBuilder.marketingDefaults.templates.ctaBand.body",
              ),
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
                    justifyContent: [{ value: "center" }],
                    alignItems: [{ value: "center" }],
                    gap: [{ value: { value: 1, unit: "rem" } }],
                  },
                  props: {
                    children: [
                      {
                        type: "Button",
                        id: generateId(),
                        data: btn,
                      },
                      {
                        type: "Button",
                        id: generateId(),
                        data: {
                          ...btn,
                          props: {
                            ...btn.props,
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
                                          props: {
                                            text: t(
                                              "builder.pageBuilder.marketingDefaults.templates.ctaBand.secondaryButton",
                                            ),
                                          },
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
                            backgroundColor: [{ value: "transparent" }],
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
      };
    },
  },
  PlanCard: {
    displayName:
      "builder.pageBuilder.templates.marketing.planCard" satisfies BaseAllKeys,
    icon: <CreditCard />,
    category,
    previewImage: marketingTemplatePreviewPath("plan-card.png"),
    getBlock: (t: I18nFn<undefined, undefined>): TEditorBlock => {
      const id = generateId();
      const btn = planCtaButton(t, ButtonPropsDefaults());
      return {
        type: "Container",
        id,
        data: {
          ...ContainerPropsDefaults,
          style: {
            ...ContainerPropsDefaults.style,
            display: [{ value: "flex" }],
            flexDirection: [{ value: "column" }],
            alignItems: [{ value: "center" }],
            gap: [{ value: { value: 1, unit: "rem" } }],
            padding: [
              {
                value: {
                  top: { value: 2, unit: "rem" },
                  bottom: { value: 2, unit: "rem" },
                  left: { value: 1.5, unit: "rem" },
                  right: { value: 1.5, unit: "rem" },
                },
              },
            ],
            borderRadius: roundedLg(),
            borderStyle: [{ value: "solid" }],
            borderWidth: [{ value: { value: 1, unit: "px" } }],
          },
          props: {
            children: [
              {
                type: "InlineText",
                id: generateId(),
                data: {
                  props: {
                    text: t(
                      "builder.pageBuilder.marketingDefaults.templates.planCard.badge",
                    ),
                  },
                  style: {
                    fontSize: [{ value: { value: 0.75, unit: "rem" } }],
                    fontWeight: [{ value: "600" }],
                  },
                },
              },
              titleHeading(
                t,
                "builder.pageBuilder.marketingDefaults.templates.planCard.name",
                "h3",
              ),
              {
                type: "InlineText",
                id: generateId(),
                data: {
                  props: {
                    text: t(
                      "builder.pageBuilder.marketingDefaults.templates.planCard.price",
                    ),
                  },
                  style: {
                    fontSize: [{ value: { value: 1.5, unit: "rem" } }],
                    fontWeight: [{ value: "700" }],
                  },
                },
              },
              {
                type: "InlineText",
                id: generateId(),
                data: {
                  props: {
                    text: t(
                      "builder.pageBuilder.marketingDefaults.templates.planCard.footnote",
                    ),
                  },
                  style: {
                    fontSize: [{ value: { value: 0.875, unit: "rem" } }],
                  },
                },
              },
              bodyText(
                t,
                "builder.pageBuilder.marketingDefaults.templates.planCard.features",
              ),
              {
                type: "Button",
                id: generateId(),
                data: btn,
              },
            ],
          },
        },
      };
    },
  },
  Badge: {
    displayName:
      "builder.pageBuilder.templates.marketing.badge" satisfies BaseAllKeys,
    icon: <Sparkles />,
    category,
    previewImage: marketingTemplatePreviewPath("badge.png"),
    getBlock: (t: I18nFn<undefined, undefined>): TEditorBlock => {
      const id = generateId();
      const iconDefaults = IconPropsDefaults;
      return {
        type: "InlineContainer",
        id,
        data: {
          ...InlineContainerPropsDefaults,
          style: {
            ...InlineContainerPropsDefaults.style,
            display: [{ value: "inline-flex" }],
            flexDirection: [{ value: "row" }],
            alignItems: [{ value: "center" }],
            justifyContent: [{ value: "center" }],
            gap: [{ value: { value: 0.5, unit: "rem" } }],
            width: [{ value: "max-content" }],
            padding: [
              {
                value: {
                  top: { value: 0.625, unit: "rem" },
                  bottom: { value: 0.625, unit: "rem" },
                  left: { value: 1.5, unit: "rem" },
                  right: { value: 1.5, unit: "rem" },
                },
              },
            ],
            backgroundColor: [{ value: COLORS.primary.value }],
            color: [{ value: COLORS["primary-foreground"].value }],
            borderRadius: [{ value: { value: 1.25, unit: "rem" } }],
          },
          props: {
            children: [
              {
                type: "Icon",
                id: generateId(),
                data: {
                  ...iconDefaults,
                  props: {
                    icon: "sparkles",
                  },
                  style: {
                    ...iconDefaults.style,
                    width: [{ value: { value: 0.875, unit: "rem" } }],
                    height: [{ value: { value: 0.875, unit: "rem" } }],
                    fill: [{ value: "currentColor" }],
                    flexShrink: [{ value: "0" }],
                  },
                },
              },
              {
                type: "InlineText",
                id: generateId(),
                data: {
                  props: {
                    text: t(
                      "builder.pageBuilder.marketingDefaults.templates.badge.label",
                    ),
                  },
                  style: {
                    fontSize: [{ value: { value: 0.875, unit: "rem" } }],
                    fontWeight: [{ value: "600" }],
                    color: [{ value: "currentColor" }],
                  },
                },
              },
            ],
          },
        },
      };
    },
  },
  Banner: {
    displayName:
      "builder.pageBuilder.templates.marketing.banner" satisfies BaseAllKeys,
    icon: <Flag />,
    category,
    previewImage: marketingTemplatePreviewPath("banner.png"),
    getBlock: (t: I18nFn<undefined, undefined>): TEditorBlock => {
      const id = generateId();
      const iconDefaults = IconPropsDefaults;
      return {
        type: "Container",
        id,
        data: {
          ...ContainerPropsDefaults,
          style: {
            ...ContainerPropsDefaults.style,
            display: [{ value: "flex" }],
            flexDirection: [{ value: "row" }],
            alignItems: [{ value: "center" }],
            justifyContent: [{ value: "flex-start" }],
            gap: [{ value: { value: 0.75, unit: "rem" } }],
            width: [{ value: { value: 100, unit: "%" } }],
            padding: [
              {
                value: {
                  top: { value: 1, unit: "rem" },
                  bottom: { value: 1, unit: "rem" },
                  left: { value: 1.25, unit: "rem" },
                  right: { value: 1.25, unit: "rem" },
                },
              },
            ],
            backgroundColor: [{ value: COLORS.primary.value }],
            color: [{ value: COLORS["primary-foreground"].value }],
            borderRadius: roundedLg(),
          },
          props: {
            children: [
              {
                type: "Icon",
                id: generateId(),
                data: {
                  ...iconDefaults,
                  props: {
                    icon: "megaphone",
                  },
                  style: {
                    ...iconDefaults.style,
                    width: [{ value: { value: 1.25, unit: "rem" } }],
                    height: [{ value: { value: 1.25, unit: "rem" } }],
                    fill: [{ value: "currentColor" }],
                    flexShrink: [{ value: "0" }],
                  },
                },
              },
              {
                type: "InlineText",
                id: generateId(),
                data: {
                  props: {
                    text: t(
                      "builder.pageBuilder.marketingDefaults.templates.banner.message",
                    ),
                  },
                  style: {
                    fontSize: [{ value: { value: 0.875, unit: "rem" } }],
                    fontWeight: [{ value: "500" }],
                  },
                },
              },
            ],
          },
        },
      };
    },
  },
  LogoCard: {
    displayName:
      "builder.pageBuilder.templates.marketing.logoCard" satisfies BaseAllKeys,
    icon: <Puzzle />,
    category,
    previewImage: marketingTemplatePreviewPath("logo-card.png"),
    getBlock: (t: I18nFn<undefined, undefined>): TEditorBlock => {
      const id = generateId();
      const imgDefaults = ImagePropsDefaults;
      return {
        type: "Container",
        id,
        data: {
          ...ContainerPropsDefaults,
          style: {
            ...ContainerPropsDefaults.style,
            display: [{ value: "flex" }],
            flexDirection: [{ value: "column" }],
            alignItems: [{ value: "center" }],
            justifyContent: [{ value: "center" }],
            gap: [{ value: { value: 0.75, unit: "rem" } }],
            width: [
              {
                value: { value: 11, unit: "rem" },
              },
            ],
            minWidth: [
              {
                value: { value: 11, unit: "rem" },
              },
            ],
            flexShrink: [{ value: "0" }],
            padding: [
              {
                value: {
                  top: { value: 1.5, unit: "rem" },
                  bottom: { value: 1.5, unit: "rem" },
                  left: { value: 1.25, unit: "rem" },
                  right: { value: 1.25, unit: "rem" },
                },
              },
            ],
            borderRadius: roundedLg(),
            borderStyle: [{ value: "solid" }],
            borderWidth: [{ value: { value: 1, unit: "px" } }],
          },
          props: {
            children: [
              {
                type: "Image",
                id: generateId(),
                data: {
                  ...imgDefaults,
                  props: {
                    ...imgDefaults.props,
                    src: "/assets/placeholder/128x128.png",
                    alt: t(
                      "builder.pageBuilder.marketingDefaults.templates.logoCard.logoAlt",
                    ),
                  },
                  style: {
                    ...imgDefaults.style,
                    width: [{ value: { value: 3, unit: "rem" } }],
                    height: [{ value: { value: 3, unit: "rem" } }],
                  },
                },
              },
              {
                type: "InlineText",
                id: generateId(),
                data: {
                  props: {
                    text: t(
                      "builder.pageBuilder.marketingDefaults.templates.logoCard.name",
                    ),
                  },
                  style: {
                    textAlign: [{ value: "center" }],
                    fontSize: [{ value: { value: 0.875, unit: "rem" } }],
                    fontWeight: [{ value: "500" }],
                  },
                },
              },
            ],
          },
        },
      };
    },
  },
};
