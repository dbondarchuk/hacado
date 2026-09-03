import { generateId, TEditorBlock } from "@hacado/builder";
import type { BaseAllKeys, I18nFn } from "@hacado/i18n";
import { COLORS } from "@hacado/page-builder-base/style";
import { AccordionItemPropsDefaults } from "../blocks/accordion-item";
import { AccordionPropsDefaults } from "../blocks/accordion/props.default";
import { BeforeAfterPropsDefaults } from "../blocks/before-after/schema";
import { ContainerPropsDefaults } from "../blocks/container";
import { HeadingPropsDefaults } from "../blocks/heading/schema";
import { InlineContainerPropsDefaults } from "../blocks/inline-container";
import { InlineTextPropsDefaults } from "../blocks/inline-text";
import { MarketingBrowserCarouselPropsDefaults } from "../blocks/marketing-browser-carousel/schema";
import { MarketingScrollingLogosPropsDefaults } from "../blocks/marketing-scrolling-logos/schema";
import { TextPropsDefaults } from "../blocks/text/schema";
import { marketingEditorTemplates } from "./marketing";

const roundedLg = (): [{ value: { value: number; unit: "px" } }] => [
  { value: { value: 16, unit: "px" } },
];

function boxShadowValue(
  y: number,
  blur: number,
  spread: number,
  color: string,
) {
  return [
    {
      value: {
        x: 0,
        y,
        blur,
        spread,
        color,
        inset: false,
      },
    },
  ];
}

function translateYRem(rem: number) {
  return [
    {
      value: {
        functions: [
          {
            function: "translateY" as const,
            values: [{ value: rem, unit: "rem" as const }],
          },
        ],
      },
    },
  ];
}

function flexFill(minRem: number) {
  return {
    flexGrow: [{ value: 1 }],
    flexShrink: [{ value: 1 }],
    minWidth: [{ value: { value: minRem, unit: "rem" as const } }],
  };
}

export type SectionIntroKeys = {
  eyebrow?: BaseAllKeys;
  title: BaseAllKeys;
  body: BaseAllKeys;
};

export function compositeContainer(
  children: TEditorBlock[],
  gapRem = 1.5,
  extraStyle: Record<string, unknown> = {},
): TEditorBlock {
  return {
    type: "Container",
    id: generateId(),
    data: {
      ...ContainerPropsDefaults,
      style: {
        ...ContainerPropsDefaults.style,
        display: [{ value: "flex" }],
        flexDirection: [{ value: "column" }],
        gap: [{ value: { value: gapRem, unit: "rem" } }],
        width: [{ value: { value: 100, unit: "%" } }],
        ...extraStyle,
      },
      props: { children },
    },
  };
}

export function sectionShell(
  children: TEditorBlock[],
  extraStyle: Record<string, unknown> = {},
): TEditorBlock {
  return compositeContainer(children, 2, {
    padding: [
      {
        value: {
          top: { value: 3, unit: "rem" },
          bottom: { value: 3, unit: "rem" },
          left: { value: 1.5, unit: "rem" },
          right: { value: 1.5, unit: "rem" },
        },
      },
    ],
    ...extraStyle,
  });
}

export function flexRow(
  children: TEditorBlock[],
  options: {
    gapRem?: number;
    justify?: "center" | "flex-start" | "space-between";
    align?: "stretch" | "flex-start" | "center";
  } = {},
): TEditorBlock {
  const { gapRem = 1.25, justify = "center", align = "stretch" } = options;
  return {
    type: "Container",
    id: generateId(),
    data: {
      ...ContainerPropsDefaults,
      style: {
        ...ContainerPropsDefaults.style,
        display: [{ value: "flex" }],
        flexDirection: [
          { value: "column" },
          { value: "row", breakpoint: ["md"] },
        ],
        flexWrap: [{ value: "wrap" }],
        justifyContent: [{ value: justify }],
        alignItems: [{ value: align }],
        gap: [{ value: { value: gapRem, unit: "rem" } }],
        width: [{ value: { value: 100, unit: "%" } }],
      },
      props: { children },
    },
  };
}

export function gridRow(
  children: TEditorBlock[],
  options: {
    gapRem?: number;
    justify?: "center" | "flex-start" | "space-between";
    align?: "stretch" | "flex-start" | "center";
  } = {},
): TEditorBlock {
  const { gapRem = 1.25, justify = "center", align = "stretch" } = options;
  return {
    type: "Container",
    id: generateId(),
    data: {
      ...ContainerPropsDefaults,
      style: {
        ...ContainerPropsDefaults.style,
        display: [{ value: "grid" }],
        gridTemplateColumns: [
          { value: "repeat(auto-fit, minmax(250px, 1fr))" },
        ],
        justifyContent: [{ value: justify }],
        alignItems: [{ value: align }],
        gap: [{ value: { value: gapRem, unit: "rem" } }],
        width: [{ value: { value: 100, unit: "%" } }],
      },
      props: { children },
    },
  };
}

export function splitColumns(
  left: TEditorBlock,
  right: TEditorBlock,
  gapRem = 2,
): TEditorBlock {
  return gridRow(
    [withBlockStyle(left, flexFill(18)), withBlockStyle(right, flexFill(18))],
    { gapRem, align: "center" },
  );
}

export function responsiveCardsGrid(
  children: TEditorBlock[],
  gapRem = 1.25,
): TEditorBlock {
  return {
    type: "Container",
    id: generateId(),
    data: {
      ...ContainerPropsDefaults,
      style: {
        ...ContainerPropsDefaults.style,
        display: [{ value: "grid" }],
        gridTemplateColumns: [
          { value: "1fr" },
          { value: "repeat(2, 1fr)", breakpoint: ["md"] },
          { value: "repeat(4, 1fr)", breakpoint: ["lg"] },
        ],
        gap: [{ value: { value: gapRem, unit: "rem" } }],
        width: [{ value: { value: 100, unit: "%" } }],
        alignItems: [{ value: "stretch" }],
      },
      props: { children },
    },
  };
}

export function bentoGrid(
  children: TEditorBlock[],
  gapRem = 1.25,
): TEditorBlock {
  return {
    type: "Container",
    id: generateId(),
    data: {
      ...ContainerPropsDefaults,
      style: {
        ...ContainerPropsDefaults.style,
        display: [{ value: "grid" }],
        gridTemplateColumns: [
          { value: "1fr" },
          { value: "repeat(2, 1fr)", breakpoint: ["md"] },
        ],
        gap: [{ value: { value: gapRem, unit: "rem" } }],
        width: [{ value: { value: 100, unit: "%" } }],
        alignItems: [{ value: "stretch" }],
      },
      props: { children },
    },
  };
}

export function styledStatCell(
  t: I18nFn<undefined, undefined>,
  keys: {
    value: BaseAllKeys;
    label: BaseAllKeys;
    supporting: BaseAllKeys;
  },
  options: { highlight?: boolean } = {},
): TEditorBlock {
  const cell = structuredClone(marketingBlock("StatCell", t));
  const heading = cell.data?.props?.children?.[0];
  const label = cell.data?.props?.children?.[1];
  const supporting = cell.data?.props?.children?.[2];
  if (
    heading?.data?.props?.children?.[0]?.data?.props?.children?.[0]?.data
      ?.props &&
    keys.value
  ) {
    heading.data.props.children[0].data.props.children[0].data.props.text = t(
      keys.value,
    );
  }
  if (label?.data?.props) {
    label.data.props.text = t(keys.label);
  }
  if (supporting?.data?.props) {
    supporting.data.props.value = [
      { type: "p", children: [{ text: t(keys.supporting) }] },
    ];
  }
  if (heading?.data?.style) {
    heading.data.style = {
      ...heading.data.style,
      fontSize: [{ value: { value: 2.75, unit: "rem" } }],
      fontWeight: [{ value: "700" }],
      lineHeight: [{ value: { value: 1.1, unit: "" } }],
      color: [{ value: COLORS.primary.value }],
    };
  }
  return withBlockStyle(cell, {
    backgroundColor: [{ value: COLORS.card.value }],
    borderStyle: [{ value: "solid" }],
    borderWidth: [{ value: { value: 1, unit: "px" } }],
    borderColor: [
      {
        value: options.highlight ? COLORS.primary.value : COLORS.border.value,
      },
    ],
    borderRadius: roundedLg(),
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
    boxShadow: boxShadowValue(
      options.highlight ? 12 : 4,
      options.highlight ? 32 : 24,
      options.highlight ? -12 : -4,
      options.highlight ? COLORS.primary.value : COLORS.foreground.value,
    ),
    textAlign: [{ value: "center" }],
    ...(options.highlight ? { transform: translateYRem(-0.25) } : {}),
  });
}

export function styledStep(
  t: I18nFn<undefined, undefined>,
  keys: {
    number: BaseAllKeys;
    title: BaseAllKeys;
    bullets: BaseAllKeys;
  },
): TEditorBlock {
  const step = structuredClone(marketingBlock("Step", t));
  const numberBlock = step.data?.props?.children?.[0];
  const titleBlock = step.data?.props?.children?.[1];
  const bulletsBlock = step.data?.props?.children?.[2];
  if (numberBlock?.data?.props) {
    numberBlock.data.props.text = t(keys.number);
  }
  if (
    titleBlock?.data?.props?.children?.[0]?.data?.props?.children?.[0]?.data
      ?.props
  ) {
    titleBlock.data.props.children[0].data.props.children[0].data.props.text =
      t(keys.title);
  }
  if (bulletsBlock?.data?.props) {
    bulletsBlock.data.props.value = [
      { type: "p", children: [{ text: t(keys.bullets) }] },
    ];
  }
  if (numberBlock?.data?.style) {
    numberBlock.data.style = {
      ...numberBlock.data.style,
      fontSize: [{ value: { value: 1.75, unit: "rem" } }],
      fontWeight: [{ value: "700" }],
      color: [{ value: COLORS.primary.value }],
      textAlign: [{ value: "center" }],
    };
  }
  return withBlockStyle(step, {
    backgroundColor: [{ value: COLORS.card.value }],
    borderStyle: [{ value: "solid" }],
    borderWidth: [{ value: { value: 1, unit: "px" } }],
    borderColor: [{ value: COLORS.border.value }],
    borderRadius: roundedLg(),
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
    boxShadow: boxShadowValue(6, 24, -6, COLORS.foreground.value),
    textAlign: [{ value: "center" }],
    gap: [{ value: { value: 0.75, unit: "rem" } }],
  });
}

export function withBlockStyle(
  block: TEditorBlock,
  style: Record<string, unknown>,
): TEditorBlock {
  return {
    ...block,
    data: {
      ...block.data,
      style: {
        ...block.data.style,
        ...style,
      },
    },
  };
}

export function logoImageCard(
  t: I18nFn<undefined, undefined>,
  src: string,
  name: string,
): TEditorBlock {
  const card = marketingBlock("LogoCard", t);
  const image = card.data?.props?.children?.find(
    (child: TEditorBlock) => child.type === "Image",
  );
  const label = card.data?.props?.children?.find(
    (child: TEditorBlock) => child.type === "InlineText",
  );
  if (image?.data?.props) {
    image.data.props.src = src;
    image.data.props.alt = name;
  }
  if (label?.data?.props) {
    label.data.props.text = name;
  }
  return card;
}

export function buildScrollingLogos(
  t: I18nFn<undefined, undefined>,
  logos: Array<{ src: string; name: string }>,
): TEditorBlock {
  const defaults = MarketingScrollingLogosPropsDefaults(t);
  const templateItem = defaults.props.items.children[0];
  return {
    type: "MarketingScrollingLogos",
    id: generateId(),
    data: {
      ...defaults,
      props: {
        ...defaults.props,
        items: {
          children: logos.map((logo) => {
            const item = structuredClone(templateItem);
            item.id = generateId();
            const image = item.data.props.children.find(
              (child: TEditorBlock) => child.type === "Image",
            );
            const text = item.data.props.children.find(
              (child: TEditorBlock) => child.type === "InlineText",
            );
            if (image?.data?.props) {
              image.data.props.src = logo.src;
              image.data.props.alt = logo.name;
              image.id = generateId();
            }
            if (text?.data?.props) {
              text.data.props.text = logo.name;
              text.id = generateId();
            }
            return item;
          }),
        },
      },
    },
  };
}

export function buildBeforeAfter(
  beforeSrc: string,
  afterSrc: string,
  beforeAlt: string,
  afterAlt: string,
): TEditorBlock {
  const defaults = structuredClone(BeforeAfterPropsDefaults());
  const beforeImage =
    defaults.props?.before?.children?.[0]?.data?.props?.children?.[0];
  const afterImage =
    defaults.props?.after?.children?.[0]?.data?.props?.children?.[0];
  if (beforeImage?.data?.props) {
    beforeImage.data.props.src = beforeSrc;
    beforeImage.data.props.alt = beforeAlt;
  }
  if (afterImage?.data?.props) {
    afterImage.data.props.src = afterSrc;
    afterImage.data.props.alt = afterAlt;
  }
  return {
    type: "BeforeAfter",
    id: generateId(),
    data: defaults,
  };
}

export function buildBrowserCarousel(
  t: I18nFn<undefined, undefined>,
  slides: Array<{ src: string; label: string; addressBar: string }>,
): TEditorBlock {
  const defaults = MarketingBrowserCarouselPropsDefaults(t);
  return {
    type: "MarketingBrowserCarousel",
    id: generateId(),
    data: {
      ...defaults,
      props: {
        ...defaults.props,
        slides: slides.map((slide) => ({
          id: generateId(),
          label: slide.label,
          src: slide.src,
          addressBar: slide.addressBar,
        })),
      },
    },
  };
}

export { boxShadowValue, COLORS, flexFill, roundedLg, translateYRem };

function eyebrowInline(
  t: I18nFn<undefined, undefined>,
  textKey: BaseAllKeys,
): TEditorBlock {
  return {
    type: "InlineText",
    id: generateId(),
    data: {
      ...InlineTextPropsDefaults,
      props: { text: t(textKey) },
      style: {
        ...InlineTextPropsDefaults.style,
        fontSize: [{ value: { value: 0.875, unit: "rem" } }],
        textAlign: [{ value: "center" }],
      },
    },
  };
}

function introTitle(
  t: I18nFn<undefined, undefined>,
  textKey: BaseAllKeys,
): TEditorBlock {
  const headingDefaults = HeadingPropsDefaults();
  return {
    type: "Heading",
    id: generateId(),
    data: {
      ...headingDefaults,
      style: {
        ...headingDefaults.style,
        textAlign: [{ value: "center" }],
      },
      props: {
        level: "h2",
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
                    data: { props: { text: t(textKey) } },
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

function introBody(
  t: I18nFn<undefined, undefined>,
  textKey: BaseAllKeys,
): TEditorBlock {
  return {
    type: "Text",
    id: generateId(),
    data: {
      ...TextPropsDefaults,
      style: {
        ...TextPropsDefaults.style,
        textAlign: [{ value: "center" }],
      },
      props: {
        value: [{ type: "p", children: [{ text: t(textKey) }] }],
      },
    },
  };
}

export function buildSectionIntro(
  t: I18nFn<undefined, undefined>,
  keys: SectionIntroKeys,
): TEditorBlock {
  const children: TEditorBlock[] = [];
  if (keys.eyebrow) {
    children.push(eyebrowInline(t, keys.eyebrow));
  }
  children.push(introTitle(t, keys.title), introBody(t, keys.body));
  return {
    type: "Container",
    id: generateId(),
    data: {
      ...ContainerPropsDefaults,
      style: {
        ...ContainerPropsDefaults.style,
        display: [{ value: "flex" }],
        flexDirection: [{ value: "column" }],
        alignItems: [{ value: "center" }],
        gap: [{ value: { value: 0.5, unit: "rem" } }],
        width: [{ value: { value: 100, unit: "%" } }],
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
                display: [{ value: "flex" }],
                flexDirection: [{ value: "column" }],
                alignItems: [{ value: "center" }],
                gap: [{ value: { value: 0.5, unit: "rem" } }],
              },
              props: { children },
            },
          },
        ],
      },
    },
  };
}

export function accordionItem(
  t: I18nFn<undefined, undefined>,
  titleKey: BaseAllKeys,
  contentKey: BaseAllKeys,
): TEditorBlock {
  const defaults = structuredClone(AccordionItemPropsDefaults());
  const titleBlock = defaults.props.title.children[0];
  const contentContainer = defaults.props.content.children[0];
  const contentText = contentContainer?.data?.props?.children?.[0];

  if (titleBlock?.data?.props?.children?.[0]?.data?.props) {
    titleBlock.data.props.children[0].data.props.text = t(titleKey);
  }
  if (contentText?.data?.props) {
    contentText.data.props.value = [
      { type: "p", children: [{ text: t(contentKey) }] },
    ] as any;
  }

  return {
    type: "AccordionItem",
    id: generateId(),
    data: defaults,
  };
}

export function buildAccordion(
  t: I18nFn<undefined, undefined>,
  items: Array<{ title: BaseAllKeys; content: BaseAllKeys }>,
): TEditorBlock {
  return {
    type: "Accordion",
    id: generateId(),
    data: {
      ...AccordionPropsDefaults,
      props: {
        ...AccordionPropsDefaults.props,
        children: items.map((item) =>
          accordionItem(t, item.title, item.content),
        ),
      },
    },
  };
}

export function marketingBlock<K extends keyof typeof marketingEditorTemplates>(
  key: K,
  t: I18nFn<undefined, undefined>,
): TEditorBlock {
  const template = marketingEditorTemplates[key];
  if (!("getBlock" in template)) {
    throw new Error(`Marketing template ${String(key)} is not a section`);
  }
  return template.getBlock(t);
}
