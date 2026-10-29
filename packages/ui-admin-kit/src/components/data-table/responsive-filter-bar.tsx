"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Badge,
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hacado/ui";
import { Settings2 } from "lucide-react";
import React, { useLayoutEffect, useRef, useState } from "react";

const GAP = 8;

function flattenFilters(children: React.ReactNode): React.ReactElement[] {
  const result: React.ReactElement[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === React.Fragment) {
      const fragment = child as React.ReactElement<{
        children?: React.ReactNode;
      }>;
      result.push(...flattenFilters(fragment.props.children));
      return;
    }

    result.push(child);
  });

  return result;
}

function fitCount(available: number, widths: number[]) {
  let used = 0;
  let count = 0;

  for (const width of widths) {
    if (width <= 0) {
      count += 1;
      continue;
    }

    const next = used + (used > 0 ? GAP : 0) + width;
    if (next > available + 1) return count;

    used = next;
    count += 1;
  }

  return count;
}

export const ResponsiveFilterBar: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const t = useI18n("admin");
  const filters = flattenFilters(children);
  const containerRef = useRef<HTMLDivElement>(null);
  const widthsRef = useRef<number[]>([]);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleCount, setVisibleCount] = useState(filters.length);
  const previousCount = useRef(filters.length);

  if (previousCount.current !== filters.length) {
    previousCount.current = filters.length;
    widthsRef.current = [];
    if (visibleCount !== filters.length) setVisibleCount(filters.length);
  }

  useLayoutEffect(() => {
    const row = containerRef.current;
    if (!row) return;

    const update = () => {
      const widths = filters.map((_, index) => {
        const element = itemRefs.current[index];
        if (element && element.offsetWidth > 0) {
          widthsRef.current[index] = element.offsetWidth;
        }

        return widthsRef.current[index] ?? 0;
      });

      const next = fitCount(row.clientWidth, widths);
      setVisibleCount((current) => (current === next ? current : next));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(row);
    itemRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  });

  if (filters.length === 0) return null;

  const hidden = filters.slice(visibleCount);

  return (
    <div
      className={cn(
        "relative flex w-max min-w-0 max-w-full shrink items-center gap-2",
        className,
      )}
    >
      <div
        ref={containerRef}
        className="flex min-w-0 shrink items-center gap-2 overflow-hidden"
      >
        {filters.slice(0, visibleCount).map((filter, index) => (
          <div
            key={index}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            className="shrink-0"
          >
            {filter}
          </div>
        ))}
      </div>
      {hidden.length > 0 && (
        <Popover>
          <PopoverTrigger tooltip={t("common.labels.filters")} asChild>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              aria-label={t("common.labels.filters")}
            >
              <Settings2 size={16} />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal"
              >
                {hidden.length}
              </Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="flex max-h-[70vh] w-[min(100vw-2rem,20rem)] flex-col gap-2 overflow-y-auto"
          >
            {hidden.map((filter, index) => (
              <div key={visibleCount + index}>{filter}</div>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
