import { generateId } from "@hacado/builder";
import { AccordionItemPropsDefaults } from "../accordion-item/schema";
import type { AccordionProps } from "./schema";

export const AccordionPropsDefaults = {
  props: {
    allowMultipleOpen: false,
    defaultOpenFirst: false,
    animation: "slide" as const,
    iconPosition: "right" as const,
    iconStyle: "chevron" as const,
    children: [
      {
        type: "AccordionItem",
        data: AccordionItemPropsDefaults(),
        id: generateId(),
      },
    ],
  },
  style: {
    textAlign: [
      {
        value: "left",
      },
    ],
    width: [
      {
        value: {
          value: 100,
          unit: "%",
        },
      },
    ],
    margin: [
      {
        value: {
          left: {
            value: 0,
            unit: "px",
          },
          right: {
            value: 0,
            unit: "px",
          },
          top: {
            value: 0,
            unit: "px",
          },
          bottom: {
            value: 0,
            unit: "px",
          },
        },
      },
    ],
    padding: [
      {
        value: {
          left: {
            value: 0,
            unit: "px",
          },
          right: {
            value: 0,
            unit: "px",
          },
          top: {
            value: 0,
            unit: "px",
          },
          bottom: {
            value: 0,
            unit: "px",
          },
        },
      },
    ],
    display: [
      {
        value: "flex",
      },
    ],
    flexDirection: [
      {
        value: "column",
      },
    ],
    gap: [
      {
        value: {
          value: 0.5,
          unit: "rem",
        },
      },
    ],
  },
} as const satisfies AccordionProps;
