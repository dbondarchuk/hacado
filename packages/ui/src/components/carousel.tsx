"use client";

import { useI18n } from "@hacado/i18n/client";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import React from "react";

import { cn } from "../utils";
import { Button } from "./button";

import Autoplay from "embla-carousel-autoplay";

const TWEEN_FACTOR_BASE = 0.52;

function applyScaleTween(
  emblaApi: NonNullable<CarouselApi>,
  tweenNodes: HTMLElement[],
  tweenFactor: number,
  eventName?: string,
) {
  const engine = emblaApi.internalEngine();
  const scrollProgress = emblaApi.scrollProgress();
  const slidesInView = emblaApi.slidesInView();
  const isScrollEvent = eventName === "scroll";

  emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
    let diffToTarget = scrollSnap - scrollProgress;
    const slidesInSnap = engine.slideRegistry[snapIndex];
    if (!slidesInSnap) {
      return;
    }

    slidesInSnap.forEach((slideIndex) => {
      if (isScrollEvent && !slidesInView.includes(slideIndex)) {
        return;
      }

      if (engine.options.loop) {
        engine.slideLooper.loopPoints.forEach((loopItem) => {
          const target = loopItem.target();
          if (slideIndex === loopItem.index && target !== 0) {
            const sign = Math.sign(target);
            if (sign === -1) {
              diffToTarget = scrollSnap - (1 + scrollProgress);
            }

            if (sign === 1) {
              diffToTarget = scrollSnap + (1 - scrollProgress);
            }
          }
        });
      }

      const tweenValue = 1 - Math.abs(diffToTarget * tweenFactor);
      const scale = Math.min(Math.max(tweenValue, 0), 1);
      const tweenNode = tweenNodes[slideIndex];
      if (!tweenNode) {
        return;
      }

      tweenNode.style.transform = `scale(${scale})`;
    });
  });
}

function readTweenNodes(emblaApi: NonNullable<CarouselApi>) {
  return emblaApi.slideNodes().map((slideNode) => {
    return slideNode.querySelector(".carousel-tween") as HTMLElement;
  });
}

function settleEngine(emblaApi: NonNullable<CarouselApi>, startIndex: number) {
  let count = emblaApi.scrollSnapList().length;
  if (count < 1) {
    emblaApi.reInit();
    count = emblaApi.scrollSnapList().length;
  }

  if (count < 1) {
    return;
  }

  const safeIndex = Math.min(Math.max(startIndex, 0), count - 1);
  emblaApi.reInit({ startIndex: safeIndex });
  const engine = emblaApi.internalEngine();
  // The scroll body records its first animated step as a delta from 0.
  // A zero-duration update stores the real start so the first move doesn't teleport.
  engine.scrollBody.useDuration(0);
  engine.animation.update();
  engine.animation.render(1);
  engine.animation.update();
  engine.scrollBody.useBaseDuration();
  forceCarouselPosition(emblaApi);
}

function forceCarouselPosition(emblaApi: NonNullable<CarouselApi>) {
  const engine = emblaApi.internalEngine();
  const location = engine.location.get();
  engine.translate.to(location + 1);
  engine.translate.to(location);
  if (!engine.options.loop) {
    return;
  }

  engine.slideLooper.loopPoints.forEach((loopItem) => {
    loopItem.slideLocation.set(-1);
  });

  engine.slideLooper.loop();
}

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
  autoPlay?: number;
  scale?: boolean;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      autoPlay,
      scale = false,
      ...props
    },
    ref,
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
        ...(opts?.loop ? { containScroll: false as const } : {}),
      },
      [
        ...(plugins || []),
        ...(autoPlay
          ? [
              Autoplay({
                delay: autoPlay,
              }),
            ]
          : []),
      ],
    );

    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return;
      }

      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext],
    );

    React.useEffect(() => {
      if (!api || !setApi) {
        return;
      }

      setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      onSelect(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);

      return () => {
        api.off("select", onSelect);
      };
    }, [api, onSelect]);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      const markSlides = () => {
        const inView = new Set(api.slidesInView());
        const selected = api.selectedScrollSnap();
        api.slideNodes().forEach((node, index) => {
          node.classList.toggle("is-in-view", inView.has(index));
          node.classList.toggle("is-selected", index === selected);
        });
      };

      markSlides();
      api.on("slidesInView", markSlides);
      api.on("select", markSlides);
      api.on("reInit", markSlides);
      api.on("scroll", markSlides);

      return () => {
        api.off("slidesInView", markSlides);
        api.off("select", markSlides);
        api.off("reInit", markSlides);
        api.off("scroll", markSlides);
      };
    }, [api]);

    React.useEffect(() => {
      if (!api || !scale) {
        return;
      }

      let tweenFactor = 0;
      let tweenNodes: HTMLElement[] = [];
      const setTweenNodes = () => {
        tweenNodes = readTweenNodes(api);
      };

      const setTweenFactor = () => {
        tweenFactor = TWEEN_FACTOR_BASE * api.scrollSnapList().length;
      };

      const onTween = (
        emblaApi: NonNullable<CarouselApi>,
        eventName?: string,
      ) => {
        applyScaleTween(emblaApi, tweenNodes, tweenFactor, eventName);
      };

      setTweenNodes();
      setTweenFactor();
      onTween(api);

      api.on("reInit", setTweenNodes);
      api.on("reInit", setTweenFactor);
      api.on("reInit", onTween);
      api.on("scroll", onTween);
      api.on("slideFocus", onTween);

      return () => {
        api.off("reInit", setTweenNodes);
        api.off("reInit", setTweenFactor);
        api.off("reInit", onTween);
        api.off("scroll", onTween);
        api.off("slideFocus", onTween);
      };
    }, [api, scale]);

    const needsSettle = scale || !!opts?.loop;
    const [settled, setSettled] = React.useState(!needsSettle);
    const settledApi = React.useRef<CarouselApi>(null);

    React.useLayoutEffect(() => {
      if (!needsSettle || !api || settledApi.current === api) {
        return;
      }

      settleEngine(api, opts?.startIndex ?? 0);
      if (scale) {
        applyScaleTween(
          api,
          readTweenNodes(api),
          TWEEN_FACTOR_BASE * api.scrollSnapList().length,
        );
      }

      settledApi.current = api;
      setSettled(true);
    }, [api, needsSettle, opts?.startIndex, scale]);

    React.useLayoutEffect(() => {
      if (!api || !needsSettle || !settled) {
        return;
      }

      forceCarouselPosition(api);
      if (!scale) {
        return;
      }

      applyScaleTween(
        api,
        readTweenNodes(api),
        TWEEN_FACTOR_BASE * api.scrollSnapList().length,
      );
    }, [api, needsSettle, scale, settled]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
          scale,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
          style={
            needsSettle && !settled
              ? { ...props.style, visibility: "hidden" }
              : props.style
          }
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);

Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div
      ref={carouselRef}
      className="overflow-hidden carousel-content-container"
    >
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className,
        )}
        {...props}
      />
    </div>
  );
});

CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { orientation, scale } = useCarousel();

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      {...props}
    >
      {scale ? (
        <div className="carousel-tween w-full">{children}</div>
      ) : (
        children
      )}
    </div>
  );
});

CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();
  const t = useI18n("ui");

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">{t("carousel.previousSlide")}</span>
    </Button>
  );
});

CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  const t = useI18n("ui");

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">{t("carousel.nextSlide")}</span>
    </Button>
  );
});

CarouselNext.displayName = "CarouselNext";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
};
