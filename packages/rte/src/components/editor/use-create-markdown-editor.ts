import { withProps } from "@udecode/cn";
import {
  BoldPlugin,
  CodePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
} from "@udecode/plate-basic-marks/react";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import {
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,
} from "@udecode/plate-code-block/react";
import { EmojiInputPlugin } from "@udecode/plate-emoji/react";
import { HEADING_KEYS } from "@udecode/plate-heading";
import { TocPlugin } from "@udecode/plate-heading/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { LinkPlugin } from "@udecode/plate-link/react";
import {
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
} from "@udecode/plate-media/react";
import { TogglePlugin } from "@udecode/plate-toggle/react";
import {
  ParagraphPlugin,
  PlateEditor,
  PlateLeaf,
  usePlateEditor,
} from "@udecode/plate/react";

import { deserializeMd } from "@udecode/plate-markdown";
import { BlockquoteElement } from "../plate-ui/blockquote-element";
import { CodeBlockElement } from "../plate-ui/code-block-element";
import { CodeLeaf } from "../plate-ui/code-leaf";
import { CodeLineElement } from "../plate-ui/code-line-element";
import { CodeSyntaxLeaf } from "../plate-ui/code-syntax-leaf";
import { EmojiInputElement } from "../plate-ui/emoji-input-element";
import { HeadingElement } from "../plate-ui/heading-element";
import { HrElement } from "../plate-ui/hr-element";
import { ImageElement } from "../plate-ui/image-element";
import { LinkElement } from "../plate-ui/link-element";
import { MediaEmbedElement } from "../plate-ui/media-embed-element";
import { MediaPlaceholderElement } from "../plate-ui/media-placeholder-element";
import { ParagraphElement } from "../plate-ui/paragraph-element";
import { withPlaceholders } from "../plate-ui/placeholder";
import { TocElement } from "../plate-ui/toc-element";
import { ToggleElement } from "../plate-ui/toggle-element";
import { editorPlugins } from "./plugins/editor-plugins";
import { FixedToolbarPlugin } from "./plugins/fixed-toolbar-plugin";
import { FloatingToolbarPlugin } from "./plugins/floating-toolbar-plugin";

import remarkEmoji from "remark-emoji";

export const useCreateMarkdownEditor = (value?: string) => {
  return usePlateEditor({
    override: {
      components: withPlaceholders({
        [BlockquotePlugin.key]: BlockquoteElement,
        [BoldPlugin.key]: withProps(PlateLeaf, { as: "strong" }),
        [CodeBlockPlugin.key]: CodeBlockElement,
        [CodeLinePlugin.key]: CodeLineElement,
        [CodePlugin.key]: CodeLeaf,
        [CodeSyntaxPlugin.key]: CodeSyntaxLeaf,
        [EmojiInputPlugin.key]: EmojiInputElement,
        [HEADING_KEYS.h1]: withProps(HeadingElement, { variant: "h1" }),
        [HEADING_KEYS.h2]: withProps(HeadingElement, { variant: "h2" }),
        [HEADING_KEYS.h3]: withProps(HeadingElement, { variant: "h3" }),
        [HEADING_KEYS.h4]: withProps(HeadingElement, { variant: "h4" }),
        [HEADING_KEYS.h5]: withProps(HeadingElement, { variant: "h5" }),
        [HEADING_KEYS.h6]: withProps(HeadingElement, { variant: "h6" }),
        [HorizontalRulePlugin.key]: HrElement,
        [ImagePlugin.key]: ImageElement,
        [ItalicPlugin.key]: withProps(PlateLeaf, { as: "em" }),
        [LinkPlugin.key]: LinkElement,
        [MediaEmbedPlugin.key]: MediaEmbedElement,
        [ParagraphPlugin.key]: ParagraphElement,
        [PlaceholderPlugin.key]: MediaPlaceholderElement,
        [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: "s" }),
        [TocPlugin.key]: TocElement,
        [TogglePlugin.key]: ToggleElement,
        [UnderlinePlugin.key]: withProps(PlateLeaf, { as: "u" }),
      }),
    },
    plugins: [
      // ...copilotPlugins,
      ...editorPlugins,
      FixedToolbarPlugin({ isMarkdown: true }),
      FloatingToolbarPlugin(true),
    ],
    value: (editor: PlateEditor) =>
      deserializeMd(editor, value || "", {
        remarkPlugins: [remarkEmoji as any],
      }),
  });
};
