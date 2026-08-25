import { TReaderBlock, generateId as generateBlockId } from "@hacado/builder";
import { deserializeMarkdown } from "@hacado/rte";
import { EMAIL_BRAND } from "../brand";

export type EmailTemplateButton = {
  text: string;
  url: string;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right";
};

export type EmailContentBlock =
  | {
      type: "text";
      text: string;
      align?: "left" | "center" | "right";
    }
  | {
      type: "title";
      text: string;
      level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      align?: "left" | "center" | "right";
      backgroundColor?: string;
      textColor?: string;
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
      button: EmailTemplateButton;
    }
  | {
      type: "conditional";
      condition: string;
      then: EmailContentBlock[];
      otherwise?: EmailContentBlock[];
    }
  | {
      /** Centered muted business name / address / phone footer. */
      type: "businessFooter";
    };

export type EmailContentBlockType = EmailContentBlock["type"];

export type BuildEmailContentBlockOptions = {
  /**
   * Optional text transform (e.g. mustache interpolate for rendered emails).
   * For stored customer templates, leave unset so placeholders stay literal.
   */
  transformText?: (text: string, allowHtml?: boolean) => string;
};

const identity = (text: string) => text;

function buildBusinessFooterBlock(): TReaderBlock {
  const muted = (text: string) => ({
    text,
    fontSize: "11px",
    color: "#999999",
  });

  return {
    type: "Text",
    id: generateBlockId(),
    data: {
      props: {
        value: [
          {
            type: "p",
            align: "center",
            children: [muted("{{config.name}}")],
          },
          {
            type: "p",
            align: "center",
            children: [muted("{{config.address}}")],
          },
          {
            type: "p",
            align: "center",
            children: [muted("{{config.phone}}")],
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
  };
}

/** Shared addons line wrapped in ConditionalContainer. */
export function addonsSelectedBlock(
  text = "Addons selected: {{#addons}}{{name}}, {{/addons}}",
): EmailContentBlock {
  return {
    type: "conditional",
    condition: "addons.length > 0",
    then: [{ type: "text", text }],
  };
}

export const businessFooterBlock: EmailContentBlock = {
  type: "businessFooter",
};

export function buildEmailContentBlock(
  block: EmailContentBlock,
  options: BuildEmailContentBlockOptions = {},
  nextBlock?: EmailContentBlock,
  previousBlock?: EmailContentBlock,
): TReaderBlock {
  const transformText = options.transformText ?? identity;

  switch (block.type) {
    case "text":
      return {
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
            textAlign: block.align,
          },
          props: {
            value: deserializeMarkdown(transformText(block.text, true), {
              allowHtml: true,
            }),
          },
        },
      };
    case "title":
      return {
        type: "Heading",
        id: generateBlockId(),
        data: {
          props: {
            text: transformText(block.text),
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
            backgroundColor: block.backgroundColor,
            color: block.textColor,
          },
        },
      };
    case "image":
      return {
        type: "Image",
        id: generateBlockId(),
        data: {
          props: {
            url: transformText(block.url, true),
            alt: transformText(block.alt, true),
            contentAlignment: "middle",
            linkHref: block.linkHref
              ? transformText(block.linkHref, true)
              : undefined,
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
          },
        },
      };
    case "button": {
      const { button } = block;
      return {
        type: "Button",
        id: generateBlockId(),
        data: {
          props: {
            text: transformText(button.text),
            url: transformText(button.url, true),
            width: "full",
            size: "large",
            buttonStyle: "rounded",
            buttonTextColor: button.textColor ?? EMAIL_BRAND.onPrimary,
            buttonBackgroundColor:
              button.backgroundColor ?? EMAIL_BRAND.primary,
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
      };
    }
    case "conditional":
      return {
        type: "ConditionalContainer",
        id: generateBlockId(),
        data: {
          props: {
            condition: block.condition,
            then: {
              children: buildEmailContentBlocks(block.then, options),
            },
            otherwise: {
              children: buildEmailContentBlocks(block.otherwise ?? [], options),
            },
          },
        },
      };
    case "businessFooter":
      return buildBusinessFooterBlock();
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

export function buildEmailContentBlocks(
  content: EmailContentBlock[],
  options: BuildEmailContentBlockOptions = {},
): TReaderBlock[] {
  return content.map((block, index, array) =>
    buildEmailContentBlock(block, options, array[index + 1], array[index - 1]),
  );
}
