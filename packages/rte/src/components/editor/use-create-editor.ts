import { withProps } from "@udecode/cn";
import {
  BoldPlugin,
  CodePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  UnderlinePlugin,
} from "@udecode/plate-basic-marks/react";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import {
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,
} from "@udecode/plate-code-block/react";
import { CommentsPlugin } from "@udecode/plate-comments/react";
import { DatePlugin } from "@udecode/plate-date/react";
import { EmojiInputPlugin } from "@udecode/plate-emoji/react";
import { ExcalidrawPlugin } from "@udecode/plate-excalidraw/react";
import { HEADING_KEYS } from "@udecode/plate-heading";
import { TocPlugin } from "@udecode/plate-heading/react";
import { HighlightPlugin } from "@udecode/plate-highlight/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { KbdPlugin } from "@udecode/plate-kbd/react";
import { ColumnItemPlugin, ColumnPlugin } from "@udecode/plate-layout/react";
import { LinkPlugin } from "@udecode/plate-link/react";
import {
  EquationPlugin,
  InlineEquationPlugin,
} from "@udecode/plate-math/react";
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from "@udecode/plate-media/react";
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from "@udecode/plate-table/react";
import { TogglePlugin } from "@udecode/plate-toggle/react";
import {
  ParagraphPlugin,
  PlateLeaf,
  usePlateEditor,
} from "@udecode/plate/react";

import { Value } from "@udecode/plate";
import { SingleLinePlugin } from "@udecode/plate-break/react";
import { BlockquoteElement } from "../plate-ui/blockquote-element";
import { CodeBlockElement } from "../plate-ui/code-block-element";
import { CodeLeaf } from "../plate-ui/code-leaf";
import { CodeLineElement } from "../plate-ui/code-line-element";
import { CodeSyntaxLeaf } from "../plate-ui/code-syntax-leaf";
import { ColumnElement } from "../plate-ui/column-element";
import { ColumnGroupElement } from "../plate-ui/column-group-element";
import { CommentLeaf } from "../plate-ui/comment-leaf";
import { DateElement } from "../plate-ui/date-element";
import { EmojiInputElement } from "../plate-ui/emoji-input-element";
import { EquationElement } from "../plate-ui/equation-element";
import { ExcalidrawElement } from "../plate-ui/excalidraw-element";
import { HeadingElement } from "../plate-ui/heading-element";
import { HighlightLeaf } from "../plate-ui/highlight-leaf";
import { HrElement } from "../plate-ui/hr-element";
import { ImageElement } from "../plate-ui/image-element";
import { InlineEquationElement } from "../plate-ui/inline-equation-element";
import { KbdLeaf } from "../plate-ui/kbd-leaf";
import { LinkElement } from "../plate-ui/link-element";
import { MediaAudioElement } from "../plate-ui/media-audio-element";
import { MediaEmbedElement } from "../plate-ui/media-embed-element";
import { MediaFileElement } from "../plate-ui/media-file-element";
import { MediaPlaceholderElement } from "../plate-ui/media-placeholder-element";
import { MediaVideoElement } from "../plate-ui/media-video-element";
import { ParagraphElement } from "../plate-ui/paragraph-element";
import { withPlaceholders } from "../plate-ui/placeholder";
import {
  TableCellElement,
  TableCellHeaderElement,
} from "../plate-ui/table-cell-element";
import { TableElement } from "../plate-ui/table-element";
import { TableRowElement } from "../plate-ui/table-row-element";
import { TocElement } from "../plate-ui/toc-element";
import { ToggleElement } from "../plate-ui/toggle-element";
import { editorPlugins } from "./plugins/editor-plugins";
import { FixedToolbarPlugin } from "./plugins/fixed-toolbar-plugin";
import { FloatingToolbarPlugin } from "./plugins/floating-toolbar-plugin";

export const useCreateEditor = (
  value?: Value,
  options?: {
    singleLine?: boolean;
    noToolbar?: boolean;
    overlayToolbar?: boolean;
  },
) => {
  return usePlateEditor({
    override: {
      components: withPlaceholders({
        // [AIPlugin.key]: AILeaf,
        [AudioPlugin.key]: MediaAudioElement,
        [BlockquotePlugin.key]: BlockquoteElement,
        [BoldPlugin.key]: withProps(PlateLeaf, { as: "strong" }),
        [CodeBlockPlugin.key]: CodeBlockElement,
        [CodeLinePlugin.key]: CodeLineElement,
        [CodePlugin.key]: CodeLeaf,
        [CodeSyntaxPlugin.key]: CodeSyntaxLeaf,
        [ColumnItemPlugin.key]: ColumnElement,
        [ColumnPlugin.key]: ColumnGroupElement,
        [CommentsPlugin.key]: CommentLeaf,
        [DatePlugin.key]: DateElement,
        [EmojiInputPlugin.key]: EmojiInputElement,
        [EquationPlugin.key]: EquationElement,
        [ExcalidrawPlugin.key]: ExcalidrawElement,
        [FilePlugin.key]: MediaFileElement,
        [HEADING_KEYS.h1]: withProps(HeadingElement, { variant: "h1" }),
        [HEADING_KEYS.h2]: withProps(HeadingElement, { variant: "h2" }),
        [HEADING_KEYS.h3]: withProps(HeadingElement, { variant: "h3" }),
        [HEADING_KEYS.h4]: withProps(HeadingElement, { variant: "h4" }),
        [HEADING_KEYS.h5]: withProps(HeadingElement, { variant: "h5" }),
        [HEADING_KEYS.h6]: withProps(HeadingElement, { variant: "h6" }),
        [HighlightPlugin.key]: HighlightLeaf,
        [HorizontalRulePlugin.key]: HrElement,
        [ImagePlugin.key]: ImageElement,
        [InlineEquationPlugin.key]: InlineEquationElement,
        [ItalicPlugin.key]: withProps(PlateLeaf, { as: "em" }),
        [KbdPlugin.key]: KbdLeaf,
        [LinkPlugin.key]: LinkElement,
        [MediaEmbedPlugin.key]: MediaEmbedElement,
        // [ArgsInputPlugin.key]: MentionInputElement,
        // [ArgsPlugin.key]: MentionElement,
        [ParagraphPlugin.key]: ParagraphElement,
        [PlaceholderPlugin.key]: MediaPlaceholderElement,
        // [SlashInputPlugin.key]: SlashInputElement,
        [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: "s" }),
        [SubscriptPlugin.key]: withProps(PlateLeaf, { as: "sub" }),
        [SuperscriptPlugin.key]: withProps(PlateLeaf, { as: "sup" }),
        [TableCellHeaderPlugin.key]: TableCellHeaderElement,
        [TableCellPlugin.key]: TableCellElement,
        [TablePlugin.key]: TableElement,
        [TableRowPlugin.key]: TableRowElement,
        [TocPlugin.key]: TocElement,
        [TogglePlugin.key]: ToggleElement,
        [UnderlinePlugin.key]: withProps(PlateLeaf, { as: "u" }),
        [VideoPlugin.key]: MediaVideoElement,
      }),
    },
    plugins: [
      // ...copilotPlugins,
      ...editorPlugins,
      ...(options?.noToolbar
        ? []
        : [FixedToolbarPlugin({ overlay: options?.overlayToolbar })]),
      FloatingToolbarPlugin(),
      ...(options?.singleLine ? [SingleLinePlugin] : []),
    ],
    value: value || [],
  });
};
