import { BaseReaderBlockProps, generateId } from "@hacado/builder";
import { COLORS } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types";
import * as z from "zod";
import { zStyles } from "./styles";

export const LinkPropsSchema = z.object({
  props: z
    .object({
      children: z.array(z.any()),
      url: z.string().optional().nullable(),
      target: z.enum(["_self", "_blank"]).optional().nullable(),
    })
    .optional()
    .nullable(),
  style: zStyles,
});

export type LinkProps = Prettify<z.infer<typeof LinkPropsSchema>>;
export type LinkReaderProps = BaseReaderBlockProps<any> & LinkProps;

export const LinkDefaultUrl = "/";
export const LinkDefaultTarget = "_self";

export const LinkPropsDefaults = () =>
  ({
    props: {
      url: LinkDefaultUrl,
      target: LinkDefaultTarget,
      children: [
        // {
        //   type: "InlineContainer",
        //   id: generateId(),
        //   data: {
        //     style: {
        //       ...InlineContainerPropsDefaults.style,
        //       textDecoration: [
        //         {
        //           value: "underline",
        //         },
        //       ],
        //     },
        //     props: {
        //       children: [
        //         {
        //           type: "InlineText",
        //           id: generateId(),
        //           data: {
        //             props: {
        //               text: "Link",
        //             },
        //           },
        //         },
        //       ],
        //     },
        //   },
        // },
        {
          type: "InlineText",
          id: generateId(),
          data: {
            props: {
              text: "Link",
            },
          },
        },
      ],
    },
    style: {
      color: [
        {
          value: COLORS["primary"].value,
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
          value: "left",
        },
      ],
      width: [
        {
          value: "auto",
        },
      ],
      display: [
        {
          value: "inline",
        },
      ],
      transition: [
        {
          value: "color 0.2s ease",
        },
      ],
      //   filter: [
      //     {
      //       value: "brightness(0.9)",
      //       state: ["hover", "focus"],
      //     },
      //   ],
    },
  }) as const satisfies LinkProps;
