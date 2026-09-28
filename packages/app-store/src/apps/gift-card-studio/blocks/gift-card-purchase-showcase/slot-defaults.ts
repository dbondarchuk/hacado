import { generateId } from "@hacado/builder";
import type { I18nFn } from "@hacado/i18n";
import { migrateSlotValue } from "@hacado/page-builder-base/slots";
import { GiftCardStudioPublicAllKeys } from "../../translations/types";

const rem = (value: number) => ({ value, unit: "rem" as const });

const padding = (value: number) => ({
  top: rem(value),
  right: rem(value),
  bottom: rem(value),
  left: rem(value),
});

function copy(
  t: I18nFn<undefined, undefined>,
  key: GiftCardStudioPublicAllKeys,
) {
  return (t as (translationKey: string) => string)(key);
}

function headingBlock(
  text: string,
  level: "h2" | "h3",
  style: Record<string, unknown>,
) {
  return {
    type: "Heading",
    id: generateId(),
    data: {
      style,
      props: {
        level,
        children: [
          {
            type: "InlineContainer",
            id: generateId(),
            data: {
              style: {},
              props: {
                children: [
                  {
                    type: "InlineText",
                    id: generateId(),
                    data: {
                      props: { text },
                      style: {},
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

function textBlock(text: string, style: Record<string, unknown>) {
  return {
    type: "Text",
    id: generateId(),
    data: {
      style,
      props: {
        value: [
          {
            type: "p",
            children: [{ text }],
          },
        ],
      },
    },
  };
}

function iconBlock(icon: string) {
  return {
    type: "Icon",
    id: generateId(),
    data: {
      props: { icon },
      style: {
        display: [{ value: "inline-block" }],
        width: [{ value: rem(1.25) }],
        height: [{ value: rem(1.25) }],
        color: [{ value: "var(--value-muted-foreground-color)" }],
      },
    },
  };
}

function featureItem(
  t: I18nFn<undefined, undefined>,
  icon: string,
  titleKey: GiftCardStudioPublicAllKeys,
  descriptionKey: GiftCardStudioPublicAllKeys,
) {
  return {
    type: "Container",
    id: generateId(),
    data: {
      style: {
        display: [{ value: "flex" }],
        flexDirection: [{ value: "column" }],
        alignItems: [{ value: "center" }],
        gap: [{ value: rem(0.35) }],
        textAlign: [{ value: "center" }],
        padding: [{ value: padding(0) }],
        width: [{ value: { value: 100, unit: "%" } }],
      },
      props: {
        children: [
          iconBlock(icon),
          textBlock(copy(t, titleKey), {
            fontSize: [{ value: rem(0.875) }],
            fontWeight: [{ value: "500" }],
            textAlign: [{ value: "center" }],
            padding: [{ value: padding(0) }],
          }),
          textBlock(copy(t, descriptionKey), {
            fontSize: [{ value: rem(0.75) }],
            textAlign: [{ value: "center" }],
            color: [{ value: "var(--value-muted-foreground-color)" }],
            padding: [{ value: padding(0) }],
          }),
        ],
      },
    },
  };
}

export function createShowcaseSlots(t: I18nFn<undefined, undefined>) {
  return {
    title: migrateSlotValue({
      children: [
        {
          type: "Container",
          id: generateId(),
          data: {
            style: {
              display: [{ value: "flex" }],
              flexDirection: [{ value: "column" }],
              alignItems: [{ value: "center" }],
              gap: [{ value: rem(0.5) }],
              padding: [{ value: padding(0) }],
              width: [{ value: { value: 100, unit: "%" } }],
              textAlign: [{ value: "center" }],
            },
            props: {
              children: [
                headingBlock(
                  copy(t, "app_gift-card-studio_public.block.title"),
                  "h2",
                  {
                    fontSize: [{ value: rem(1.25) }],
                    fontWeight: [{ value: "600" }],
                    textAlign: [{ value: "center" }],
                    padding: [{ value: padding(0) }],
                  },
                ),
                textBlock(
                  copy(t, "app_gift-card-studio_public.block.description"),
                  {
                    fontSize: [{ value: rem(0.875) }],
                    textAlign: [{ value: "center" }],
                    color: [{ value: "var(--value-muted-foreground-color)" }],
                    padding: [{ value: padding(0) }],
                  },
                ),
              ],
            },
          },
        },
      ],
    }),
    abovePreview: migrateSlotValue({
      children: [
        {
          type: "Container",
          id: generateId(),
          data: {
            style: {
              display: [{ value: "flex" }],
              flexDirection: [{ value: "column" }],
              gap: [{ value: rem(0.5) }],
              padding: [{ value: padding(0) }],
              width: [{ value: { value: 100, unit: "%" } }],
            },
            props: {
              children: [
                headingBlock(
                  copy(
                    t,
                    "app_gift-card-studio_public.block.showcaseDefaults.title",
                  ),
                  "h2",
                  {
                    fontSize: [{ value: rem(1.875) }],
                    fontWeight: [{ value: "400" }],
                    textAlign: [{ value: "left" }],
                    padding: [{ value: padding(0) }],
                  },
                ),
                textBlock(
                  copy(
                    t,
                    "app_gift-card-studio_public.block.showcaseDefaults.description",
                  ),
                  {
                    fontSize: [{ value: rem(1) }],
                    textAlign: [{ value: "left" }],
                    color: [{ value: "var(--value-muted-foreground-color)" }],
                    padding: [{ value: padding(0) }],
                  },
                ),
              ],
            },
          },
        },
      ],
    }),
    belowPreview: migrateSlotValue({
      children: [
        {
          type: "GridContainer",
          id: generateId(),
          data: {
            style: {
              display: [{ value: "grid" }],
              gridTemplateColumns: [
                { value: "repeat(auto-fit, minmax(7rem, 1fr))" },
              ],
              gap: [{ value: rem(1) }],
              padding: [{ value: padding(0) }],
              width: [{ value: { value: 100, unit: "%" } }],
            },
            props: {
              children: [
                featureItem(
                  t,
                  "mail",
                  "app_gift-card-studio_public.block.showcaseDefaults.deliveryTitle",
                  "app_gift-card-studio_public.block.showcaseDefaults.deliveryDescription",
                ),
                featureItem(
                  t,
                  "calendar",
                  "app_gift-card-studio_public.block.showcaseDefaults.validityTitle",
                  "app_gift-card-studio_public.block.showcaseDefaults.validityDescription",
                ),
                featureItem(
                  t,
                  "lock",
                  "app_gift-card-studio_public.block.showcaseDefaults.secureTitle",
                  "app_gift-card-studio_public.block.showcaseDefaults.secureDescription",
                ),
              ],
            },
          },
        },
      ],
    }),
  };
}
