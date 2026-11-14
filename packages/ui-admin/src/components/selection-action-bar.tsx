"use client";

import { useI18n } from "@hacado/i18n/client";
import { Button, type ButtonProps } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@hacado/ui/dropdown-menu";
import { CaretDownIcon } from "@radix-ui/react-icons";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import React from "react";
import { useSelectedRowsStore } from "./data-table/use-data-table-context";

const bar = cva(
  "flex max-w-[calc(100vw-2rem)] w-full md:max-w-3xl items-center justify-between gap-3 rounded-xl border border-transparent bg-primary px-4 py-3 text-sm text-primary-foreground shadow-lg animate-in fade-in slide-in-from-bottom-4",
);

function getComponentName(type: React.ElementType): string {
  if (typeof type === "string") return type;

  if (typeof type === "function") {
    return type.displayName || type.name || "";
  }

  if (typeof type === "object" && type !== null) {
    const component = type as { displayName?: string; name?: string };
    return component.displayName || component.name || "";
  }

  return "";
}

function isGroupElement(element: React.ReactElement): boolean {
  if (element.type === React.Fragment) return true;

  const name = getComponentName(element.type);
  if (name === "ButtonGroup") return true;

  const props = element.props as { "data-slot"?: string; role?: string };
  return props["data-slot"] === "button-group" || props.role === "group";
}

function flattenActionElements(
  children: React.ReactNode,
): React.ReactElement[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child)) return [];

    if (isGroupElement(child)) {
      return flattenActionElements(
        (child.props as { children?: React.ReactNode }).children,
      );
    }

    return [child];
  });
}

function MobileSelectionActions({
  primary,
  secondary,
  primaryVariant,
}: {
  primary: React.ReactNode;
  secondary: React.ReactElement[];
  primaryVariant: NonNullable<ButtonProps["variant"]>;
}) {
  const t = useI18n("ui");

  if (secondary.length === 0) {
    return <div className="flex shrink-0 items-center">{primary}</div>;
  }

  return (
    <div className="flex shrink-0 items-center">
      <div className="min-w-0 [&_button]:rounded-r-none">{primary}</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={primaryVariant}
            className="rounded-l-none border-l-0 px-2"
            aria-label={t("actions.label")}
          >
            <CaretDownIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="flex min-w-44 flex-col gap-2 p-2"
        >
          {secondary.map((action, index) => (
            <div key={action.key ?? index} className="w-full [&_button]:w-full">
              {action}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function SelectionActionBar({
  count,
  children,
  primary,
  primaryVariant = "destructive",
  className,
}: {
  count: number;
  /** Extra actions (shown beside primary on desktop; in the mobile menu) */
  children?: React.ReactNode;
  /** Prefer delete here so mobile keeps it as the main button */
  primary?: React.ReactNode;
  /** Variant for the mobile overflow trigger next to the primary action */
  primaryVariant?: ButtonProps["variant"];
  className?: string;
}) {
  const t = useI18n("ui");
  const clearRowSelection = useSelectedRowsStore(
    (state) => state.clearRowSelection,
  );

  if (count < 1) return null;

  const childActions = flattenActionElements(children);
  let mobilePrimary: React.ReactNode = primary ?? null;
  let mobileSecondary: React.ReactElement[] = primary ? childActions : [];

  if (!primary) {
    if (childActions.length <= 1) {
      mobilePrimary = childActions[0] ?? null;
      mobileSecondary = [];
    } else {
      const deleteIndex = childActions.findIndex((action) =>
        /delete/i.test(getComponentName(action.type)),
      );

      const primaryIndex = deleteIndex >= 0 ? deleteIndex : 0;
      mobilePrimary = childActions[primaryIndex];
      mobileSecondary = childActions.filter(
        (_, index) => index !== primaryIndex,
      );
    }
  }

  const desktopActions = primary ? (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {children}
      {primary}
    </div>
  ) : (
    children
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div
        className={cn(bar(), "pointer-events-auto", className)}
        role="toolbar"
        aria-label={t("dataTable.selectedCount", { selected: count })}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium">
            {t("dataTable.selectedCount", { selected: count })}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 border border-background/30 text-background hover:bg-background/10 hover:text-background"
            aria-label={t("common.clear")}
            onClick={() => clearRowSelection()}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="hidden shrink-0 md:block">{desktopActions}</div>
        <div className="md:hidden">
          {mobilePrimary ? (
            <MobileSelectionActions
              primary={mobilePrimary}
              secondary={mobileSecondary}
              primaryVariant={primaryVariant}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
