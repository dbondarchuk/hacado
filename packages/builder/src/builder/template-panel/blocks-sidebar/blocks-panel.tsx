import { AllKeys, useI18n } from "@hacado/i18n/client";
import {
  Button,
  genericMemo,
  Input,
  ScrollArea,
  useDebounce,
} from "@hacado/ui";
import { Search, X } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useBlocks, useRootBlockType } from "../../../documents/editor/context";
import { BaseZodDictionary } from "../../../documents/types";
import { DraggableBlockItem } from "./draggable-block-item";

type BlocksPanelProps<T extends BaseZodDictionary = any> = {
  allowOnly?: (keyof T)[];
};

const BlocksPanelContent = memo(
  ({
    filteredBlocks,
  }: {
    filteredBlocks: Record<
      string,
      Array<{ type: string; config: any; blockType: "block" }>
    >;
  }) => {
    const tBuilder = useI18n("builder");
    const t = useI18n();

    return (
      <ScrollArea className="py-2 pr-2 h-[calc(100vh-400px)] min-h-60">
        {Object.keys(filteredBlocks).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {tBuilder("baseBuilder.blocks.noResultsFound")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredBlocks).map(([category, blockList]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {t(category as AllKeys)}
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {blockList.map(({ type, config }) => (
                    <DraggableBlockItem
                      key={type}
                      blockType={type}
                      isTemplate={false}
                      blockConfig={config}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    );
  },
);

export const BlocksPanel = genericMemo(
  <T extends BaseZodDictionary = any>({ allowOnly }: BlocksPanelProps<T>) => {
    const tBuilder = useI18n("builder");
    const t = useI18n();
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const blocks = useBlocks();
    const rootBlockType = useRootBlockType();

    const filteredBlocks = useMemo(() => {
      const allBlocks = Object.entries(blocks).map(([type, config]) => ({
        type,
        config,
        blockType: "block" as const,
      }));

      return allBlocks
        .filter(({ type, config }) => {
          if (allowOnly) {
            if (Array.isArray(allowOnly)) {
              if (!allowOnly.includes(type as keyof T)) return false;
            } else if (type !== allowOnly) {
              return false;
            }
          }

          if (rootBlockType === type) return false;
          if (config.hideInBlocksPanel) return false;

          if (debouncedSearchQuery.trim()) {
            const query = debouncedSearchQuery.trim().toLocaleLowerCase();
            const name = config.displayName.toLocaleLowerCase();
            const displayName = t(config.displayName).toLocaleLowerCase();
            const category = t(config.category).toLocaleLowerCase();
            const typeLower = type.toLocaleLowerCase();

            if (
              !name.includes(query) &&
              !displayName.includes(query) &&
              !category.includes(query) &&
              !typeLower.includes(query)
            ) {
              return false;
            }
          }

          return true;
        })
        .reduce(
          (acc, { type, config, blockType }) => {
            const category = config.category;
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push({ type, config, blockType });
            return acc;
          },
          {} as Record<
            string,
            Array<{ type: string; config: any; blockType: "block" }>
          >,
        );
    }, [blocks, allowOnly, rootBlockType, t, debouncedSearchQuery]);

    return (
      <>
        <p className="mb-3 text-xs text-muted-foreground">
          {tBuilder("baseBuilder.blocks.panel.subtitle")}
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
        <BlocksPanelContent filteredBlocks={filteredBlocks} />
      </>
    );
  },
);
