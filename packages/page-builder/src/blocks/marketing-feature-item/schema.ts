import { BaseReaderBlockProps, generateId } from "@hacado/builder";
import type { BaseAllKeys, I18nFn } from "@hacado/i18n";
import {
  embeddedSlotSchema,
  migratePropsSlots,
  migrateSlotValue,
} from "@hacado/page-builder-base/slots";
import * as z from "zod";
import { GridContainerPropsDefaults } from "../grid-container/schema";
import { HeadingPropsDefaults } from "../heading/schema";
import { IconPropsDefaults } from "../icon/schema";
import { InlineContainerPropsDefaults } from "../inline-container/schema";
import { TextPropsDefaults } from "../text/schema";
import { zStyles } from "./styles";

const SLOT_KEYS = [
  "cardIcon",
  "title",
  "description",
  "detailHeadline",
  "detailBullets",
] as const;

const zSlot = embeddedSlotSchema(zStyles);

export const MarketingFeatureItemPropsSchema = z.object({
  style: zStyles,
  props: z.preprocess(
    (val) =>
      val && typeof val === "object"
        ? migratePropsSlots(val as Record<string, unknown>, [...SLOT_KEYS])
        : val,
    z.object({
      cardIcon: zSlot,
      title: zSlot,
      description: zSlot,
      detailHeadline: zSlot,
      detailBullets: zSlot,
    }),
  ),
});

export type MarketingFeatureItemProps = z.infer<
  typeof MarketingFeatureItemPropsSchema
>;
export type MarketingFeatureItemReaderProps = BaseReaderBlockProps<any> &
  MarketingFeatureItemProps;

function heading(text: string, level: "h2" | "h3" = "h3") {
  const h = HeadingPropsDefaults();
  return {
    ...h,
    props: {
      ...h.props,
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
  };
}

const bulletRow = (t: I18nFn<undefined, undefined>, labelKey: BaseAllKeys) => ({
  type: "InlineContainer" as const,
  id: generateId(),
  data: {
    style: {
      ...InlineContainerPropsDefaults.style,
      display: [{ value: "flex" }],
      flexDirection: [{ value: "row" }],
      alignItems: [{ value: "center" }],
      gap: [{ value: { value: 0.5, unit: "rem" } }],
    },
    props: {
      children: [
        {
          type: "Icon",
          id: generateId(),
          data: {
            ...IconPropsDefaults,
            props: {
              icon: "check",
            },
            style: {
              ...IconPropsDefaults.style,
              width: [{ value: { value: 1, unit: "rem" } }],
              height: [{ value: { value: 1, unit: "rem" } }],
              flexShrink: [{ value: "0" }],
            },
          },
        },
        {
          type: "InlineText",
          id: generateId(),
          data: {
            props: { text: t(labelKey) },
            style: {},
          },
        },
      ],
    },
  },
});

export const MarketingFeatureItemPropsDefaults = (
  t: I18nFn<undefined, undefined>,
): MarketingFeatureItemProps => ({
  style: {},
  props: {
    cardIcon: migrateSlotValue({
      children: [
        {
          type: "Icon",
          id: generateId(),
          data: {
            ...IconPropsDefaults,
            props: { icon: "globe" },
            style: {
              ...IconPropsDefaults.style,
              width: [{ value: { value: 1.75, unit: "rem" } }],
              height: [{ value: { value: 1.75, unit: "rem" } }],
            },
          },
        },
      ],
    }),
    title: migrateSlotValue({
      children: [
        {
          type: "Heading",
          id: generateId(),
          data: heading(
            t("builder.pageBuilder.marketingDefaults.featureItem.title"),
            "h3",
          ),
        },
      ],
    }),
    description: migrateSlotValue({
      children: [
        {
          type: "Text",
          id: generateId(),
          data: {
            ...TextPropsDefaults,
            props: {
              value: [
                {
                  type: "p",
                  children: [
                    {
                      text: t(
                        "builder.pageBuilder.marketingDefaults.featureItem.description",
                      ),
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
    }),
    detailHeadline: migrateSlotValue({
      children: [
        {
          type: "Heading",
          id: generateId(),
          data: heading(
            t(
              "builder.pageBuilder.marketingDefaults.featureItem.detailHeadline",
            ),
            "h3",
          ),
        },
      ],
    }),
    detailBullets: migrateSlotValue({
      children: [
        {
          type: "GridContainer",
          id: generateId(),
          data: {
            ...GridContainerPropsDefaults,
            style: {
              ...GridContainerPropsDefaults.style,
              gridTemplateColumns: [
                { value: "1fr", breakpoint: [] },
                {
                  value: "repeat(2, minmax(0, 1fr))",
                  breakpoint: ["sm"],
                },
              ],
              gap: [
                {
                  value: { value: 0.5, unit: "rem" },
                },
              ],
            },
            props: {
              children: [
                bulletRow(
                  t,
                  "builder.pageBuilder.marketingDefaults.featureItem.bullet1",
                ),
                bulletRow(
                  t,
                  "builder.pageBuilder.marketingDefaults.featureItem.bullet2",
                ),
              ],
            },
          },
        },
      ],
    }),
  },
});
