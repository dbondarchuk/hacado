import { ReaderDocumentBlocksDictionary } from "@hacado/builder";
import { AvatarReader } from "./avatar";
import { Button } from "./button";
import { ColumnsContainerReader } from "./columns-container";
import { ConditionalContainerReader } from "./conditional-container";
import { ContainerReader } from "./container";
import { CustomHTML } from "./custom-html";
import { DividerReader } from "./divider";
import { EmailLayoutReader } from "./email-layout";
import { ForeachContainerReader } from "./foreach-container";
import { Heading } from "./heading";
import { ImageReader } from "./image";
import { OnlineMeetingReader } from "./online-meeting/reader";
import { EditorBlocksSchema } from "./schema";
import { SpacerReader } from "./spacer";
import { TextReader } from "./text";

export const ReaderBlocks: ReaderDocumentBlocksDictionary<
  typeof EditorBlocksSchema
> = {
  Avatar: {
    Reader: AvatarReader,
  },
  Image: {
    Reader: ImageReader,
  },
  Button: {
    Reader: Button,
  },
  Text: {
    Reader: TextReader,
  },
  Divider: {
    Reader: DividerReader,
  },
  Spacer: {
    Reader: SpacerReader,
  },
  EmailLayout: {
    Reader: EmailLayoutReader,
  },
  Heading: {
    Reader: Heading,
  },
  Container: {
    Reader: ContainerReader,
  },
  Columns: {
    Reader: ColumnsContainerReader,
  },
  ConditionalContainer: {
    Reader: ConditionalContainerReader,
  },
  ForeachContainer: {
    Reader: ForeachContainerReader,
  },
  CustomHTML: {
    Reader: CustomHTML,
  },
  OnlineMeeting: {
    Reader: OnlineMeetingReader,
  },
};
