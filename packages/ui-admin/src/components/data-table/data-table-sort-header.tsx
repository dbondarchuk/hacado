import { I18nKey, I18nNamespaces, useI18n } from "@hacado/i18n/client";
import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import { HeaderContext, Row, SortDirection } from "@tanstack/react-table";
import {
  ArrowDown10,
  ArrowDownWideNarrow,
  ArrowDownZA,
  ArrowUp01,
  ArrowUpAZ,
  ArrowUpDown,
  ArrowUpWideNarrow,
  CalendarArrowDown,
  CalendarArrowUp,
  ClockArrowDown,
  ClockArrowUp,
  type LucideIcon,
} from "lucide-react";

export type SortingFieldType =
  | "number"
  | "string"
  | "date"
  | "time"
  | "default";

type SortingState = "false" | SortDirection;

const buttons: Record<SortingFieldType, Record<SortingState, LucideIcon>> = {
  default: {
    asc: ArrowUpWideNarrow,
    desc: ArrowDownWideNarrow,
    false: ArrowUpDown,
  },
  number: {
    asc: ArrowUp01,
    desc: ArrowDown10,
    false: ArrowUpDown,
  },
  string: {
    asc: ArrowUpAZ,
    desc: ArrowDownZA,
    false: ArrowUpDown,
  },
  date: {
    asc: CalendarArrowUp,
    desc: CalendarArrowDown,
    false: ArrowUpDown,
  },
  time: {
    asc: ClockArrowUp,
    desc: ClockArrowDown,
    false: ArrowUpDown,
  },
};

export const tableSortHeader = <
  T extends I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
>(
  title: I18nKey<T, CustomKeys>,
  type: SortingFieldType = "default",
  i18nNamespace: T = "ui" as T,
) => {
  const TableHeader = ({ column }: HeaderContext<any, any>) => {
    const t = useI18n<T, CustomKeys>(i18nNamespace);
    const ButtonIcon = buttons[type][column.getIsSorted() || "false"];
    return (
      <Button
        type="button"
        variant="ghost"
        size="none"
        className={cn(
          "h-auto justify-start gap-1 rounded-none p-0 text-sm font-medium text-muted-foreground [&>svg]:size-3.5",
          "hover:bg-transparent hover:text-foreground",
          "active:bg-transparent",
          "focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
          column.getIsSorted() &&
            "underline text-foreground font-semibold hover:text-foreground/80",
        )}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {t(title)}
        <ButtonIcon />
      </Button>
    );
  };

  return TableHeader;
};

export const tableSortNoopFunction = (
  rowA: Row<any>,
  rowB: Row<any>,
  columnId: string,
): number => {
  return rowA.index - rowB.index;
};
