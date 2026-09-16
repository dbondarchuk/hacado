"use client";

import { usePortalContext } from "@hacado/builder";
import { richTextToString, StaticText } from "@hacado/rte-inline/reader";
import {
  ButtonMenuItem,
  LinkMenuItem,
  MenuItem,
  MenuItemWithSubMenu,
  PageHeaderUpdateModel,
} from "@hacado/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  cn,
  Drawer,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  Link,
} from "@hacado/ui";
import { ChevronDown } from "lucide-react";
import React, {
  CSSProperties,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { ReplaceOriginalColors } from "../helpers/replace-original-colors";
import { getColorStyle } from "../style/helpers/colors";
import {
  HeaderDrawerHeader,
  HeaderDrawerTrigger,
  PortalDrawerContent,
} from "./drawer-content";
import { HeaderInternal } from "./header";
import { Logo } from "./logo";
import { mergeMenuItemAppearance, resolveHeaderStyle } from "./resolve-style";

export type HeaderProps = {
  name: string;
  logo?: string;
  config: PageHeaderUpdateModel;
  className?: string;
  headerId?: string;
  forceScrolled?: boolean;
  /** When set, overrides viewport detection for layout + mobile appearance. */
  forceMobile?: boolean;
  preview?: boolean;
};

const LinkRender: React.FC<{
  item: Omit<LinkMenuItem, "url" | "type"> | ButtonMenuItem;
}> = ({ item }) => (
  <>
    {item.prefixIcon && (
      <Icon
        name={item.prefixIcon as any}
        className="w-6 h-6"
        aria-label={richTextToString(item.label)}
      />
    )}
    <StaticText value={item.label ?? ""} inline />
    {item.suffixIcon && (
      <Icon
        name={item.suffixIcon as any}
        className="w-6 h-6"
        aria-label={richTextToString(item.label)}
      />
    )}
  </>
);

function itemClassName(
  item: { className?: string | null; doNotCombineClassName?: boolean },
  defaultClassName?: string,
  ...extra: (string | undefined)[]
) {
  return cn(
    !item.doNotCombineClassName && defaultClassName,
    item.className,
    ...extra,
  );
}

function itemColorStyle(item: {
  textColor?: string | null;
}): CSSProperties | undefined {
  if (!item.textColor) return undefined;
  return { color: getColorStyle(item.textColor) };
}

function isMobilePinnedMenuItem(
  item: MenuItemWithSubMenu,
): item is MenuItem & { showOnMobileHeader?: boolean } {
  return (
    item.type !== "submenu" &&
    item.type !== "spacer" &&
    "showOnMobileHeader" in item &&
    Boolean(item.showOnMobileHeader)
  );
}

/** Matches Tailwind `lg` breakpoint used by header desktop/mobile layout. */
const HEADER_MOBILE_MEDIA_QUERY = "(max-width: 1023px)";

function subscribeHeaderMobile(onChange: () => void) {
  const media = window.matchMedia(HEADER_MOBILE_MEDIA_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getHeaderMobileSnapshot() {
  return window.matchMedia(HEADER_MOBILE_MEDIA_QUERY).matches;
}

function getHeaderMobileServerSnapshot() {
  return false;
}

export const Header: React.FC<HeaderProps> = ({
  name,
  logo,
  config,
  className,
  headerId,
  forceScrolled,
  forceMobile,
  preview,
}) => {
  const [isScrolled, setIsScrolled] = useState(forceScrolled ?? false);
  const mediaMobile = useSyncExternalStore(
    subscribeHeaderMobile,
    getHeaderMobileSnapshot,
    getHeaderMobileServerSnapshot,
  );

  const { document: portalDocument } = usePortalContext();
  const isMobile = forceMobile ?? mediaMobile;

  useEffect(() => {
    const effectiveWindow = portalDocument.defaultView ?? window;
    if (forceScrolled !== undefined) {
      setIsScrolled(forceScrolled);
      return;
    }

    const scrollHandler = () => {
      setIsScrolled(effectiveWindow.scrollY > 10);
    };

    scrollHandler();
    effectiveWindow.addEventListener("scroll", scrollHandler, {
      passive: true,
    });

    return () => effectiveWindow.removeEventListener("scroll", scrollHandler);
  }, [forceScrolled, portalDocument]);

  const style = resolveHeaderStyle(config, isScrolled);
  const mobileHeaderItem = config.menu?.find(isMobilePinnedMenuItem);
  // Mobile applies scrolled menu appearance (see mergeMenuItemAppearance).
  const resolveItem = (item: MenuItemWithSubMenu) =>
    mergeMenuItemAppearance(item, { isScrolled, isMobile });

  const getLink = (
    item: MenuItem,
    isSidebar: boolean,
    extraClassName?: string,
  ) => {
    switch (item.type) {
      case "spacer":
        return <div className="flex-1" />;

      case "icon":
        return (
          <Link
            href={item.url}
            className={itemClassName(
              item,
              "no-underline inline-flex gap-2 text-foreground hover:text-foreground/80",
              extraClassName,
            )}
            style={itemColorStyle(item)}
            key={item.url}
          >
            <Icon
              name={item.icon as any}
              className="w-6 h-6"
              aria-label={richTextToString(item.label)}
            />
            {isSidebar && (
              <span className="ml-2">
                <StaticText value={item.label ?? ""} inline />
              </span>
            )}
          </Link>
        );

      case "button":
        return (
          <Link
            button
            variant={item.variant}
            size={item.size}
            key={item.url}
            href={item.url}
            font={item.font}
            fontSize={item.fontSize}
            fontWeight={item.fontWeight}
            className={itemClassName(item, undefined, extraClassName)}
            style={itemColorStyle(item)}
          >
            <LinkRender item={item} />
          </Link>
        );

      case "link":
      default:
        return (
          <Link
            key={item.url}
            variant={item.variant}
            size={item.size}
            font={item.font}
            fontSize={item.fontSize}
            fontWeight={item.fontWeight}
            className={itemClassName(
              item,
              "text-foreground hover:text-foreground/80 transition-colors inline-flex items-center gap-1",
              extraClassName,
            )}
            style={itemColorStyle(item)}
            href={item.url}
          >
            <LinkRender item={item} />
          </Link>
        );
    }
  };

  const renderMenuItem = (
    item: MenuItemWithSubMenu,
    index: number,
    isSidebar: boolean,
  ) => {
    const resolved = resolveItem(item);

    if (resolved.type !== "submenu") {
      return (
        <React.Fragment key={index}>
          {getLink(resolved, isSidebar)}
        </React.Fragment>
      );
    }

    if (isSidebar) {
      return (
        <Accordion type="single" collapsible key={index}>
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger
              className={itemClassName(
                resolved,
                "justify-end",
                resolved.hideChevron ? "[&>svg]:hidden" : undefined,
              )}
              style={itemColorStyle(resolved)}
            >
              <LinkRender item={resolved} />
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2 px-3">
              {resolved.children.map((subItem, jndex) => (
                <div key={jndex} className="inline-flex justify-end">
                  {getLink(resolveItem(subItem) as MenuItem, true)}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    return (
      <DropdownMenu key={index} modal={false}>
        <DropdownMenuTrigger
          className={itemClassName(
            resolved,
            "inline-flex gap-1 items-center group cursor-pointer",
          )}
          style={itemColorStyle(resolved)}
        >
          <LinkRender item={resolved} />
          {!resolved.hideChevron && (
            <ChevronDown
              size={16}
              className="group-data-[state=open]:rotate-180 transition-transform"
            />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className={cn(
            "rounded-xl border border-border bg-card p-2 text-foreground shadow-lg",
            resolved.twoColumns
              ? "min-w-[28rem] grid grid-cols-2"
              : "min-w-56 flex flex-col",
          )}
        >
          {resolved.children.map((subItem, jndex) => (
            <DropdownMenuItem
              key={jndex}
              asChild
              className="mx-0 cursor-pointer rounded-lg px-3 py-2 text-sm focus:bg-accent focus:text-accent-foreground"
            >
              {getLink(
                resolveItem(subItem) as MenuItem,
                false,
                "w-full justify-start text-foreground hover:text-foreground",
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <HeaderInternal
      config={config}
      className={className}
      headerId={headerId}
      forceScrolled={forceScrolled}
      preview={preview}
    >
      <ReplaceOriginalColors />
      <div
        className={cn(
          "flex flex-wrap p-4 flex-row items-center gap-4 header-content",
          config.fullWidth ? "w-full" : "container mx-auto",
        )}
      >
        <Logo
          name={name}
          logo={logo}
          showLogo={style.showLogo ?? undefined}
          hideName={style.hideName ?? undefined}
          logoSize={style.logoSize}
          logoNameFontSize={style.logoNameFontSize}
          logoNameFontWeight={style.logoNameFontWeight}
          customLogoText={style.customLogoText ?? undefined}
          headerId={headerId}
        />
        <div
          className={cn(
            "flex-1 flex-wrap gap-2 items-center text-base header-menu",
            forceMobile === true && "hidden",
            forceMobile === false && "flex",
            forceMobile === undefined && "hidden lg:flex",
          )}
        >
          <nav className="w-full flex flex-row gap-6 items-center justify-end header-menu-nav">
            {config?.menu?.map((item, index) =>
              renderMenuItem(item, index, false),
            )}
          </nav>
        </div>
        <div
          className={cn(
            "ml-auto items-center gap-3 header-mobile-menu",
            forceMobile === true && "flex",
            forceMobile === false && "hidden",
            forceMobile === undefined && "flex lg:hidden",
          )}
        >
          {mobileHeaderItem &&
            getLink(
              resolveItem(mobileHeaderItem) as MenuItem,
              false,
              "header-mobile-pinned-item",
            )}
          <Drawer direction="right">
            <HeaderDrawerTrigger />
            <PortalDrawerContent
              className={cn(
                "bg-background flex flex-col h-full mt-24 overflow-hidden fixed bottom-0 right-0 left-auto rounded-none header-mobile-menu-content",
                preview
                  ? "min-w-[min(80vw,24rem)] max-w-[min(80vw,24rem)]"
                  : "min-w-[80vw] max-w-[80vw]",
              )}
              preview={preview}
            >
              <ReplaceOriginalColors />
              <HeaderDrawerHeader />
              <div className="w-full flex-1 min-h-0 overflow-y-auto overscroll-contain pb-6 px-4">
                <nav className="flex flex-col gap-3 items-end header-mobile-menu-nav">
                  {config?.menu?.map((item, index) =>
                    renderMenuItem(item, index, true),
                  )}
                </nav>
              </div>
            </PortalDrawerContent>
          </Drawer>
        </div>
      </div>
    </HeaderInternal>
  );
};
