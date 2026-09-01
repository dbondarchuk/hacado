import { AccordionItemPropsSchema } from "./accordion-item/schema";
import { AccordionPropsSchema } from "./accordion/schema";
import { BeforeAfterPropsSchema } from "./before-after/schema";
import { BookingConfirmationPropsSchema as BookingConfirmationModernPropsSchema } from "./booking-confirmation/modern/schema";
import { BookingConfirmationPropsSchema as BookingConfirmationSimplePropsSchema } from "./booking-confirmation/simple/schema";
import { BookingPropsSchema as BookingModernPropsSchema } from "./booking/modern/schema";
import { BookingPropsSchema as BookingSimplePropsSchema } from "./booking/simple/schema";
import { ButtonPropsSchema } from "./button/schema";
import { CarouselPropsSchema } from "./carousel/schema";
import { ConditionalContainerPropsSchema } from "./conditional-container/schema";
import { ContainerPropsSchema } from "./container/schema";
import { CustomHTMLPropsSchema } from "./custom-html/schema";
import { FluidLayoutPropsSchema } from "./fluid-layout/schema";
import { ForeachContainerPropsSchema } from "./foreach-container/schema";
import { GridContainerPropsSchema } from "./grid-container/schema";
import { HeadingPropsSchema } from "./heading/schema";
import { IconPropsSchema } from "./icon/schema";
import { ImagePropsSchema } from "./image/schema";
import { InlineContainerPropsSchema } from "./inline-container/schema";
import { InlineTextPropsSchema } from "./inline-text/schema";
import { LightboxPropsSchema } from "./lightbox/schema";
import { LinkPropsSchema } from "./link/schema";
import { MarketingBrowserCarouselPropsSchema } from "./marketing-browser-carousel/schema";
import { MarketingFeatureItemPropsSchema } from "./marketing-feature-item/schema";
import { MarketingFeaturesShowcasePropsSchema } from "./marketing-features-showcase/schema";
import { MarketingScrollingLogosPropsSchema } from "./marketing-scrolling-logos/schema";
import { ModifyAppointmentFormPropsSchema as ModifyAppointmentFormModernPropsSchema } from "./modify-appointment-form/modern/schema";
import { ModifyAppointmentFormPropsSchema as ModifyAppointmentFormSimplePropsSchema } from "./modify-appointment-form/simple/schema";
import { PageHeroPropsSchema } from "./page-hero/schema";
import { PageLayoutPropsSchema } from "./page-layout/schema";
import { PopupPropsSchema } from "./popup/schema";
import { RedirectPropsSchema } from "./redirect/schema";
import { SpacerPropsSchema } from "./spacer/schema";
import { TablePropsSchema } from "./table/schema";
import { TextPropsSchema } from "./text/schema";
import { TypewriterTextPropsSchema } from "./typewriter-text/schema";
import { VideoPropsSchema } from "./video/schema";
import { YouTubeVideoPropsSchema } from "./youtube-video/schema";

export const EditorBlocksSchema = {
  Image: ImagePropsSchema,
  Button: ButtonPropsSchema,
  Link: LinkPropsSchema,
  Heading: HeadingPropsSchema,
  Text: TextPropsSchema,
  Spacer: SpacerPropsSchema,
  PageLayout: PageLayoutPropsSchema,
  Container: ContainerPropsSchema,
  GridContainer: GridContainerPropsSchema,
  FluidLayout: FluidLayoutPropsSchema,
  PageHero: PageHeroPropsSchema,
  // // Columns: ColumnsContainerPropsSchema,
  ConditionalContainer: ConditionalContainerPropsSchema,
  ForeachContainer: ForeachContainerPropsSchema,
  BookingSimple: BookingSimplePropsSchema,
  BookingModern: BookingModernPropsSchema,
  Carousel: CarouselPropsSchema,
  Video: VideoPropsSchema,
  YouTubeVideo: YouTubeVideoPropsSchema,
  Popup: PopupPropsSchema,
  InlineText: InlineTextPropsSchema,
  TypewriterText: TypewriterTextPropsSchema,
  Accordion: AccordionPropsSchema,
  AccordionItem: AccordionItemPropsSchema,
  InlineContainer: InlineContainerPropsSchema,
  Icon: IconPropsSchema,
  CustomHTML: CustomHTMLPropsSchema,
  BeforeAfter: BeforeAfterPropsSchema,
  Lightbox: LightboxPropsSchema,
  Redirect: RedirectPropsSchema,
  ModifyAppointmentFormSimple: ModifyAppointmentFormSimplePropsSchema,
  ModifyAppointmentFormModern: ModifyAppointmentFormModernPropsSchema,
  BookingConfirmationSimple: BookingConfirmationSimplePropsSchema,
  BookingConfirmationModern: BookingConfirmationModernPropsSchema,
  MarketingScrollingLogos: MarketingScrollingLogosPropsSchema,
  MarketingFeatureItem: MarketingFeatureItemPropsSchema,
  MarketingFeaturesShowcase: MarketingFeaturesShowcasePropsSchema,
  Table: TablePropsSchema,
  MarketingBrowserCarousel: MarketingBrowserCarouselPropsSchema,
} as {
  Image: typeof ImagePropsSchema;
  Button: typeof ButtonPropsSchema;
  Link: typeof LinkPropsSchema;
  Heading: typeof HeadingPropsSchema;
  Text: typeof TextPropsSchema;
  Spacer: typeof SpacerPropsSchema;
  PageLayout: typeof PageLayoutPropsSchema;
  Container: typeof ContainerPropsSchema;
  GridContainer: typeof GridContainerPropsSchema;
  FluidLayout: typeof FluidLayoutPropsSchema;
  PageHero: typeof PageHeroPropsSchema;
  ConditionalContainer: typeof ConditionalContainerPropsSchema;
  ForeachContainer: typeof ForeachContainerPropsSchema;
  BookingSimple: typeof BookingSimplePropsSchema;
  BookingModern: typeof BookingModernPropsSchema;
  Carousel: typeof CarouselPropsSchema;
  Video: typeof VideoPropsSchema;
  YouTubeVideo: typeof YouTubeVideoPropsSchema;
  Popup: typeof PopupPropsSchema;
  InlineText: typeof InlineTextPropsSchema;
  TypewriterText: typeof TypewriterTextPropsSchema;
  Accordion: typeof AccordionPropsSchema;
  AccordionItem: typeof AccordionItemPropsSchema;
  InlineContainer: typeof InlineContainerPropsSchema;
  Icon: typeof IconPropsSchema;
  CustomHTML: typeof CustomHTMLPropsSchema;
  BeforeAfter: typeof BeforeAfterPropsSchema;
  Lightbox: typeof LightboxPropsSchema;
  Redirect: typeof RedirectPropsSchema;
  ModifyAppointmentFormSimple: typeof ModifyAppointmentFormSimplePropsSchema;
  ModifyAppointmentFormModern: typeof ModifyAppointmentFormModernPropsSchema;
  BookingConfirmationSimple: typeof BookingConfirmationSimplePropsSchema;
  BookingConfirmationModern: typeof BookingConfirmationModernPropsSchema;
  MarketingScrollingLogos: typeof MarketingScrollingLogosPropsSchema;
  MarketingFeatureItem: typeof MarketingFeatureItemPropsSchema;
  MarketingFeaturesShowcase: typeof MarketingFeaturesShowcasePropsSchema;
  Table: typeof TablePropsSchema;
  MarketingBrowserCarousel: typeof MarketingBrowserCarouselPropsSchema;
};
