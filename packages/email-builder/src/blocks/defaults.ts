/**
 * Server-safe email block defaults barrel for editors and Builder AI.
 */
import { AvatarPropsDefaults } from "./avatar/defaults";
import { ButtonPropsDefaults } from "./button/defaults";
import { ColumnsContainerPropsDefaults } from "./columns-container/defaults";
import { ConditionalContainerPropsDefaults } from "./conditional-container/defaults";
import { ContainerPropsDefaults } from "./container/defaults";
import { CustomHTMLPropsDefaults } from "./custom-html/defaults";
import { DividerPropsDefaults } from "./divider/defaults";
import { EmailLayoutDefaultProps } from "./email-layout/defaults";
import { ForeachContainerPropsDefaults } from "./foreach-container/defaults";
import { HeadingPropsDefaults } from "./heading/defaults";
import { ImagePropsDefaults } from "./image/defaults";
import { OnlineMeetingPropsDefaults } from "./online-meeting/defaults";
import { SpacerPropsDefaults } from "./spacer/defaults";
import { TextPropsDefaults } from "./text/defaults";

export const EditorBlockDefaults: Record<string, unknown> = {
  Avatar: AvatarPropsDefaults,
  Image: ImagePropsDefaults,
  Button: ButtonPropsDefaults,
  Heading: HeadingPropsDefaults,
  Text: TextPropsDefaults,
  Divider: DividerPropsDefaults,
  Spacer: SpacerPropsDefaults,
  EmailLayout: EmailLayoutDefaultProps,
  Container: ContainerPropsDefaults,
  Columns: ColumnsContainerPropsDefaults,
  ConditionalContainer: ConditionalContainerPropsDefaults,
  ForeachContainer: ForeachContainerPropsDefaults,
  CustomHTML: CustomHTMLPropsDefaults,
  OnlineMeeting: OnlineMeetingPropsDefaults,
};

export {
  AvatarPropsDefaults,
  ButtonPropsDefaults,
  ColumnsContainerPropsDefaults,
  ConditionalContainerPropsDefaults,
  ContainerPropsDefaults,
  CustomHTMLPropsDefaults,
  DividerPropsDefaults,
  EmailLayoutDefaultProps,
  ForeachContainerPropsDefaults,
  HeadingPropsDefaults,
  ImagePropsDefaults,
  OnlineMeetingPropsDefaults,
  SpacerPropsDefaults,
  TextPropsDefaults,
};
