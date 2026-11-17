import { generateId } from "@hacado/builder/helpers";
import { InlineContainerPropsDefaults } from "../inline-container/defaults";
import type { ButtonProps } from "./schema";

export const ButtonDefaultUrl = "/";
export const ButtonDefaultTarget = "_self";
export const ButtonDefaultAction = "open-modal";

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
      color: [{ value: "var(--value-primary-foreground-color)" }],
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
      backgroundColor: [{ value: "var(--value-primary-color)" }],
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
      transition: [{ value: "all 0.3s ease" }],
      fontSize: [{ value: { value: 1, unit: "rem" } }],
      fontWeight: [{ value: "normal" }],
      textAlign: [{ value: "center" }],
      width: [{ value: "max-content" }],
      display: [{ value: "inline-flex" }],
    },
  }) as const satisfies ButtonProps;
