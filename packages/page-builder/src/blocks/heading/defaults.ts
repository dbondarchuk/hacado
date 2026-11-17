import { generateId } from "@hacado/builder/helpers";
import { InlineContainerPropsDefaults } from "../inline-container/defaults";
import type { HeadingProps } from "./schema";

export const HeadingPropsDefaults = () =>
  ({
    props: {
      level: "h2" as const,
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
                      text: "Hello friend",
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
      padding: [
        {
          value: {
            top: { value: 1, unit: "rem" },
            bottom: { value: 1, unit: "rem" },
            left: { value: 1.5, unit: "rem" },
            right: { value: 1.5, unit: "rem" },
          },
        },
      ],
      textAlign: [{ value: "center" }],
      fontWeight: [{ value: "bold" }],
      fontFamily: [{ value: "SECONDARY" }],
    },
  }) as const satisfies HeadingProps;
