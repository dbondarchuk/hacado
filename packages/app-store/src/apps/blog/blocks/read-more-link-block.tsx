import {
  generateId,
  generateId as generateLinkId,
  TEditorBlock,
} from "@timelish/builder";
import { COLORS } from "@timelish/page-builder-base/style";

const InlineContainerPropsDefaults = {
  style: {
    padding: [
      {
        value: {
          top: { value: 0, unit: "rem" },
          bottom: { value: 0, unit: "rem" },
          left: { value: 0, unit: "rem" },
          right: { value: 0, unit: "rem" },
        },
      },
    ],
    display: [{ value: "inline-flex" }],
    flexDirection: [{ value: "row" }],
    alignItems: [{ value: "center" }],
    justifyContent: [{ value: "center" }],
    gap: [{ value: { value: 0.5, unit: "rem" } }],
  },
  props: {
    children: [],
  },
};

const getLinkStyleDefaults = () => ({
  color: [{ value: COLORS["primary"].value }],
  fontSize: [{ value: { value: 1, unit: "rem" } }],
  fontWeight: [{ value: "normal" }],
  textAlign: [{ value: "left" }],
  display: [{ value: "inline" }],
  transition: [{ value: "color 0.2s ease" }],
});

export const getBlogPostReadMoreLinkBlock = (text: string): TEditorBlock => ({
  type: "Link",
  id: generateId(),
  data: {
    props: {
      url: "{{postLink}}",
      target: "_self",
      children: [
        {
          type: "InlineContainer",
          id: generateLinkId(),
          data: {
            style: {
              ...InlineContainerPropsDefaults.style,
              textDecoration: [{ value: "underline" }],
            },
            props: {
              children: [
                {
                  type: "InlineText",
                  id: generateLinkId(),
                  data: {
                    props: {
                      text,
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    style: getLinkStyleDefaults(),
  },
});

/** English seed label for default blog pages (matches en public `readMore`). */
export const BLOG_POST_READ_MORE_SEED_LABEL = "Read more";
