"use client";

import { useI18n } from "@hacado/i18n/client";
import { cn } from "@hacado/ui";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export type MarketingFeaturesShowcaseClientFeature = {
  id: string;
  cardIcon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  expandedTitleRow: ReactNode;
  expandedDetails: ReactNode;
};

export type MarketingFeaturesShowcaseClientProps = {
  baseId?: string;
  baseClassName?: string;
  features: MarketingFeaturesShowcaseClientFeature[];
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function columnsForWidth(w: number) {
  if (w >= 1024) return 4;
  if (w >= 640) return 2;
  return 1;
}

export function MarketingFeaturesShowcaseClient({
  baseId,
  baseClassName,
  features,
}: MarketingFeaturesShowcaseClientProps) {
  const t = useI18n("ui");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [columnsPerRow, setColumnsPerRow] = useState(4);

  useEffect(() => {
    const update = () => setColumnsPerRow(columnsForWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const rows = chunk(features, columnsPerRow);

  return (
    <section className={cn(baseClassName)} id={baseId}>
      <div className="marketing-features-showcase">
        {rows.map((row, rowIndex) => {
          const rowStartIndex = rowIndex * columnsPerRow;
          const rowEndIndex = rowStartIndex + row.length - 1;
          const shouldShowExpanded =
            expandedIndex !== null &&
            expandedIndex >= rowStartIndex &&
            expandedIndex <= rowEndIndex;
          const expandedFeature =
            shouldShowExpanded && expandedIndex !== null
              ? features[expandedIndex]
              : null;

          return (
            <div
              key={rowStartIndex}
              className="flex flex-col gap-4 marketing-features-showcase-rows"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 marketing-features-showcase-cards">
                {row.map((feature, featureIndex) => {
                  const globalIndex = rowStartIndex + featureIndex;
                  const isExpanded = expandedIndex === globalIndex;
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() =>
                        setExpandedIndex(isExpanded ? null : globalIndex)
                      }
                      className={cn(
                        "group relative flex flex-col items-center justify-between rounded-2xl border p-6 text-center transition-all duration-300",
                        isExpanded
                          ? "border-primary bg-primary/5 shadow-lg"
                          : "border-border bg-card hover:border-primary/50 hover:shadow-md",
                        "feature-card-container",
                      )}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className={cn(
                            "flex h-14 w-14 items-center justify-center rounded-xl transition-colors",
                            isExpanded
                              ? "bg-primary text-primary-foreground feature-card-icon-container feature-card-icon-container-expanded"
                              : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground feature-card-icon-container",
                          )}
                        >
                          {feature.cardIcon}
                        </div>
                        {feature.title}
                        {feature.description}
                      </div>
                      <span className="mt-4 text-xs font-medium text-primary">
                        {isExpanded
                          ? t("marketingFeaturesShowcase.clickToClose")
                          : t("marketingFeaturesShowcase.learnMore")}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  expandedFeature
                    ? "my-4 grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  {expandedFeature ? (
                    <div className="rounded-2xl border border-primary bg-card p-6 shadow-lg">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            {expandedFeature.expandedTitleRow}
                            <button
                              type="button"
                              onClick={() => setExpandedIndex(null)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          {expandedFeature.expandedDetails}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
