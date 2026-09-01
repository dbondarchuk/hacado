"use client";

import { AllKeys, useI18n } from "@hacado/i18n/client";
import { Button, Input, ScrollArea, useDebounce } from "@hacado/ui";
import { Search, X } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useTemplates } from "../../../documents/editor/context";
import type { TemplateDefinition } from "../../../documents/types";
import { DraggableBlockItem } from "./draggable-block-item";

const TemplatesPanelContent = memo(
  ({
    filteredTemplates,
  }: {
    filteredTemplates: Record<
      string,
      Array<{ type: string; config: TemplateDefinition }>
    >;
  }) => {
    const tBuilder = useI18n("builder");
    const t = useI18n();

    return (
      <ScrollArea className="py-2 pr-2 h-[calc(100vh-400px)] min-h-60">
        {Object.keys(filteredTemplates).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {tBuilder("baseBuilder.blocks.noResultsFound")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredTemplates).map(
              ([category, templateList]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {t(category as AllKeys)}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {templateList.map(({ type, config }) => (
                      <DraggableBlockItem
                        key={type}
                        blockType={type}
                        isTemplate
                        variant={config.previewImage ? "card" : "list"}
                        blockConfig={{
                          displayName: config.displayName,
                          icon: config.icon,
                          category: config.category,
                          previewImage: config.previewImage,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </ScrollArea>
    );
  },
);

export const TemplatesPanel = memo(() => {
  const tBuilder = useI18n("builder");
  const t = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const templates = useTemplates();

  const filteredTemplates = useMemo(() => {
    const entries = Object.entries(templates || {});

    return entries
      .filter(([type, config]) => {
        if (!debouncedSearchQuery.trim()) return true;
        const query = debouncedSearchQuery.trim().toLocaleLowerCase();
        const name = config.displayName.toLocaleLowerCase();
        const displayName = t(config.displayName).toLocaleLowerCase();
        const category = t(config.category).toLocaleLowerCase();
        const typeLower = type.toLocaleLowerCase();

        return (
          name.includes(query) ||
          displayName.includes(query) ||
          category.includes(query) ||
          typeLower.includes(query)
        );
      })
      .reduce(
        (acc, [type, config]) => {
          const category = config.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push({ type, config });
          return acc;
        },
        {} as Record<
          string,
          Array<{ type: string; config: TemplateDefinition }>
        >,
      );
  }, [templates, t, debouncedSearchQuery]);

  return (
    <>
      <p className="mb-3 text-xs text-muted-foreground">
        {tBuilder("baseBuilder.blocks.templates.subtitle")}
      </p>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
        <Input
          placeholder={tBuilder("baseBuilder.blocks.search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 transform"
          onClick={() => setSearchQuery("")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <TemplatesPanelContent filteredTemplates={filteredTemplates} />
    </>
  );
});

TemplatesPanel.displayName = "TemplatesPanel";
