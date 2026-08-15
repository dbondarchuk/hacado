import {
  EditorDocumentBlocksDictionary,
  generateId,
  TEditorBlock,
} from "@hacado/builder";
import {
  CircleUserRound,
  Code,
  Columns3,
  CopyPlus,
  Heading,
  Image,
  Layout,
  RectangleHorizontal,
  Repeat2,
  ShieldQuestion,
  SquareMousePointer,
  SquareSplitVertical,
  Text,
  Video,
} from "lucide-react";
import {
  AvatarConfiguration,
  AvatarEditor,
  AvatarPropsDefaults,
  AvatarToolbar,
} from "./avatar";
import {
  ButtonConfiguration,
  ButtonEditor,
  ButtonPropsDefaults,
  ButtonToolbar,
} from "./button";
import {
  ColumnsContainerConfiguration,
  ColumnsContainerPropsDefaults,
  ColumnsContainerToolbar,
} from "./columns-container";
import { ColumnsContainerEditor } from "./columns-container/editor";
import {
  ConditionalContainerConfiguration,
  ConditionalContainerEditor,
  ConditionalContainerPropsDefaults,
} from "./conditional-container";
import {
  ContainerConfiguration,
  ContainerEditor,
  ContainerPropsDefaults,
  ContainerToolbar,
} from "./container";
import {
  CustomHTMLConfiguration,
  CustomHTMLEditor,
  CustomHTMLPropsDefaults,
  CustomHTMLToolbar,
} from "./custom-html";
import {
  DividerConfiguration,
  DividerEditor,
  DividerPropsDefaults,
  DividerToolbar,
} from "./divider";
import {
  EmailLayoutConfiguration,
  EmailLayoutEditor,
  EmailLayoutToolbar,
} from "./email-layout";
import {
  EmailLayoutDefaultProps,
  EmailLayoutProps,
} from "./email-layout/schema";
import {
  ForeachContainerConfiguration,
  ForeachContainerEditor,
  ForeachContainerPropsDefaults,
} from "./foreach-container";
import {
  HeadingConfiguration,
  HeadingEditor,
  HeadingPropsDefaults,
  HeadingToolbar,
} from "./heading";
import {
  ImageConfiguration,
  ImageEditor,
  ImagePropsDefaults,
  ImageToolbar,
} from "./image";
import {
  OnlineMeetingConfiguration,
  OnlineMeetingEditor,
  OnlineMeetingPropsDefaults,
} from "./online-meeting";
import { EditorBlocksSchema } from "./schema";
import {
  SpacerConfiguration,
  SpacerEditor,
  SpacerPropsDefaults,
  SpacerToolbar,
} from "./spacer";
import {
  TextConfiguration,
  TextEditor,
  TextPropsDefaults,
  TextToolbar,
} from "./text";

export const EditorBlocks: EditorDocumentBlocksDictionary<
  typeof EditorBlocksSchema
> = {
  Avatar: {
    displayName: "builder.emailBuilder.blocks.avatar.displayName",
    icon: <CircleUserRound />,
    Editor: AvatarEditor,
    Configuration: AvatarConfiguration,
    Toolbar: AvatarToolbar,
    defaultValue: AvatarPropsDefaults,
    category: "builder.emailBuilder.blocks.categories.images",
    capabilities: ["image", "media", "block"],
    tags: ["image", "media"],
  },
  Image: {
    displayName: "builder.emailBuilder.blocks.image.displayName",
    icon: <Image />,
    Editor: ImageEditor,
    Configuration: ImageConfiguration,
    Toolbar: ImageToolbar,
    defaultValue: ImagePropsDefaults,
    category: "builder.emailBuilder.blocks.categories.images",
    capabilities: ["image", "media", "block"],
    tags: ["image", "media"],
  },
  Button: {
    displayName: "builder.emailBuilder.blocks.button.displayName",
    icon: <SquareMousePointer />,
    Editor: ButtonEditor,
    Configuration: ButtonConfiguration,
    Toolbar: ButtonToolbar,
    defaultValue: ButtonPropsDefaults,
    category: "builder.emailBuilder.blocks.categories.text",
    capabilities: ["button", "action", "link", "block"],
    tags: ["button", "action", "link"],
  },
  Heading: {
    displayName: "builder.emailBuilder.blocks.heading.displayName",
    icon: <Heading />,
    Configuration: HeadingConfiguration,
    Editor: HeadingEditor,
    Toolbar: HeadingToolbar,
    defaultValue: HeadingPropsDefaults,
    category: "builder.emailBuilder.blocks.categories.text",
    disable: {
      keyboardShortcuts: {
        delete: true,
        moveUp: true,
        moveDown: true,
      },
    },
    capabilities: ["heading", "title", "block"],
    tags: ["heading", "title"],
  },
  Text: {
    displayName: "builder.emailBuilder.blocks.text.displayName",
    icon: <Text />,
    Editor: TextEditor,
    Configuration: TextConfiguration,
    Toolbar: TextToolbar,
    defaultValue: TextPropsDefaults,
    category: "builder.emailBuilder.blocks.categories.text",
    disable: {
      keyboardShortcuts: {
        delete: true,
        moveUp: true,
        moveDown: true,
        pasteImage: true,
        undoRedo: true,
      },
    },
    capabilities: ["text", "block"],
    tags: ["text", "block"],
  },
  Divider: {
    displayName: "builder.emailBuilder.blocks.divider.displayName",
    icon: <SquareSplitVertical />,
    Editor: DividerEditor,
    Configuration: DividerConfiguration,
    Toolbar: DividerToolbar,
    defaultValue: DividerPropsDefaults,
    category: "builder.emailBuilder.blocks.categories.dividers",
    capabilities: ["divider", "block"],
    tags: ["divider"],
  },
  Spacer: {
    displayName: "builder.emailBuilder.blocks.spacer.displayName",
    icon: <RectangleHorizontal />,
    Editor: SpacerEditor,
    Configuration: SpacerConfiguration,
    Toolbar: SpacerToolbar,
    defaultValue: SpacerPropsDefaults,
    category: "builder.emailBuilder.blocks.categories.dividers",
    capabilities: ["spacer", "block"],
    tags: ["spacer"],
  },
  EmailLayout: {
    displayName: "builder.emailBuilder.blocks.emailLayout.displayName",
    icon: <Layout />,
    Editor: EmailLayoutEditor,
    Configuration: EmailLayoutConfiguration,
    Toolbar: EmailLayoutToolbar,
    defaultValue: EmailLayoutDefaultProps,
    category: "builder.emailBuilder.blocks.categories.layout",
    capabilities: ["layout"],
    tags: ["layout"],
  },
  Container: {
    displayName: "builder.emailBuilder.blocks.container.displayName",
    icon: <CopyPlus />,
    Configuration: ContainerConfiguration,
    Editor: ContainerEditor,
    Toolbar: ContainerToolbar,
    defaultValue: ContainerPropsDefaults,
    category: "builder.emailBuilder.blocks.categories.containers",
    capabilities: ["container", "layout", "block"],
    tags: ["container", "layout"],
  },
  Columns: {
    displayName: "builder.emailBuilder.blocks.columnsContainer.displayName",
    icon: <Columns3 />,
    Configuration: ColumnsContainerConfiguration,
    Editor: ColumnsContainerEditor,
    Toolbar: ColumnsContainerToolbar,
    defaultValue: ColumnsContainerPropsDefaults,
    category: "builder.emailBuilder.blocks.categories.containers",
    capabilities: ["columns", "layout", "block", "container"],
    tags: ["columns", "container"],
  },
  ConditionalContainer: {
    displayName: "builder.emailBuilder.blocks.conditionalContainer.displayName",
    icon: <ShieldQuestion />,
    Configuration: ConditionalContainerConfiguration,
    Editor: ConditionalContainerEditor,
    defaultValue: ConditionalContainerPropsDefaults,
    category: "builder.emailBuilder.blocks.categories.containers",
    capabilities: ["conditional", "layout", "block"],
    tags: ["conditional"],
  },
  ForeachContainer: {
    displayName: "builder.emailBuilder.blocks.foreachContainer.displayName",
    icon: <Repeat2 />,
    Configuration: ForeachContainerConfiguration,
    Editor: ForeachContainerEditor,
    defaultValue: ForeachContainerPropsDefaults,
    category: "builder.emailBuilder.blocks.categories.containers",
    capabilities: ["foreach", "layout", "block"],
    tags: ["foreach"],
  },
  CustomHTML: {
    displayName: "builder.emailBuilder.blocks.customHtml.displayName",
    icon: <Code />,
    Editor: CustomHTMLEditor,
    Configuration: CustomHTMLConfiguration,
    Toolbar: CustomHTMLToolbar,
    defaultValue: CustomHTMLPropsDefaults,
    category: "builder.emailBuilder.blocks.categories.layout",
    capabilities: ["html", "block"],
    tags: ["html"],
  },
  OnlineMeeting: {
    displayName: "builder.emailBuilder.blocks.onlineMeeting.displayName",
    icon: <Video />,
    Editor: OnlineMeetingEditor,
    Configuration: OnlineMeetingConfiguration,
    defaultValue: OnlineMeetingPropsDefaults,
    category: "builder.emailBuilder.blocks.categories.onlineMeeting",
    capabilities: ["online-meeting", "block"],
    tags: ["online-meeting"],
  },
};

export const RootBlock: TEditorBlock<Partial<EmailLayoutProps>> = {
  data: EmailLayoutDefaultProps,
  id: generateId(),
  type: "EmailLayout",
};
