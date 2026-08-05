"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  ToolbarButton,
  ToolbarGroup,
} from "@hacado/ui";
import { Laptop, Monitor, Smartphone, Tablet, Tv } from "lucide-react";
import { useCallback } from "react";
import {
  useSelectedScreenSize,
  useSetSelectedScreenSize,
  ViewportSize,
} from "../../../documents/editor/context";

type ViewportSizeConfig = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className?: string;
};

const VIEWPORT_SIZES: Record<ViewportSize, ViewportSizeConfig> = {
  // original: {
  //   icon: MonitorSmartphone,
  //   label: "baseBuilder.builderToolbar.view.original",
  // },
  desktop: {
    icon: Monitor,
    label: "baseBuilder.builderToolbar.view.desktop",
  },
  largeDesktop: {
    icon: Tv,
    label: "baseBuilder.builderToolbar.view.largeDesktop",
  },
  laptop: {
    icon: Laptop,
    label: "baseBuilder.builderToolbar.view.laptop",
  },
  tablet: {
    icon: Tablet,
    label: "baseBuilder.builderToolbar.view.tablet",
  },
  mobile: {
    icon: Smartphone,
    label: "baseBuilder.builderToolbar.view.mobile",
  },
  mobileLandscape: {
    icon: Smartphone,
    label: "baseBuilder.builderToolbar.view.mobileLandscape",
    className: "rotate-90",
  },
};

export const ToolbarViewportGroup = () => {
  const t = useI18n("builder");

  const selectedScreenSize = useSelectedScreenSize();
  const setSelectedScreenSize = useSetSelectedScreenSize();
  const handleScreenSizeChange = useCallback(
    (value: ViewportSize) => {
      setSelectedScreenSize(value);
    },
    [setSelectedScreenSize],
  );

  const ViewportIcon = VIEWPORT_SIZES[selectedScreenSize].icon;
  return (
    <ToolbarGroup>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            tooltip={t("baseBuilder.builderToolbar.view.title")}
            isDropdown
            className="text-xs px-2"
            // suppressHydrationWarning for persisted state
            suppressHydrationWarning
          >
            <ViewportIcon
              // suppressHydrationWarning for persisted state
              // @ts-expect-error - suppressHydrationWarning is not a valid prop for the Icon component
              suppressHydrationWarning
              className={cn(
                "size-4",
                VIEWPORT_SIZES[selectedScreenSize].className,
              )}
            />
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-0">
          <DropdownMenuRadioGroup
            value={selectedScreenSize}
            onValueChange={handleScreenSizeChange as any}
          >
            {Object.entries(VIEWPORT_SIZES).map(([size, config]) => {
              const Icon = config.icon;
              return (
                <DropdownMenuRadioItem
                  key={size}
                  value={size}
                  className="min-w-[220px]"
                >
                  <Icon className={cn("size-4", config.className)} />
                  {t(config.label as any)}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarGroup>
  );
};
