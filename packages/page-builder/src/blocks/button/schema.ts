import { BaseReaderBlockProps, generateId } from "@hacado/builder";
import { COLORS } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types";
import * as z from "zod";
import { InlineContainerPropsDefaults } from "../inline-container";
import { zStyles } from "./styles";

export const ButtonType = z.enum(["action", "link"]);

export const ButtonPropsSchema = z.object({
  props: z
    .discriminatedUnion("type", [
      z.object({
        type: z.literal("action"),
        action: z.string({
          error: "pageBuilder.blocks.button.errors.action",
        }),
        actionData: z.any().optional().nullable(),
        children: z.array(z.any()),
      }),
      z.object({
        type: z.literal("link").optional().nullable(),
        children: z.array(z.any()),
        url: z.string().optional().nullable(),
        target: z.enum(["_self", "_blank"]).optional().nullable(),
      }),
    ])
    .optional()
    .nullable(),
  style: zStyles,
});

export type ButtonProps = Prettify<z.infer<typeof ButtonPropsSchema>>;
export type ButtonReaderProps = BaseReaderBlockProps<any> & ButtonProps;

export const ButtonDefaultUrl = "/";
export const ButtonDefaultTarget = "_self";
export const ButtonDefaultAction = "open-popup";

export const ButtonPropsDefaults = () =>
  ({
    props: {
      url: ButtonDefaultUrl,
      target: ButtonDefaultTarget,
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
                      text: "Button",
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
      color: [
        {
          value: COLORS["primary-foreground"].value,
        },
      ],
      padding: [
        {
          value: {
            top: { value: 0.75, unit: "rem" },
            right: { value: 1.5, unit: "rem" },
            bottom: { value: 0.75, unit: "rem" },
            left: { value: 1.5, unit: "rem" },
          },
        },
      ],
      backgroundColor: [
        {
          value: COLORS["primary"].value,
        },
      ],
      filter: [
        {
          value: "brightness(1.1)",
          state: [
            { state: "hover", target: { type: "self" } },
            { state: "focus", target: { type: "self" } },
            { state: "active", target: { type: "self" } },
          ],
        },
      ],
      transition: [
        {
          value: "all 0.3s ease",
        },
      ],
      fontSize: [
        {
          value: {
            value: 1,
            unit: "rem",
          },
        },
      ],
      fontWeight: [
        {
          value: "normal",
        },
      ],
      textAlign: [
        {
          value: "center",
        },
      ],
      width: [
        {
          value: "max-content",
        },
      ],
      display: [
        {
          value: "inline-flex",
        },
      ],
    },
  }) as const satisfies ButtonProps;
