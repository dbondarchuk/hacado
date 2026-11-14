"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../utils";
import { ScrollArea, ScrollBar } from "./scroll-area";

type RegisteredTab = {
  value: string;
  node: React.ReactNode;
  className?: string;
  onSelect?: () => void;
};

const Tabs = TabsPrimitive.Root;
type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  registerTrigger: (tab: RegisteredTab) => void;
  unregisterTrigger: (value: string) => void;
  triggers: RegisteredTab[];
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error("useTabsContext must be used inside <TabsRoot>");
  }

  return ctx;
}

const TabsRoot = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Tabs>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Tabs>
>(
  (
    { value: controlledValue, defaultValue, onValueChange, children, ...props },
    ref,
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(
      defaultValue ?? "",
    );

    const value = controlledValue ?? uncontrolledValue;

    const setValue = React.useCallback(
      (next: string) => {
        if (controlledValue === undefined) {
          setUncontrolledValue(next);
        }

        onValueChange?.(next);
      },
      [controlledValue, onValueChange],
    );

    const [triggers, setTriggers] = React.useState<RegisteredTab[]>([]);

    const registerTrigger = React.useCallback((tab: RegisteredTab) => {
      setTriggers((prev) =>
        prev.some((t) => t.value === tab.value) ? prev : [...prev, tab],
      );
    }, []);

    const unregisterTrigger = React.useCallback((value: string) => {
      setTriggers((prev) => prev.filter((t) => t.value !== value));
    }, []);

    return (
      <TabsContext.Provider
        value={{
          value,
          setValue,
          registerTrigger,
          unregisterTrigger,
          triggers,
        }}
      >
        <Tabs value={value} onValueChange={setValue} {...props}>
          {children}
        </Tabs>
      </TabsContext.Provider>
    );
  },
);

TabsRoot.displayName = TabsPrimitive.Tabs.displayName;

const TabsViaUrl = React.forwardRef<
  React.ElementRef<typeof TabsRoot>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Tabs> & {
    usePath?: string;
  }
>(({ defaultValue, usePath, onValueChange, ...props }, ref) => {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("activeTab") || defaultValue;
  const router = useRouter();

  const onChange = useCallback(
    (value: string) => {
      onValueChange?.(value);
      if (usePath) {
        router.push(`${usePath}/${encodeURIComponent(value)}`);
      } else {
        const next = new URLSearchParams(searchParams.toString());
        next.set("activeTab", value);
        router.push(`?${next.toString()}`);
      }
    },
    [usePath, onValueChange, router, searchParams],
  );

  return (
    <TabsRoot ref={ref} value={activeTab} onValueChange={onChange} {...props} />
  );
});

TabsViaUrl.displayName = TabsPrimitive.Tabs.displayName;

// const TabsList = React.forwardRef<
//   React.ElementRef<typeof TabsPrimitive.List>,
//   React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
// >(({ className, ...props }, ref) => (
//   <TabsPrimitive.List
//     ref={ref}
//     className={cn(
//       "inline-flex h-9 items-center justify-center rounded-md bg-card border p-1 text-muted-foreground",
//       className,
//     )}
//     {...props}
//   />
// ));

// TabsList.displayName = TabsPrimitive.List.displayName;

type TabsListVariant = "default" | "line";

const TabsListVariantContext = React.createContext<TabsListVariant>("default");

function scrollTabIntoNearestOverflow(activeTab: HTMLElement) {
  let scrollParent: HTMLElement | null = activeTab.parentElement;

  while (scrollParent) {
    const isScrollAreaViewport = scrollParent.hasAttribute(
      "data-radix-scroll-area-viewport",
    );

    const { overflowX } = getComputedStyle(scrollParent);
    const canScrollX =
      overflowX === "auto" ||
      overflowX === "scroll" ||
      overflowX === "overlay" ||
      isScrollAreaViewport;

    if (canScrollX && scrollParent.scrollWidth > scrollParent.clientWidth + 1) {
      const parentRect = scrollParent.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      const nextLeft =
        scrollParent.scrollLeft +
        (tabRect.left - parentRect.left) -
        parentRect.width / 2 +
        tabRect.width / 2;

      scrollParent.scrollTo({
        left: Math.max(0, nextLeft),
        behavior: "smooth",
      });

      return;
    }

    scrollParent = scrollParent.parentElement;
  }
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    dontScrollIntoView?: boolean;
    variant?: TabsListVariant;
  }
>(({ className, dontScrollIntoView, variant = "default", ...props }, ref) => {
  const tabsListRef = useRef<HTMLDivElement | null>(null);
  const hasSeededInitialIndicator = useRef(false);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const isLine = variant === "line";

  const updateIndicator = React.useCallback(() => {
    if (!tabsListRef.current) return;

    const activeTab = tabsListRef.current.querySelector<HTMLElement>(
      '[data-state="active"]',
    );

    if (!activeTab) return;

    const activeRect = activeTab.getBoundingClientRect();
    const tabsRect = tabsListRef.current.getBoundingClientRect();

    if (!dontScrollIntoView) {
      scrollTabIntoNearestOverflow(activeTab);
    }

    requestAnimationFrame(() => {
      if (isLine) {
        setIndicatorStyle({
          left: activeRect.left - tabsRect.left,
          bottom: 0,
          top: "auto",
          width: activeRect.width,
          height: 2,
        });

        return;
      }

      setIndicatorStyle({
        left: activeRect.left - tabsRect.left,
        top: activeRect.top - tabsRect.top,
        bottom: "auto",
        width: activeRect.width,
        height: activeRect.height,
      });
    });
  }, [dontScrollIntoView, isLine]);

  const seedIndicatorFromFirstTab = React.useCallback(() => {
    if (!tabsListRef.current || hasSeededInitialIndicator.current) return;

    const firstTab =
      tabsListRef.current.querySelector<HTMLElement>('[role="tab"]');

    if (!firstTab) return;

    const firstRect = firstTab.getBoundingClientRect();
    const tabsRect = tabsListRef.current.getBoundingClientRect();

    if (isLine) {
      setIndicatorStyle({
        left: firstRect.left - tabsRect.left,
        bottom: 0,
        top: "auto",
        width: firstRect.width,
        height: 2,
      });
    } else {
      setIndicatorStyle({
        left: firstRect.left - tabsRect.left,
        top: firstRect.top - tabsRect.top,
        bottom: "auto",
        width: firstRect.width,
        height: firstRect.height,
      });
    }

    hasSeededInitialIndicator.current = true;
  }, [isLine]);

  useEffect(() => {
    // Seed initial position from first tab, then animate to active.
    seedIndicatorFromFirstTab();
    const timeoutId = setTimeout(updateIndicator, 0);

    // Event listeners
    window.addEventListener("resize", updateIndicator);
    const observer = new MutationObserver(updateIndicator);

    if (tabsListRef.current) {
      observer.observe(tabsListRef.current, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateIndicator);
      observer.disconnect();
    };
  }, [seedIndicatorFromFirstTab, updateIndicator]);

  return (
    <TabsListVariantContext.Provider value={variant}>
      <div className="relative" ref={tabsListRef}>
        <TabsPrimitive.List
          ref={ref}
          data-slot="tabs-list"
          data-variant={variant}
          className={cn(
            isLine
              ? "relative inline-flex h-auto w-fit items-center justify-start gap-5 border-b border-border text-muted-foreground"
              : "relative inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground",
            className,
          )}
          {...props}
        />
        <div
          className={cn(
            "absolute transition-all duration-300 ease-in-out",
            isLine
              ? "bg-foreground"
              : "rounded-md border border-transparent bg-background shadow-sm dark:border-input dark:bg-input/30",
          )}
          style={indicatorStyle}
        />
      </div>
    </TabsListVariantContext.Provider>
  );
});

TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTriggerBase = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsListVariantContext);
  const isLine = variant === "line";

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      className={cn(
        "z-10 inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        isLine
          ? "h-auto rounded-none border-0 bg-transparent px-0 py-2.5 text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          : "h-[calc(100%-1px)] flex-1 rounded-md border border-transparent px-2 py-1 data-[state=active]:text-foreground focus-visible:border-ring",
        className,
      )}
      {...props}
    />
  );
});

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsTriggerBase>,
  React.ComponentPropsWithoutRef<typeof TabsTriggerBase>
>(({ className, value, children, ...props }, ref) => {
  const { registerTrigger, unregisterTrigger } = useTabsContext();

  React.useEffect(() => {
    registerTrigger({ value, node: children, className });
    return () => unregisterTrigger(value);
  }, [value, children, registerTrigger, unregisterTrigger, className]);

  return (
    <TabsTriggerBase value={value} ref={ref} className={className} {...props}>
      {children}
    </TabsTriggerBase>
  );
});

TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));

TabsContent.displayName = TabsPrimitive.Content.displayName;

const ResponsiveTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    dontScrollIntoView?: boolean;
    variant?: TabsListVariant;
  }
>(({ className, variant, ...props }, ref) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollIndicators = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
    const hasOverflow = maxScrollLeft > 1;
    const scrollLeft = viewport.scrollLeft;

    setCanScrollLeft(hasOverflow && scrollLeft > 1);
    setCanScrollRight(hasOverflow && scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onScroll = () => updateScrollIndicators();
    viewport.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateScrollIndicators);

    const resizeObserver = new ResizeObserver(() => updateScrollIndicators());
    resizeObserver.observe(viewport);

    const contentElement = viewport.firstElementChild;
    if (contentElement instanceof HTMLElement) {
      resizeObserver.observe(contentElement);
    }

    requestAnimationFrame(updateScrollIndicators);

    return () => {
      viewport.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScrollIndicators);
      resizeObserver.disconnect();
    };
  }, [updateScrollIndicators]);

  return (
    <ScrollArea
      className="relative h-auto w-full min-w-0 max-w-full whitespace-nowrap [&>[data-radix-scroll-area-viewport]]:h-auto"
      viewportRef={viewportRef}
    >
      <TabsList
        variant={variant}
        className={cn(variant === "line" ? "mb-0" : "mb-2", className)}
        ref={ref}
        {...props}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-0 top-0 z-20 h-full max-h-12 w-8 bg-gradient-to-r from-background to-transparent transition-opacity",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute right-0 top-0 z-20 h-full max-h-12 w-8 bg-gradient-to-l from-background to-transparent transition-opacity",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
      />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
});

ResponsiveTabsList.displayName = TabsPrimitive.List.displayName;

// const ResponsiveTabsList = ({
//   children,
//   className,
//   mobileClassName,
// }: ResponsiveTabsListProps) => {
//   const { value, setValue, triggers } = useTabsContext();

//   const selectedTrigger = triggers.find((tab) => tab.value === value);

//   return (
//     <>
//       {/* Mobile */}
//       <div className="md:hidden">
//         <Select value={value} onValueChange={setValue}>
//           <SelectTrigger
//             className={cn("w-full flex flex-row gap-2", mobileClassName)}
//           >
//             <ViewIcon className="size-3" />
//             <SelectValue asChild>
//               <div className="flex">
//                 <div
//                   className={cn(
//                     "inline-flex items-center [&_svg]:size-3",
//                     selectedTrigger?.className,
//                   )}
//                 >
//                   {selectedTrigger?.node}
//                 </div>
//               </div>
//             </SelectValue>
//           </SelectTrigger>
//           <SelectContent>
//             {triggers.map((tab) => (
//               <SelectItem key={tab.value} value={tab.value} className="w-full">
//                 <div
//                   className={cn(
//                     "inline-flex items-center [&_svg]:size-3",
//                     tab.className,
//                   )}
//                 >
//                   {tab.node}
//                 </div>
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Desktop */}
//       <TabsList className={`hidden md:inline-flex ${className ?? ""}`}>
//         {children}
//       </TabsList>
//     </>
//   );
// };
// ResponsiveTabsList.displayName = TabsPrimitive.List.displayName;

export {
  ResponsiveTabsList,
  TabsRoot as Tabs,
  // Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TabsViaUrl,
};
