import { ReaderDocumentBlocksDictionary } from "@hacado/builder";
import { AccordionItem } from "./accordion-item/reader";
import { Accordion } from "./accordion/reader";
import { BeforeAfterReader } from "./before-after/reader";
import { BookingConfirmationReader as BookingConfirmationModernReader } from "./booking-confirmation/modern/reader";
import { BookingConfirmationReader as BookingConfirmationSimpleReader } from "./booking-confirmation/simple/reader";
import { BookingReader as BookingModernReader } from "./booking/modern/reader";
import { BookingReader as BookingSimpleReader } from "./booking/simple/reader";
import { ButtonReader } from "./button/reader";
import { CarouselReader } from "./carousel/reader";
import { ConditionalContainerReader } from "./conditional-container/reader";
import { ContainerReader } from "./container/reader";
import { CustomHTML } from "./custom-html/reader";
import { FluidLayoutReader } from "./fluid-layout/reader";
import { ForeachContainerReader } from "./foreach-container/reader";
import { GridContainerReader } from "./grid-container/reader";
import { Heading } from "./heading/reader";
import { Icon } from "./icon/reader";
import { Image } from "./image/reader";
import { InlineContainerReader } from "./inline-container/reader";
import { InlineText } from "./inline-text/reader";
import { LightboxReader } from "./lightbox/reader";
import { Link } from "./link/reader";
import { MarketingBrowserCarouselReader } from "./marketing-browser-carousel/reader";
import { MarketingFeatureItemReader } from "./marketing-feature-item/reader";
import { MarketingFeaturesShowcaseReader } from "./marketing-features-showcase/reader";
import { MarketingScrollingLogosReader } from "./marketing-scrolling-logos/reader";
import { ModifyAppointmentFormReader as ModifyAppointmentFormModernReader } from "./modify-appointment-form/modern/reader";
import { ModifyAppointmentFormReader as ModifyAppointmentFormSimpleReader } from "./modify-appointment-form/simple/reader";
import { PageHeroReader } from "./page-hero/reader";
import { PageLayoutReader } from "./page-layout/reader";
import { PopupReader } from "./popup/reader";
import { RedirectReader } from "./redirect/reader";
import { EditorBlocksSchema } from "./schema";
import { SpacerReader } from "./spacer/reader";
import { TableReader } from "./table/reader";
import { TextReader } from "./text/reader";
import { TypewriterTextReader } from "./typewriter-text/reader";
import { Video } from "./video";
import { YouTubeVideoReader } from "./youtube-video/reader";

export const ReaderBlocks: ReaderDocumentBlocksDictionary<
  typeof EditorBlocksSchema
> = {
  Image: {
    Reader: Image,
  },
  Button: {
    Reader: ButtonReader,
  },
  Link: {
    Reader: Link,
  },
  Text: {
    Reader: TextReader,
  },
  Icon: {
    Reader: Icon,
  },
  Spacer: {
    Reader: SpacerReader,
  },
  PageLayout: {
    Reader: PageLayoutReader,
  },
  Heading: {
    Reader: Heading,
  },
  Container: {
    Reader: ContainerReader,
  },
  ConditionalContainer: {
    Reader: ConditionalContainerReader,
  },
  ForeachContainer: {
    Reader: ForeachContainerReader,
  },
  GridContainer: {
    Reader: GridContainerReader,
  },
  FluidLayout: {
    Reader: FluidLayoutReader,
  },
  PageHero: {
    Reader: PageHeroReader,
  },
  BookingSimple: {
    Reader: BookingSimpleReader,
  },
  BookingModern: {
    Reader: BookingModernReader,
  },
  BookingConfirmationSimple: {
    Reader: BookingConfirmationSimpleReader,
  },
  BookingConfirmationModern: {
    Reader: BookingConfirmationModernReader,
  },
  Carousel: {
    Reader: CarouselReader,
  },
  Video: {
    Reader: Video,
  },
  Popup: {
    Reader: PopupReader,
  },
  InlineText: {
    Reader: InlineText,
  },
  TypewriterText: {
    Reader: TypewriterTextReader,
  },
  YouTubeVideo: {
    Reader: YouTubeVideoReader,
  },
  Accordion: {
    Reader: Accordion,
  },
  AccordionItem: {
    Reader: AccordionItem,
  },
  InlineContainer: {
    Reader: InlineContainerReader,
  },
  CustomHTML: {
    Reader: CustomHTML,
  },
  BeforeAfter: {
    Reader: BeforeAfterReader,
  },
  Lightbox: {
    Reader: LightboxReader,
  },
  Redirect: {
    Reader: RedirectReader,
  },
  ModifyAppointmentFormSimple: {
    Reader: ModifyAppointmentFormSimpleReader,
  },
  ModifyAppointmentFormModern: {
    Reader: ModifyAppointmentFormModernReader,
  },
  MarketingScrollingLogos: {
    Reader: MarketingScrollingLogosReader,
  },
  MarketingFeatureItem: {
    Reader: MarketingFeatureItemReader,
  },
  MarketingFeaturesShowcase: {
    Reader: MarketingFeaturesShowcaseReader,
  },
  Table: {
    Reader: TableReader,
  },
  MarketingBrowserCarousel: {
    Reader: MarketingBrowserCarouselReader,
  },
};
