import { useDraggable } from "@dnd-kit/react";
import { AllKeys, useI18n } from "@hacado/i18n/client";
import {
  Button,
  cn,
  genericMemo,
  Input,
  ScrollArea,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  useDebounce,
} from "@hacado/ui";
import { GripVertical, Layers, Search, X } from "lucide-react";
import { memo, useMemo, useState } from "react";
import {
  useBlocks,
  useRootBlockType,
  useTemplates,
} from "../../../documents/editor/context";
import { BaseZodDictionary } from "../../../documents/types";

type BlocksPanelProps<T extends BaseZodDictionary = any> = {
  allowOnly?: (keyof T)[];
};
type DraggableBlockItemProps = {
  blockType: string;
  blockConfig: any;
  isTemplate: boolean;
};

const DraggableBlockItem: React.FC<DraggableBlockItemProps> = memo(
  ({ blockType, blockConfig, isTemplate }) => {
    const templates = useTemplates();
    const t = useI18n();

    const templateBlock = useMemo(() => {
      if (!isTemplate) return null;
      const template = templates?.[blockType];
      if (template) {
        return template.getBlock(t);
      }
      return null;
    }, [blockType, templates, isTemplate, t]);

    const { isDragging, ref } = useDraggable({
      id: `template-${blockType}`,
      type: templateBlock?.type ?? blockType,
      feedback: "clone",

      data: {
        type: isTemplate ? "composite-template" : "block-template",
        blockType,
        blockConfig,
      },
    });

    //  const { isDragging, ref } = useSortable({
    //    id: `template-${blockType}`,
    //    index: 0,
    //    group: "blocks-panel",
    //    type: blockType,
    //    feedback: "clone",
    //    accept: () => false,
    //    transition: {
    //      duration: 200,
    //      easing: "cubic-bezier(0.2, 0, 0, 1)",
    //    },
    //    collisionDetector: createDynamicCollisionDetector("dynamic"),

    //    data: {
    //      type: "block-template",
    //      blockType,
    //      blockConfig,
    //    },
    //  });

    return (
      <>
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg border border-border bg-background hover:bg-accent hover:text-accent-foreground cursor-grab active:cursor-grabbing transition-colors",
            isDragging ? "opacity-50" : "!opacity-100",
          )}
        >
          <div className="flex-shrink-0 text-muted-foreground">
            {blockConfig.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm w-full font-medium inline-flex items-center gap-2">
              <span className="truncate flex-1">
                {t(blockConfig.displayName)}
              </span>
              {isTemplate ? (
                <TooltipResponsive>
                  <TooltipResponsiveTrigger>
                    <Layers className="size-3" />
                  </TooltipResponsiveTrigger>
                  <TooltipResponsiveContent>
                    {t("builder.baseBuilder.blocks.panel.template")}
                  </TooltipResponsiveContent>
                </TooltipResponsive>
              ) : (
                ""
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {t(blockConfig.category)}
            </div>
          </div>
          <div className="flex-shrink-0 text-muted-foreground">
            <GripVertical fontSize="small" />
          </div>
        </div>
      </>
    );
  },
);

const BlocksPanelContent = memo(
  ({
    filteredBlocks,
  }: {
    filteredBlocks: Record<
      string,
      Array<{ type: string; config: any; blockType: "block" | "template" }>
    >;
  }) => {
    const tBuilder = useI18n("builder");
    const t = useI18n();

    return (
      <ScrollArea className="py-2 pr-2 h-[calc(100vh-400px)] min-h-60">
        {Object.keys(filteredBlocks).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {tBuilder("baseBuilder.blocks.noResultsFound")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredBlocks).map(([category, blockList]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {t(category as AllKeys)}
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {blockList.map(({ type, config, blockType }) => (
                    <DraggableBlockItem
                      key={type}
                      blockType={type}
                      isTemplate={blockType === "template"}
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
    const templates = useTemplates();
    const rootBlockType = useRootBlockType();

    const filteredBlocks = useMemo(() => {
      const allBlocks = [
        ...Object.entries(blocks).map(([type, config]) => ({
          type,
          config,
          blockType: "block" as const,
        })),
        ...Object.entries(templates || {}).map(([type, config]) => ({
          type,
          config,
          blockType: "template" as const,
        })),
      ];

      return allBlocks
        .filter(({ type, config, blockType }) => {
          // Filter by allowOnly if specified
          if (allowOnly) {
            if (Array.isArray(allowOnly)) {
              if (!allowOnly.includes(type as keyof T)) return false;
            } else {
              if (type !== allowOnly) return false;
            }
          }

          // Don't show root block type
          if (rootBlockType === type) return false;

          if (blockType === "block" && config.hideInBlocksPanel) {
            return false;
          }

          if (debouncedSearchQuery.trim()) {
            const query = debouncedSearchQuery.trim();
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
            Array<{
              type: string;
              config: any;
              blockType: "block" | "template";
            }>
          >,
        );
    }, [blocks, allowOnly, rootBlockType, tBuilder, debouncedSearchQuery]);

    return (
      <>
        <p className="text-xs text-muted-foreground mb-3">
          {tBuilder("baseBuilder.blocks.panel.subtitle")}
        </p>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tBuilder("baseBuilder.blocks.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2"
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
