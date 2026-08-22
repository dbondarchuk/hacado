import { templateSafeWithError } from "@hacado/utils";
import { EMAIL_BRAND } from "../brand";
import {
  buildEmailContentBlocks,
  type EmailContentBlock,
  type EmailTemplateButton,
} from "./content-blocks";
import { renderToStaticMarkup } from "./static";

/** @deprecated Prefer EmailContentBlock / EmailTemplateButton from content-blocks */
export type UserEmailTemplateButton = EmailTemplateButton;

/** @deprecated Prefer EmailContentBlock from content-blocks */
export type UserEmailTemplateContentBlock = EmailContentBlock;

export type UserEmailTemplateContentBlockType =
  UserEmailTemplateContentBlock["type"];

export type UserEmailTemplateProps = {
  previewText: string;
  content: Array<UserEmailTemplateContentBlock>;
};

export const renderUserEmailTemplate = async (
  { content, previewText }: UserEmailTemplateProps,
  args: Record<string, any> = {},
) => {
  const contentBlocks = buildEmailContentBlocks(content, {
    transformText: (text, allowHtml) =>
      templateSafeWithError(text, args, allowHtml),
  });

  const appUrl = `https://${process.env.ADMIN_DOMAIN ?? "app.hacado.com"}`;

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
              alt: "Hacado Logo",
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
                ? `Hacado - ${args.config.name}`
                : "Hacado",
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
                          text: "Hacado",
                        },
                      ],
                      target: "_blank",
                      type: "a",
                      url: "https://hacado.com",
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
              textAlign: "center",
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
