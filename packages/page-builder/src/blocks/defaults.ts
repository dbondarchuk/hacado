/**
 * Server-safe block defaults barrel for editors and Builder AI.
 * Import only from this map (or per-block defaults.ts) — never from schema for defaults.
 */
import { AccordionPropsDefaults } from "./accordion/defaults";
import { AccordionItemPropsDefaults } from "./accordion-item/defaults";
import { ButtonPropsDefaults } from "./button/defaults";
import { CatalogValuePropsDefaults } from "./catalog-value/defaults";
import { ConditionalContainerPropsDefaults } from "./conditional-container/defaults";
import { ContainerPropsDefaults } from "./container/defaults";
import { CustomHTMLPropsDefaults } from "./custom-html/defaults";
import { FluidLayoutPropsDefaults } from "./fluid-layout/defaults";
import { ForeachContainerPropsDefaults } from "./foreach-container/defaults";
import { GridContainerPropsDefaults } from "./grid-container/defaults";
import { HeadingPropsDefaults } from "./heading/defaults";
import { IconPropsDefaults } from "./icon/defaults";
import { ImagePropsDefaults } from "./image/defaults";
import { InlineContainerPropsDefaults } from "./inline-container/defaults";
import { InlineTextPropsDefaults } from "./inline-text/defaults";
import { LightboxPropsDefaults } from "./lightbox/defaults";
import { PageLayoutDefaultProps } from "./page-layout/defaults";
import { PhraseCyclePropsDefaults } from "./phrase-cycle/defaults";
import { SpacerPropsDefaults } from "./spacer/defaults";
import { TextPropsDefaults } from "./text/defaults";
import { TypewriterTextPropsDefaults } from "./typewriter-text/defaults";
import { VideoPropsDefaults } from "./video/defaults";
import { YouTubeVideoPropsDefaults } from "./youtube-video/defaults";

export const EditorBlockDefaults: Record<string, unknown> = {
  Accordion: AccordionPropsDefaults,
  AccordionItem: AccordionItemPropsDefaults,
  Button: ButtonPropsDefaults,
  CatalogValue: CatalogValuePropsDefaults,
  ConditionalContainer: ConditionalContainerPropsDefaults,
  Container: ContainerPropsDefaults,
  CustomHTML: CustomHTMLPropsDefaults,
  FluidLayout: FluidLayoutPropsDefaults,
  ForeachContainer: ForeachContainerPropsDefaults,
  GridContainer: GridContainerPropsDefaults,
  Heading: HeadingPropsDefaults,
  Icon: IconPropsDefaults,
  Image: ImagePropsDefaults,
  InlineContainer: InlineContainerPropsDefaults,
  InlineText: InlineTextPropsDefaults,
  Lightbox: LightboxPropsDefaults,
  PageLayout: PageLayoutDefaultProps,
  PhraseCycle: PhraseCyclePropsDefaults,
  Spacer: SpacerPropsDefaults,
  Text: TextPropsDefaults,
  TypewriterText: TypewriterTextPropsDefaults,
  Video: VideoPropsDefaults,
  YouTubeVideo: YouTubeVideoPropsDefaults,
};

export {
  AccordionPropsDefaults,
  AccordionItemPropsDefaults,
  ButtonPropsDefaults,
  CatalogValuePropsDefaults,
  ConditionalContainerPropsDefaults,
  ContainerPropsDefaults,
  CustomHTMLPropsDefaults,
  FluidLayoutPropsDefaults,
  ForeachContainerPropsDefaults,
  GridContainerPropsDefaults,
  HeadingPropsDefaults,
  IconPropsDefaults,
  ImagePropsDefaults,
  InlineContainerPropsDefaults,
  InlineTextPropsDefaults,
  LightboxPropsDefaults,
  PageLayoutDefaultProps,
  PhraseCyclePropsDefaults,
  SpacerPropsDefaults,
  TextPropsDefaults,
  TypewriterTextPropsDefaults,
  VideoPropsDefaults,
  YouTubeVideoPropsDefaults,
};
