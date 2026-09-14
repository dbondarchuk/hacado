import { BaseReaderBlockProps, generateId } from "@hacado/builder";
import { COLORS } from "@hacado/page-builder-base/style";
import * as z from "zod";
import { ContainerPropsDefaults } from "../container/schema";
import { zStyles } from "./styles";

export const showStickyBannerType = ["always", "one-time", "on-click"] as const;
export const stickyBannerPositionType = ["top", "bottom"] as const;

export const StickyBannerPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    show: z.enum(showStickyBannerType),
    position: z.enum(stickyBannerPositionType),
    showCloseButton: z.boolean().optional(),
    content: z.object({
      children: z.array(z.any()).max(1),
    }),
  }),
});

export type StickyBannerProps = z.infer<typeof StickyBannerPropsSchema>;
export type StickyBannerReaderProps = BaseReaderBlockProps<any> &
  StickyBannerProps;

export const StickyBannerPropsDefaults = () =>
  ({
    style: {
      width: [
        {
          value: {
            value: 100,
            unit: "%",
          },
        },
      ],
      backgroundColor: [
        {
          value: COLORS.background.value,
        },
      ],
      padding: [
        {
          value: {
            top: { value: 0, unit: "rem" },
            right: { value: 0, unit: "rem" },
            bottom: { value: 0, unit: "rem" },
            left: { value: 0, unit: "rem" },
          },
        },
      ],
      boxShadow: [
        {
          value: {
            x: 0,
            y: -2,
            blur: 8,
            spread: 0,
            color: COLORS.foreground.value,
            inset: false,
          },
        },
      ],
    },
    props: {
      show: "always",
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
                minHeight: [
                  {
                    value: { value: 3, unit: "rem" },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  }) as const satisfies StickyBannerProps;
