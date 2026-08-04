import { TReaderBlock, generateId as generateBlockId } from "@timelish/builder";
import { deserializeMarkdown } from "@timelish/rte";
import { templateSafeWithError } from "@timelish/utils";
import { EMAIL_BRAND } from "../brand";
import { renderToStaticMarkup } from "./static";

export type UserEmailTemplateButton = {
  text: string;
  url: string;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right";
};

export type UserEmailTemplateContentBlock =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "title";
      text: string;
      level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    }
  | {
      type: "image";
      url: string;
      alt: string;
      linkHref?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }
  | {
      type: "button";
      button: UserEmailTemplateButton;
    };

export type UserEmailTemplateContentBlockType =
  UserEmailTemplateContentBlock["type"];

export type UserEmailTemplateProps = {
  previewText: string;
  content: Array<UserEmailTemplateContentBlock>;
};

const contentBlockTypeRenderMap: {
  [key in UserEmailTemplateContentBlockType]: (
    block: Extract<UserEmailTemplateContentBlock, { type: key }>,
    args: Record<string, any>,
    nextBlock: UserEmailTemplateContentBlock | undefined,
    previousBlock: UserEmailTemplateContentBlock | undefined,
  ) => TReaderBlock;
} = {
  text: (block, args) => ({
    type: "Text",
    id: generateBlockId(),
    data: {
      style: {
        fontWeight: "normal",
        padding: {
          top: 16,
          bottom: 0,
          right: 24,
          left: 24,
        },
      },
      props: {
        value: deserializeMarkdown(
          templateSafeWithError(block.text, args, true),
          {
            allowHtml: true,
          },
        ),
      },
    },
  }),
  title: (block, args) => ({
    type: "Heading",
    id: generateBlockId(),
    data: {
      props: {
        text: templateSafeWithError(block.text, args),
        level: block.level,
      },
      style: {
        textAlign: "center",
        padding: {
          top: 16,
          bottom: 16,
          right: 24,
          left: 24,
        },
      },
    },
  }),
  image: (block, args) => ({
    type: "Image",
    id: generateBlockId(),
    data: {
      props: {
        url: templateSafeWithError(block.url, args, true),
        alt: templateSafeWithError(block.alt, args, true),
        contentAlignment: "middle",
        linkHref: block.linkHref
          ? templateSafeWithError(block.linkHref, args, true)
          : undefined,
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height,
      },
    },
  }),
  button: ({ button }, args, nextBlock, previousBlock) => ({
    type: "Button",
    id: generateBlockId(),
    data: {
      props: {
        text: templateSafeWithError(button.text, args),
        url: templateSafeWithError(button.url, args, true),
        width: "full",
        size: "large",
        buttonStyle: "rounded",
        buttonTextColor: button.textColor ?? EMAIL_BRAND.onPrimary,
        buttonBackgroundColor: button.backgroundColor ?? EMAIL_BRAND.primary,
      },
      style: {
        padding: {
          top: previousBlock?.type === "button" ? 0 : 16,
          bottom: nextBlock?.type === "button" ? 4 : 16,
          left: 24,
          right: 24,
        },
        fontWeight: button.fontWeight ?? "normal",
        fontSize: button.fontSize ?? 16,
        textAlign: button.textAlign ?? "center",
      },
    },
  }),
};

export const renderUserEmailTemplate = async (
  { content, previewText }: UserEmailTemplateProps,
  args: Record<string, any> = {},
) => {
  const contentBlocks = content.map((block, index, array) =>
    contentBlockTypeRenderMap[block.type](
      block as any,
      args,
      array[index + 1],
      array[index - 1],
    ),
  );

  const appUrl = `https://${process.env.ADMIN_DOMAIN ?? "app.timelish.com"}`;

  const userEmailTemplate = {
    type: "EmailLayout",
    id: "block-1740257042800",
    data: {
      backdropColor: EMAIL_BRAND.cream,
      borderRadius: 0,
      canvasColor: EMAIL_BRAND.creamLight,
      textColor: EMAIL_BRAND.ink,
      fontFamily: "MODERN_SANS",
      previewText: previewText,
      maxWidth: 600,
      children: [
        {
          id: "block-36919dfb-0ea4-4f96-bf60-26e647e8f0a9",
          type: "Image",
          data: {
            props: {
              url: `${appUrl}/email-logo.png`,
              alt: "Timeli.sh Logo",
              contentAlignment: "middle",
              linkHref: appUrl,
              x: 50,
              y: 50,
              width: 200,
              height: 50,
            },
            style: {
              padding: {
                top: 16,
                bottom: 16,
                left: 24,
                right: 24,
              },
              textAlign: "center",
            },
          },
        },
        {
          type: "Heading",
          id: "block-1740257133963",
          data: {
            props: {
              text: args.config?.name
                ? `Timeli.sh - ${args.config.name}`
                : "Timeli.sh",
              level: "h3",
            },
            style: {
              textAlign: "center",
              padding: {
                top: 16,
                bottom: 16,
                right: 24,
                left: 24,
              },
            },
          },
        },
        ...contentBlocks,
        {
          type: "Text",
          id: "block-1740258119442",
          data: {
            props: {
              value: [
                {
                  type: "p",
                  align: "center",
                  id: "FcuEZnvN7_",
                  children: [
                    {
                      text: `© ${new Date().getFullYear()}`,
                      fontSize: "11px",
                      color: "#999999",
                    },
                    {
                      text: " ",
                    },
                    {
                      children: [
                        {
                          fontSize: "11px",
                          color: "#999999",
                          text: "Timeli.sh",
                        },
                      ],
                      target: "_blank",
                      type: "a",
                      url: "https://timelish.com",
                      id: "X72UXuZzN_",
                    },
                    {
                      text: "",
                    },
                  ],
                },
              ],
            },
            style: {
              padding: {
                top: 16,
                bottom: 16,
                left: 24,
                right: 24,
              },
              fontWeight: "normal",
            },
          },
        },
      ],
    },
  };

  return await renderToStaticMarkup({
    document: userEmailTemplate,
    args,
  });
};
