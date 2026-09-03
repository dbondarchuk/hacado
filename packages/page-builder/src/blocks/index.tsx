"use client";
import {
  EditorDocumentBlocksDictionary,
  generateId,
  TEditorBlock,
} from "@hacado/builder";
import {
  AppWindow,
  ArrowBigRightDash,
  Calendar,
  CalendarCheck,
  CalendarSync,
  ChevronDown,
  Code,
  Columns3,
  Copy,
  CopyPlus,
  Film,
  GalleryHorizontal,
  GalleryHorizontalEnd,
  GalleryThumbnails,
  Heading,
  Image,
  Images,
  Layers,
  Layout,
  LayoutGrid,
  LetterText,
  Link,
  RectangleHorizontal,
  Repeat2,
  ShieldQuestion,
  SquareMousePointer,
  SquareSquare,
  Star,
  Table as TableIcon,
  Text,
  Type,
  Zap,
} from "lucide-react";
import {
  AccordionConfiguration,
  AccordionEditor,
  AccordionPropsDefaults,
  AccordionToolbar,
} from "./accordion";
import {
  AccordionItemConfiguration,
  AccordionItemEditor,
  AccordionItemPropsDefaults,
  AccordionItemToolbar,
} from "./accordion-item";
import {
  BeforeAfterConfiguration,
  BeforeAfterEditor,
  BeforeAfterPropsDefaults,
  BeforeAfterToolbar,
} from "./before-after";
import {
  ButtonConfiguration,
  ButtonEditor,
  ButtonPropsDefaults,
  ButtonToolbar,
} from "./button";
import {
  LinkConfiguration,
  LinkEditor,
  LinkPropsDefaults,
  LinkToolbar,
} from "./link";

import { BaseAllKeys } from "@hacado/i18n";
import {
  BookingConfirmationConfiguration as BookingConfirmationModernConfiguration,
  BookingConfirmationEditor as BookingConfirmationModernEditor,
  BookingConfirmationPropsDefaults as BookingConfirmationModernPropsDefaults,
} from "./booking-confirmation/modern";
import {
  BookingConfirmationConfiguration as BookingConfirmationSimpleConfiguration,
  BookingConfirmationEditor as BookingConfirmationSimpleEditor,
  BookingConfirmationPropsDefaults as BookingConfirmationSimplePropsDefaults,
} from "./booking-confirmation/simple";
import {
  BookingConfiguration as BookingModernConfiguration,
  BookingEditor as BookingModernEditor,
  BookingPropsDefaults as BookingModernPropsDefaults,
  BookingToolbar as BookingModernToolbar,
} from "./booking/modern";
import {
  BookingConfiguration as BookingSimpleConfiguration,
  BookingEditor as BookingSimpleEditor,
  BookingPropsDefaults as BookingSimplePropsDefaults,
  BookingToolbar as BookingSimpleToolbar,
} from "./booking/simple";
import {
  CarouselConfiguration,
  CarouselEditor,
  CarouselPropsDefaults,
  CarouselToolbar,
} from "./carousel";
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
  CustomHTMLToolbar,
} from "./custom-html";
import { CustomHTMLPropsDefaults } from "./custom-html/schema";
import {
  FluidLayoutConfiguration,
  FluidLayoutEditor,
  FluidLayoutPropsDefaults,
  FluidLayoutToolbar,
} from "./fluid-layout";
import {
  ForeachContainerConfiguration,
  ForeachContainerEditor,
  ForeachContainerPropsDefaults,
  ForeachContainerToolbar,
} from "./foreach-container";
import {
  GridContainerConfiguration,
  GridContainerEditor,
  GridContainerPropsDefaults,
  GridContainerToolbar,
} from "./grid-container";
import {
  HeadingConfiguration,
  HeadingEditor,
  HeadingPropsDefaults,
  HeadingToolbar,
} from "./heading";
import {
  IconConfiguration,
  IconEditor,
  IconPropsDefaults,
  IconToolbar,
} from "./icon";
import {
  ImageConfiguration,
  ImageEditor,
  ImagePropsDefaults,
  ImageToolbar,
} from "./image";
import {
  InlineContainerConfiguration,
  InlineContainerEditor,
  InlineContainerPropsDefaults,
  InlineContainerToolbar,
} from "./inline-container";
import {
  InlineTextConfiguration,
  InlineTextEditor,
  InlineTextPropsDefaults,
  InlineTextToolbar,
} from "./inline-text";
import {
  LightboxConfiguration,
  LightboxEditor,
  LightboxPropsDefaults,
} from "./lightbox";
import {
  MarketingBrowserCarouselConfiguration,
  MarketingBrowserCarouselEditor,
  MarketingBrowserCarouselPropsDefaults,
  MarketingBrowserCarouselToolbar,
} from "./marketing-browser-carousel";
import {
  MarketingFeatureItemConfiguration,
  MarketingFeatureItemEditor,
  MarketingFeatureItemPropsDefaults,
  MarketingFeatureItemToolbar,
} from "./marketing-feature-item";
import {
  MarketingFeaturesShowcaseConfiguration,
  MarketingFeaturesShowcaseEditor,
  MarketingFeaturesShowcasePropsDefaults,
  MarketingFeaturesShowcaseToolbar,
} from "./marketing-features-showcase";
import {
  MarketingScrollingLogosConfiguration,
  MarketingScrollingLogosEditor,
  MarketingScrollingLogosPropsDefaults,
  MarketingScrollingLogosToolbar,
} from "./marketing-scrolling-logos";
import {
  ModifyAppointmentFormConfiguration as ModifyAppointmentFormModernConfiguration,
  ModifyAppointmentFormEditor as ModifyAppointmentFormModernEditor,
  ModifyAppointmentFormPropsDefaults as ModifyAppointmentFormModernPropsDefaults,
} from "./modify-appointment-form/modern";
import {
  ModifyAppointmentFormConfiguration as ModifyAppointmentFormSimpleConfiguration,
  ModifyAppointmentFormEditor as ModifyAppointmentFormSimpleEditor,
  ModifyAppointmentFormPropsDefaults as ModifyAppointmentFormSimplePropsDefaults,
} from "./modify-appointment-form/simple";
import {
  PageHeroConfiguration,
  PageHeroEditor,
  PageHeroPropsDefaults,
  PageHeroToolbar,
} from "./page-hero";
import {
  PageLayoutConfiguration,
  PageLayoutDefaultProps,
  PageLayoutEditor,
  PageLayoutProps,
  PageLayoutToolbar,
} from "./page-layout";
import {
  PopupConfiguration,
  PopupEditor,
  PopupPropsDefaults,
  PopupToolbar,
} from "./popup";
import {
  RedirectConfiguration,
  RedirectEditor,
  RedirectPropsDefaults,
} from "./redirect";
import { EditorBlocksSchema } from "./schema";
import {
  SpacerConfiguration,
  SpacerPropsDefaults,
  SpacerToolbar,
} from "./spacer";
import { SpacerEditor } from "./spacer/editor";
import {
  TableConfiguration,
  TableEditor,
  TablePropsDefaults,
  TableToolbar,
} from "./table";
import {
  TextConfiguration,
  TextEditor,
  TextPropsDefaults,
  TextToolbar,
} from "./text";
import {
  TypewriterTextConfiguration,
  TypewriterTextEditor,
  TypewriterTextPropsDefaults,
  TypewriterTextToolbar,
} from "./typewriter-text";
import {
  VideoConfiguration,
  VideoEditor,
  VideoPropsDefaults,
  VideoToolbar,
} from "./video";
import {
  YouTubeVideoConfiguration,
  YouTubeVideoEditor,
  YouTubeVideoPropsDefaults,
  YouTubeVideoToolbar,
} from "./youtube-video";

export const EditorBlocks: EditorDocumentBlocksDictionary<
  typeof EditorBlocksSchema
> = {
  Image: {
    displayName:
      "builder.pageBuilder.blocks.image.displayName" satisfies BaseAllKeys,
    icon: <Image />,
    Editor: ImageEditor,
    Configuration: ImageConfiguration,
    Toolbar: ImageToolbar,
    defaultValue: ImagePropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.objects" satisfies BaseAllKeys,
    capabilities: ["image", "media", "block"],
    tags: ["image", "media"],
  },
  Button: {
    displayName:
      "builder.pageBuilder.blocks.button.displayName" satisfies BaseAllKeys,
    icon: <SquareMousePointer />,
    Editor: ButtonEditor,
    Configuration: ButtonConfiguration,
    Toolbar: ButtonToolbar,
    defaultValue: ButtonPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.buttons" satisfies BaseAllKeys,
    capabilities: ["button", "action", "link", "block"],
    tags: ["button", "action", "link"],
  },
  Link: {
    displayName:
      "builder.pageBuilder.blocks.link.displayName" satisfies BaseAllKeys,
    icon: <Link />,
    Editor: LinkEditor,
    Configuration: LinkConfiguration,
    Toolbar: LinkToolbar,
    defaultValue: LinkPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.buttons" satisfies BaseAllKeys,
    capabilities: ["link", "inline", "action"],
    tags: ["link"],
  },
  Heading: {
    displayName:
      "builder.pageBuilder.blocks.heading.displayName" satisfies BaseAllKeys,
    icon: <Heading />,
    Configuration: HeadingConfiguration,
    Editor: HeadingEditor,
    Toolbar: HeadingToolbar,
    defaultValue: HeadingPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.text" satisfies BaseAllKeys,
    capabilities: ["heading", "title", "block"],
    tags: ["heading", "title"],
  },
  Text: {
    displayName:
      "builder.pageBuilder.blocks.text.displayName" satisfies BaseAllKeys,
    icon: <LetterText />,
    Editor: TextEditor,
    Configuration: TextConfiguration,
    Toolbar: TextToolbar,
    defaultValue: TextPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.text" satisfies BaseAllKeys,
    disable: {
      keyboardShortcuts: {
        pasteImage: true,
        delete: true,
        moveUp: true,
        moveDown: true,
        undoRedo: true,
      },
    },
    capabilities: ["text", "block"],
    tags: ["text", "block"],
  },
  Icon: {
    displayName:
      "builder.pageBuilder.blocks.icon.displayName" satisfies BaseAllKeys,
    icon: <Star />,
    Editor: IconEditor,
    Configuration: IconConfiguration,
    Toolbar: IconToolbar,
    defaultValue: IconPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.objects" satisfies BaseAllKeys,
    capabilities: ["icon", "inline"],
    tags: ["icon"],
  },
  // Divider: {
  //   displayName: "Divider",
  //   icon: <SquareSplitVertical />,
  //   Editor: Divider,
  //   Configuration: DividerConfiguration,
  //   Toolbar: DividerToolbar,
  //   defaultValue: DividerPropsDefaults,
  //   category: "Dividers",
  // },
  Spacer: {
    displayName:
      "builder.pageBuilder.blocks.spacer.displayName" satisfies BaseAllKeys,
    icon: <RectangleHorizontal />,
    Editor: SpacerEditor,
    Configuration: SpacerConfiguration,
    Toolbar: SpacerToolbar,
    defaultValue: SpacerPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["spacer", "block"],
    tags: ["spacer", "block"],
  },
  PageLayout: {
    displayName:
      "builder.pageBuilder.blocks.pageLayout.displayName" satisfies BaseAllKeys,
    icon: <Layout />,
    Editor: PageLayoutEditor,
    Configuration: PageLayoutConfiguration,
    Toolbar: PageLayoutToolbar,
    defaultValue: PageLayoutDefaultProps,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["layout"],
    tags: ["layout"],
  },
  Container: {
    displayName:
      "builder.pageBuilder.blocks.container.displayName" satisfies BaseAllKeys,
    icon: <CopyPlus />,
    Configuration: ContainerConfiguration,
    Editor: ContainerEditor,
    Toolbar: ContainerToolbar,
    defaultValue: ContainerPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["container", "layout", "block"],
    tags: ["container", "layout"],
  },
  GridContainer: {
    displayName:
      "builder.pageBuilder.blocks.gridContainer.displayName" satisfies BaseAllKeys,
    icon: <Columns3 />,
    Configuration: GridContainerConfiguration,
    Editor: GridContainerEditor,
    Toolbar: GridContainerToolbar,
    defaultValue: GridContainerPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["grid", "layout", "block", "container"],
    tags: ["grid", "container"],
  },
  FluidLayout: {
    displayName:
      "builder.pageBuilder.blocks.fluidLayout.displayName" satisfies BaseAllKeys,
    icon: <Layers />,
    Configuration: FluidLayoutConfiguration,
    Editor: FluidLayoutEditor,
    Toolbar: FluidLayoutToolbar,
    defaultValue: FluidLayoutPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["layout", "block", "fluid"],
    tags: ["fluid", "layout", "grid"],
    allowedIn: {
      type: ["PageLayout"],
    },
  },
  PageHero: {
    displayName:
      "builder.pageBuilder.blocks.pageHero.displayName" satisfies BaseAllKeys,
    icon: <Zap />,
    Configuration: PageHeroConfiguration,
    Editor: PageHeroEditor,
    Toolbar: PageHeroToolbar,
    defaultValue: PageHeroPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["layout", "block"],
    tags: ["page-hero"],
    allowedBuilderTypes: ["page"],
  },
  // Columns: {
  //   displayName: "Columns",
  //   icon: <Columns3 />,
  //   Configuration: ColumnsContainerConfiguration,
  //   Editor: ColumnsContainerEditor,
  //   Toolbar: ColumnsContainerToolbar,
  //   defaultValue: ColumnsContainerPropsDefaults,
  //   category: "Containers",
  // },
  ConditionalContainer: {
    displayName:
      "builder.pageBuilder.blocks.conditionalContainer.displayName" satisfies BaseAllKeys,
    icon: <ShieldQuestion />,
    Configuration: ConditionalContainerConfiguration,
    Editor: ConditionalContainerEditor,
    defaultValue: ConditionalContainerPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["conditional", "layout", "block"],
    tags: ["conditional"],
  },
  ForeachContainer: {
    displayName:
      "builder.pageBuilder.blocks.foreachContainer.displayName" satisfies BaseAllKeys,
    icon: <Repeat2 />,
    Configuration: ForeachContainerConfiguration,
    Editor: ForeachContainerEditor,
    Toolbar: ForeachContainerToolbar,
    defaultValue: ForeachContainerPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["foreach", "layout", "block"],
    tags: ["foreach"],
  },
  BookingSimple: {
    displayName:
      "builder.pageBuilder.blocks.booking.simple.displayName" satisfies BaseAllKeys,
    icon: <Calendar />,
    Configuration: BookingSimpleConfiguration,
    Editor: BookingSimpleEditor,
    Toolbar: BookingSimpleToolbar,
    defaultValue: BookingSimplePropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.booking" satisfies BaseAllKeys,
    capabilities: ["booking", "block"],
    tags: ["booking"],
    allowedBuilderTypes: ["page"],
  },
  BookingModern: {
    displayName:
      "builder.pageBuilder.blocks.booking.modern.displayName" satisfies BaseAllKeys,
    icon: <Calendar className="text-primary" />,
    Configuration: BookingModernConfiguration,
    Editor: BookingModernEditor,
    Toolbar: BookingModernToolbar,
    defaultValue: BookingModernPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.booking" satisfies BaseAllKeys,
    capabilities: ["booking", "block"],
    tags: ["booking"],
    allowedBuilderTypes: ["page"],
  },
  Carousel: {
    displayName:
      "builder.pageBuilder.blocks.carousel.displayName" satisfies BaseAllKeys,
    icon: <GalleryHorizontalEnd />,
    Editor: CarouselEditor,
    Configuration: CarouselConfiguration,
    Toolbar: CarouselToolbar,
    defaultValue: CarouselPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["carousel", "layout", "block", "container"],
    tags: ["carousel"],
  },
  Video: {
    displayName:
      "builder.pageBuilder.blocks.video.displayName" satisfies BaseAllKeys,
    icon: <Film />,
    Editor: VideoEditor,
    Configuration: VideoConfiguration,
    Toolbar: VideoToolbar,
    defaultValue: VideoPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.objects" satisfies BaseAllKeys,
    capabilities: ["video", "media", "block"],
    tags: ["video", "media"],
  },
  YouTubeVideo: {
    displayName:
      "builder.pageBuilder.blocks.youtubeVideo.displayName" satisfies BaseAllKeys,
    icon: <Film />,
    Editor: YouTubeVideoEditor,
    Configuration: YouTubeVideoConfiguration,
    Toolbar: YouTubeVideoToolbar,
    defaultValue: YouTubeVideoPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.objects" satisfies BaseAllKeys,
    capabilities: ["video", "media", "block"],
    tags: ["video", "media"],
  },
  Popup: {
    displayName:
      "builder.pageBuilder.blocks.popup.displayName" satisfies BaseAllKeys,
    icon: <SquareSquare />,
    Editor: PopupEditor,
    Configuration: PopupConfiguration,
    Toolbar: PopupToolbar,
    defaultValue: PopupPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.objects" satisfies BaseAllKeys,
    capabilities: ["popup", "block"],
    tags: ["popup"],
    allowedIn: {
      type: ["PageLayout"],
    },
    allowedBuilderTypes: ["page"],
  },
  InlineText: {
    displayName:
      "builder.pageBuilder.blocks.inlineText.displayName" satisfies BaseAllKeys,
    icon: <Text />,
    Editor: InlineTextEditor,
    Configuration: InlineTextConfiguration,
    Toolbar: InlineTextToolbar,
    defaultValue: InlineTextPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.text" satisfies BaseAllKeys,
    disable: {
      keyboardShortcuts: {
        delete: true,
        moveUp: true,
        moveDown: true,
      },
    },
    capabilities: ["text", "inline"],
    tags: ["text", "inline"],
  },
  TypewriterText: {
    displayName:
      "builder.pageBuilder.blocks.typewriterText.displayName" satisfies BaseAllKeys,
    icon: <Type className="size-4" />,
    Editor: TypewriterTextEditor,
    Configuration: TypewriterTextConfiguration,
    Toolbar: TypewriterTextToolbar,
    defaultValue: TypewriterTextPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.text" satisfies BaseAllKeys,
    disable: {
      keyboardShortcuts: {
        delete: true,
        moveUp: true,
        moveDown: true,
      },
    },
    capabilities: ["text", "inline"],
    tags: ["text", "typewriter", "inline"],
  },
  Accordion: {
    displayName:
      "builder.pageBuilder.blocks.accordion.displayName" satisfies BaseAllKeys,
    icon: <ChevronDown />,
    Editor: AccordionEditor,
    Configuration: AccordionConfiguration,
    Toolbar: AccordionToolbar,
    defaultValue: AccordionPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["accordion", "layout", "block", "container"],
    tags: ["accordion"],
  },
  AccordionItem: {
    displayName:
      "builder.pageBuilder.blocks.accordionItem.displayName" satisfies BaseAllKeys,
    icon: <ChevronDown />,
    Editor: AccordionItemEditor,
    Configuration: AccordionItemConfiguration,
    Toolbar: AccordionItemToolbar,
    defaultValue: AccordionItemPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["accordion-item", "layout", "block", "container"],
    tags: ["accordion-item", "accordion"],
    allowedIn: {
      type: ["Accordion"],
    },
  },
  InlineContainer: {
    displayName:
      "builder.pageBuilder.blocks.inlineContainer.displayName" satisfies BaseAllKeys,
    icon: <Copy />,
    Editor: InlineContainerEditor,
    Configuration: InlineContainerConfiguration,
    Toolbar: InlineContainerToolbar,
    defaultValue: InlineContainerPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["inline", "layout", "block", "container"],
    tags: ["inline-container", "inline", "container"],
  },
  CustomHTML: {
    displayName:
      "builder.pageBuilder.blocks.customHtml.displayName" satisfies BaseAllKeys,
    icon: <Code />,
    Editor: CustomHTMLEditor,
    Configuration: CustomHTMLConfiguration,
    Toolbar: CustomHTMLToolbar,
    defaultValue: CustomHTMLPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["html", "block"],
    tags: ["html"],
  },
  BeforeAfter: {
    displayName:
      "builder.pageBuilder.blocks.beforeAfterSlider.displayName" satisfies BaseAllKeys,
    icon: <Images />,
    Editor: BeforeAfterEditor,
    Configuration: BeforeAfterConfiguration,
    Toolbar: BeforeAfterToolbar,
    defaultValue: BeforeAfterPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.objects" satisfies BaseAllKeys,
    capabilities: ["media", "block"],
    tags: ["before-after", "media"],
  },
  Lightbox: {
    displayName:
      "builder.pageBuilder.blocks.lightbox.displayName" satisfies BaseAllKeys,
    icon: <GalleryThumbnails />,
    Editor: LightboxEditor,
    Configuration: LightboxConfiguration,
    defaultValue: LightboxPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.content" satisfies BaseAllKeys,
    capabilities: ["lightbox", "media", "block"],
    tags: ["lightbox", "media"],
  },
  Redirect: {
    displayName:
      "builder.pageBuilder.blocks.redirect.displayName" satisfies BaseAllKeys,
    icon: <ArrowBigRightDash />,
    Editor: RedirectEditor,
    Configuration: RedirectConfiguration,
    defaultValue: RedirectPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.navigation" satisfies BaseAllKeys,
    capabilities: ["redirect", "invisible"],
    tags: ["redirect"],
    allowedBuilderTypes: ["page"],
  },
  ModifyAppointmentFormSimple: {
    displayName:
      "builder.pageBuilder.blocks.modifyAppointmentForm.simple.displayName" satisfies BaseAllKeys,
    icon: <CalendarSync />,
    Editor: ModifyAppointmentFormSimpleEditor,
    Configuration: ModifyAppointmentFormSimpleConfiguration,
    defaultValue: ModifyAppointmentFormSimplePropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.booking" satisfies BaseAllKeys,
    capabilities: ["booking", "block", "modify-booking"],
    tags: ["booking", "modify-booking"],
    allowedBuilderTypes: ["page"],
  },
  ModifyAppointmentFormModern: {
    displayName:
      "builder.pageBuilder.blocks.modifyAppointmentForm.modern.displayName" satisfies BaseAllKeys,
    icon: <CalendarSync className="text-primary" />,
    Editor: ModifyAppointmentFormModernEditor,
    Configuration: ModifyAppointmentFormModernConfiguration,
    defaultValue: ModifyAppointmentFormModernPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.booking" satisfies BaseAllKeys,
    capabilities: ["booking", "block", "modify-booking"],
    tags: ["booking", "modify-booking"],
    allowedBuilderTypes: ["page"],
  },
  BookingConfirmationSimple: {
    displayName:
      "builder.pageBuilder.blocks.bookingConfirmation.simple.displayName" satisfies BaseAllKeys,
    icon: <CalendarCheck />,
    Editor: BookingConfirmationSimpleEditor,
    Configuration: BookingConfirmationSimpleConfiguration,
    defaultValue: BookingConfirmationSimplePropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.booking" satisfies BaseAllKeys,
    capabilities: ["booking", "block"],
    tags: ["booking", "confirmation"],
    allowedBuilderTypes: ["page"],
  },
  BookingConfirmationModern: {
    displayName:
      "builder.pageBuilder.blocks.bookingConfirmation.modern.displayName" satisfies BaseAllKeys,
    icon: <CalendarCheck className="text-primary" />,
    Editor: BookingConfirmationModernEditor,
    Configuration: BookingConfirmationModernConfiguration,
    defaultValue: BookingConfirmationModernPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.booking" satisfies BaseAllKeys,
    capabilities: ["booking", "block"],
    tags: ["booking", "confirmation"],
    allowedBuilderTypes: ["page"],
  },
  MarketingScrollingLogos: {
    displayName:
      "builder.pageBuilder.blocks.marketingScrollingLogos.displayName" satisfies BaseAllKeys,
    icon: <GalleryHorizontal />,
    Editor: MarketingScrollingLogosEditor,
    Configuration: MarketingScrollingLogosConfiguration,
    Toolbar: MarketingScrollingLogosToolbar,
    defaultValue: MarketingScrollingLogosPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.marketing" satisfies BaseAllKeys,
    capabilities: ["marketing", "layout", "block"],
    tags: ["marketing", "logos"],
  },
  MarketingFeatureItem: {
    displayName:
      "builder.pageBuilder.blocks.marketingFeatureItem.displayName" satisfies BaseAllKeys,
    icon: <Layers />,
    Editor: MarketingFeatureItemEditor,
    Configuration: MarketingFeatureItemConfiguration,
    Toolbar: MarketingFeatureItemToolbar,
    defaultValue: MarketingFeatureItemPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.marketing" satisfies BaseAllKeys,
    capabilities: ["marketing", "block"],
    tags: ["marketing", "feature"],
    allowedIn: {
      type: ["MarketingFeaturesShowcase"],
    },
  },
  MarketingFeaturesShowcase: {
    displayName:
      "builder.pageBuilder.blocks.marketingFeaturesShowcase.displayName" satisfies BaseAllKeys,
    icon: <LayoutGrid />,
    Editor: MarketingFeaturesShowcaseEditor,
    Configuration: MarketingFeaturesShowcaseConfiguration,
    Toolbar: MarketingFeaturesShowcaseToolbar,
    defaultValue: MarketingFeaturesShowcasePropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.marketing" satisfies BaseAllKeys,
    capabilities: ["marketing", "layout", "block"],
    tags: ["marketing", "features"],
  },
  Table: {
    displayName:
      "builder.pageBuilder.blocks.table.displayName" satisfies BaseAllKeys,
    icon: <TableIcon />,
    Editor: TableEditor,
    Configuration: TableConfiguration,
    Toolbar: TableToolbar,
    defaultValue: TablePropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.layout" satisfies BaseAllKeys,
    capabilities: ["layout", "block"],
    tags: ["layout", "table"],
  },
  MarketingBrowserCarousel: {
    displayName:
      "builder.pageBuilder.blocks.marketingBrowserCarousel.displayName" satisfies BaseAllKeys,
    icon: <AppWindow />,
    Editor: MarketingBrowserCarouselEditor,
    Configuration: MarketingBrowserCarouselConfiguration,
    Toolbar: MarketingBrowserCarouselToolbar,
    defaultValue: MarketingBrowserCarouselPropsDefaults,
    category:
      "builder.pageBuilder.blocks.categories.marketing" satisfies BaseAllKeys,
    capabilities: ["marketing", "layout", "block"],
    tags: ["marketing", "carousel", "media"],
  },
};

export const RootBlock: TEditorBlock<Partial<PageLayoutProps>> = {
  data: PageLayoutDefaultProps,
  id: generateId(),
  type: "PageLayout",
};
