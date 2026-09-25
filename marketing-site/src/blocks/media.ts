/** Video and media blocks. */
import { assetUrl, bid, block, C, gap, pad, radius, size, sv } from "./core";
import { container, image, inlineText, text } from "./primitives";
import { section, sectionIntro } from "./layout";

export function video(
  src: string,
  opts: {
    poster?: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    style?: Record<string, unknown>;
  } = {},
) {
  const autoplay = opts.autoplay ?? true;
  return block("Video", {
    props: {
      src: assetUrl(src),
      poster: opts.poster ? assetUrl(opts.poster) : null,
      controls: opts.controls ?? !autoplay,
      autoplay,
      loop: opts.loop ?? true,
      muted: opts.muted ?? autoplay,
      preload: "metadata",
    },
    style: {
      width: size(100, "%"),
      maxWidth: size(100, "%"),
      display: sv("block"),
      borderRadius: radius(16),
      ...opts.style,
    },
  });
}

/** Framed product clip for marketing sections. */
export function productVideo(
  src: string,
  opts: { caption?: string; poster?: string } = {},
) {
  return container(
    [
      container([video(src, { poster: opts.poster })], {
        borderRadius: radius(16),
        borderStyle: sv("solid"),
        borderWidth: size(1, "px"),
        borderColor: sv(C.border),
        backgroundColor: sv(C.card),
        overflow: sv("hidden"),
        width: size(100, "%"),
        maxWidth: size(56, "rem"),
        boxShadow: [
          {
            value: {
              x: 0,
              y: 12,
              blur: 40,
              spread: -12,
              color: C.foreground,
              inset: false,
            },
          },
        ],
      }),
      ...(opts.caption
        ? [
            text(opts.caption, {
              fontSize: size(0.75),
              color: sv(C.mutedFg),
              textAlign: sv("center"),
            }),
          ]
        : []),
    ],
    {
      gap: gap(0.75),
      width: size(100, "%"),
      alignItems: sv("center"),
    },
  );
}

/** Full-width marketing section with one centered product video. */
export function videoSection(opts: {
  src: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  caption?: string;
  poster?: string;
}) {
  return section(
    [
      ...(opts.title
        ? [
            sectionIntro({
              eyebrow: opts.eyebrow,
              title: opts.title,
              body: opts.body,
            }),
          ]
        : []),
      productVideo(opts.src, {
        caption: opts.caption,
        poster: opts.poster,
      }),
    ],
    {
      alignItems: sv("center"),
      gap: gap(2),
    },
  );
}


export function lightbox(images: string[], alt: string) {
  return block("Lightbox", {
    props: {
      overlay: "default",
      showAltAsDescription: true,
      navigation: true,
      loop: true,
      autoPlay: null,
      children: images.map((src) =>
        image(src, alt, { height: size(14), objectFit: sv("cover") }),
      ),
    },
  });
}

export function browserCarousel(
  slides: { id: string; label: string; src: string; address: string }[],
) {
  return block("MarketingBrowserCarousel", {
    style: { width: size(100, "%") },
    props: {
      slides: slides.map((s) => ({
        id: bid(),
        label: s.label,
        src: assetUrl(s.src),
        addressBar: s.address,
      })),
      showTabs: true,
      showDots: true,
      showBrowserChrome: true,
      autoRotateMs: 6000,
    },
  });
}

export function scrollingLogos(
  items: { name: string; src: string }[],
  screenReaderText: string,
) {
  return block("MarketingScrollingLogos", {
    style: {
      padding: pad(2, 0, 2, 0),
      backgroundColor: sv(C.card),
    },
    props: {
      screenReaderText,
      items: {
        children: items.map((item) =>
          container(
            [
              image(item.src, item.name, {
                width: size(3),
                height: size(3),
                objectFit: sv("contain"),
                borderRadius: radius(0),
              }),
              inlineText(item.name, {
                textAlign: sv("center"),
                fontSize: size(0.875),
                fontWeight: sv("500"),
              }),
            ],
            {
              alignItems: sv("center"),
              justifyContent: sv("center"),
              gap: gap(0.75),
              width: size(11),
              minWidth: size(11),
              flexShrink: sv("0"),
              padding: pad(1.5, 1.25, 1.5, 1.25),
              borderRadius: radius(16),
              borderStyle: sv("solid"),
              borderWidth: size(1, "px"),
              borderColor: sv(C.border),
            },
          ),
        ),
      },
    },
  });
}
