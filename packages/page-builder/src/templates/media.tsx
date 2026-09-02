import { generateId, TemplatesConfiguration } from "@hacado/builder";
import type { BaseAllKeys } from "@hacado/i18n";
import {
  GalleryHorizontal,
  GalleryHorizontalEnd,
  MonitorPlay,
  Presentation,
} from "lucide-react";
import { CarouselPropsDefaults } from "../blocks/carousel/schema";
import { GridContainerPropsDefaults } from "../blocks/grid-container/schema";
import { ImagePropsDefaults } from "../blocks/image/schema";
import { LightboxPropsDefaults } from "../blocks/lightbox/schema";
import { YouTubeVideoPropsDefaults } from "../blocks/youtube-video/schema";
import { sectionTemplatePreviewPath } from "./preview-manifest";
import {
  buildBrowserCarousel,
  buildSectionIntro,
  compositeContainer,
  sectionShell,
} from "./section-helpers";
import { SALON_IMAGES } from "./template-media";

const category =
  "builder.pageBuilder.blocks.categories.media" satisfies BaseAllKeys;

const prefix = "builder.pageBuilder.sectionDefaults.media";

const GALLERY_IMAGES = [
  SALON_IMAGES.interior,
  SALON_IMAGES.styling,
  SALON_IMAGES.nails,
  SALON_IMAGES.treatment,
  SALON_IMAGES.spa,
  SALON_IMAGES.chair,
  SALON_IMAGES.interior,
  SALON_IMAGES.styling,
];

function galleryImage(src: string, alt: string) {
  return {
    type: "Image" as const,
    id: generateId(),
    data: {
      ...ImagePropsDefaults,
      props: { src, alt, linkHref: null },
      style: {
        ...ImagePropsDefaults.style,
        width: [{ value: { value: 100, unit: "%" } }],
        height: [{ value: { value: 12, unit: "rem" } }],
        objectFit: [{ value: "cover" }],
        borderRadius: [{ value: { value: 8, unit: "px" } }],
      },
    },
  };
}

export const mediaEditorTemplates: TemplatesConfiguration = {
  BrowserCarouselSection: {
    displayName:
      "builder.pageBuilder.templates.media.browserCarouselSection" satisfies BaseAllKeys,
    icon: <Presentation />,
    category,
    previewImage: sectionTemplatePreviewPath("browser-carousel-section.png"),
    getBlock: (t) =>
      compositeContainer([
        buildSectionIntro(t, {
          eyebrow: `${prefix}.browserCarouselSection.eyebrow` as BaseAllKeys,
          title: `${prefix}.browserCarouselSection.title` as BaseAllKeys,
          body: `${prefix}.browserCarouselSection.body` as BaseAllKeys,
        }),
        buildBrowserCarousel(t, [
          {
            src: SALON_IMAGES.interior,
            label: t(
              `${prefix}.browserCarouselSection.slide1Label` as BaseAllKeys,
            ),
            addressBar: t(
              `${prefix}.browserCarouselSection.slide1Address` as BaseAllKeys,
            ),
          },
          {
            src: SALON_IMAGES.dashboard,
            label: t(
              `${prefix}.browserCarouselSection.slide2Label` as BaseAllKeys,
            ),
            addressBar: t(
              `${prefix}.browserCarouselSection.slide2Address` as BaseAllKeys,
            ),
          },
          {
            src: SALON_IMAGES.workspace,
            label: t(
              `${prefix}.browserCarouselSection.slide3Label` as BaseAllKeys,
            ),
            addressBar: t(
              `${prefix}.browserCarouselSection.slide3Address` as BaseAllKeys,
            ),
          },
        ]),
      ]),
  },

  VideoEmbedSection: {
    displayName:
      "builder.pageBuilder.templates.media.videoEmbedSection" satisfies BaseAllKeys,
    icon: <MonitorPlay />,
    category,
    previewImage: sectionTemplatePreviewPath("video-embed-section.png"),
    getBlock: (t) =>
      sectionShell([
        buildSectionIntro(t, {
          title: `${prefix}.videoEmbedSection.title` as BaseAllKeys,
          body: `${prefix}.videoEmbedSection.body` as BaseAllKeys,
        }),
        {
          type: "YouTubeVideo",
          id: generateId(),
          data: {
            ...YouTubeVideoPropsDefaults,
            props: {
              ...YouTubeVideoPropsDefaults.props,
              youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            },
          },
        },
      ]),
  },

  GalleryGrid: {
    displayName:
      "builder.pageBuilder.templates.media.galleryGrid" satisfies BaseAllKeys,
    icon: <GalleryHorizontal />,
    category,
    previewImage: sectionTemplatePreviewPath("gallery-grid.png"),
    getBlock: (t) => {
      const images = GALLERY_IMAGES.map((src) =>
        galleryImage(src, t(`${prefix}.galleryGrid.imageAlt` as BaseAllKeys)),
      );
      return sectionShell([
        buildSectionIntro(t, {
          title: `${prefix}.galleryGrid.title` as BaseAllKeys,
          body: `${prefix}.galleryGrid.body` as BaseAllKeys,
        }),
        {
          type: "Lightbox",
          id: generateId(),
          data: {
            ...LightboxPropsDefaults,
            props: {
              ...LightboxPropsDefaults.props,
              children: [
                {
                  type: "GridContainer",
                  id: generateId(),
                  data: {
                    ...GridContainerPropsDefaults,
                    props: { children: images },
                  },
                },
              ],
            },
          },
        },
      ]);
    },
  },

  GalleryCarousel: {
    displayName:
      "builder.pageBuilder.templates.media.galleryCarousel" satisfies BaseAllKeys,
    icon: <GalleryHorizontalEnd />,
    category,
    previewImage: sectionTemplatePreviewPath("gallery-carousel.png"),
    getBlock: (t) => {
      const images = GALLERY_IMAGES.map((src) =>
        galleryImage(src, t(`${prefix}.galleryGrid.imageAlt` as BaseAllKeys)),
      );
      const carouselDefaults = CarouselPropsDefaults();
      return sectionShell([
        buildSectionIntro(t, {
          title: `${prefix}.galleryGrid.title` as BaseAllKeys,
          body: `${prefix}.galleryGrid.body` as BaseAllKeys,
        }),
        {
          type: "Lightbox",
          id: generateId(),
          data: {
            ...LightboxPropsDefaults,
            props: {
              ...LightboxPropsDefaults.props,
              children: [
                {
                  type: "Carousel",
                  id: generateId(),
                  data: {
                    ...carouselDefaults,
                    props: {
                      ...carouselDefaults.props,
                      autoPlay: 5,
                      loop: true,
                      children: images,
                    },
                  },
                },
              ],
            },
          },
        },
      ]);
    },
  },
};
