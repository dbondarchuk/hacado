"use client";
import {
  PageHeaderUpdateModel,
  resolvePageHeaderPosition,
} from "@hacado/types";
import { cn } from "@hacado/ui";
import {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { getColorStyle } from "../style/helpers/colors";
import { blockPreviewLinkNavigation } from "./preview-navigation";
import { resolveHeaderStyle } from "./resolve-style";

function toBackgroundCss(
  color: string | null | undefined,
  withBlur: boolean,
): string | undefined {
  if (!color) {
    return withBlur
      ? "hsl(var(--value-background-color) / 0.9)"
      : "hsl(var(--value-background-color))";
  }
  if (color === "transparent") {
    return "transparent";
  }
  const base = getColorStyle(color);
  if (!base || !withBlur || color === "currentColor") {
    return base;
  }
  if (base.startsWith("hsl(") && !base.includes("/")) {
    return base.replace(/\)$/, " / 0.9)");
  }
  return base;
}

export const HeaderInternal = ({
  config,
  className,
  headerId,
  children,
  forceScrolled,
  preview,
}: {
  config: PageHeaderUpdateModel;
  className?: string;
  headerId?: string;
  children: ReactNode | ReactNode[];
  forceScrolled?: boolean;
  preview?: boolean;
}) => {
  const [isScrolled, setIsScrolled] = useState(forceScrolled ?? false);

  useEffect(() => {
    if (forceScrolled !== undefined) {
      setIsScrolled(forceScrolled);
      return;
    }
    const scrollHandler = () => {
      setIsScrolled(window.scrollY > 10);
    };
    scrollHandler();
    window.addEventListener("scroll", scrollHandler, { passive: true });
    return () => window.removeEventListener("scroll", scrollHandler);
  }, [forceScrolled]);

  const style = resolveHeaderStyle(config, isScrolled);
  const resolvedPosition = resolvePageHeaderPosition({
    position: style.position,
    sticky: config.sticky,
  });
  const withBlur = Boolean(style.backdropBlur) && resolvedPosition !== "static";
  const backgroundColor = toBackgroundCss(style.backgroundColor, withBlur);

  const cssVars: CSSProperties = {
    backgroundColor,
  };

  if (style.textColor) {
    cssVars.color = getColorStyle(style.textColor);
    // (cssVars as Record<string, string>)["--value-foreground-color"] =
    //   style.textColor.startsWith("var(")
    //     ? style.textColor.slice(4, -1)
    //     : style.textColor;
  }

  const blockPreviewNavigation = (event: MouseEvent | KeyboardEvent) => {
    if (!preview) return;
    blockPreviewLinkNavigation(event);
  };

  return (
    <header
      className={cn(
        "font-light text-[hsl(var(--value-foreground-color))] font-[family-name:--font-primary-value] w-full z-20 transition-all duration-300 header-container",
        withBlur && "backdrop-blur",
        !preview && resolvedPosition === "sticky" && "sticky top-0",
        !preview && resolvedPosition === "fixed" && "fixed top-0 inset-x-0",
        preview && "absolute inset-x-0 top-0",
        style.shadow && "drop-shadow-md",
        headerId && `header-${headerId}-container`,
        className,
      )}
      style={cssVars}
      data-header-id={headerId}
      data-scrolled={isScrolled ? "true" : "false"}
      onClickCapture={blockPreviewNavigation}
      onAuxClickCapture={blockPreviewNavigation}
      onKeyDownCapture={blockPreviewNavigation}
    >
      {children}
    </header>
  );
};
