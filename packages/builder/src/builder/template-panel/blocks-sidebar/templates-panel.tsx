"use client";

import { AllKeys, type I18nFn, useI18n } from "@hacado/i18n/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  ScrollArea,
  useDebounce,
} from "@hacado/ui";
import { Search, X } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import {
  useDispatchAction,
  useDocument,
  useTemplates,
} from "../../../documents/editor/context";
import {
  isLayoutTemplate,
  isSectionTemplate,
  type LayoutTemplateDefinition,
  type TemplateDefinition,
} from "../../../documents/types";
import { DraggableBlockItem } from "./draggable-block-item";

type TemplatePanelMode = "section" | "layout";

const TemplatesPanelContent = memo(
  ({
    filteredTemplates,
    onApplyLayout,
  }: {
    filteredTemplates: Record<
      string,
      Array<{ type: string; config: TemplateDefinition }>
    >;
    onApplyLayout?: (type: string) => void;
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
                        onApplyLayout={
                          isLayoutTemplate(config) && onApplyLayout
                            ? () => onApplyLayout(type)
                            : undefined
                        }
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

function applyLayoutToDocument(
  document: ReturnType<typeof useDocument>,
  template: LayoutTemplateDefinition,
  t: I18nFn<undefined, undefined>,
  dispatchAction: ReturnType<typeof useDispatchAction>,
) {
  const children = template.getBlocks(t);
  const nextDocument = {
    ...document,
    data: {
      ...document.data,
      children,
    },
  };
  dispatchAction({
    type: "document",
    value: { document: nextDocument },
  });
}

function useTemplateEntries(mode: TemplatePanelMode) {
  const t = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const templates = useTemplates();

  const filteredTemplates = useMemo(() => {
    const entries = Object.entries(templates || {}).filter(([, config]) =>
      mode === "layout" ? isLayoutTemplate(config) : isSectionTemplate(config),
    );

    return entries
      .filter(([type, config]) => {
        if (!debouncedSearchQuery.trim()) return true;
        const query = debouncedSearchQuery.trim().toLocaleLowerCase();
        const name = config.displayName.toLocaleLowerCase();
        const displayName = t(config.displayName).toLocaleLowerCase();
        const category = t(config.category).toLocaleLowerCase();
        const typeLower = type.toLocaleLowerCase();
        const packId = isLayoutTemplate(config)
          ? config.packId.toLocaleLowerCase()
          : "";
        const layoutKind = isLayoutTemplate(config)
          ? config.layoutKind.toLocaleLowerCase()
          : "";

        return (
          name.includes(query) ||
          displayName.includes(query) ||
          category.includes(query) ||
          typeLower.includes(query) ||
          packId.includes(query) ||
          layoutKind.includes(query)
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
  }, [templates, t, debouncedSearchQuery, mode]);

  return { searchQuery, setSearchQuery, filteredTemplates };
}

function TemplateSearchField({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}) {
  const tBuilder = useI18n("builder");
  return (
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
  );
}

export const TemplatesPanel = memo(() => {
  const tBuilder = useI18n("builder");
  const { searchQuery, setSearchQuery, filteredTemplates } =
    useTemplateEntries("section");

  return (
    <>
      <p className="mb-3 text-xs text-muted-foreground">
        {tBuilder("baseBuilder.blocks.templates.subtitle")}
      </p>
      <TemplateSearchField
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <TemplatesPanelContent filteredTemplates={filteredTemplates} />
    </>
  );
});

TemplatesPanel.displayName = "TemplatesPanel";

export const LayoutsPanel = memo(() => {
  const tBuilder = useI18n("builder");
  const t = useI18n();
  const templates = useTemplates();
  const document = useDocument();
  const dispatchAction = useDispatchAction();
  const { searchQuery, setSearchQuery, filteredTemplates } =
    useTemplateEntries("layout");
  const [pendingLayoutType, setPendingLayoutType] = useState<string | null>(
    null,
  );

  const applyLayout = useCallback(
    (type: string) => {
      const template = templates?.[type];
      if (!template || !isLayoutTemplate(template)) return;

      const children = document?.data?.children;
      const hasContent = Array.isArray(children) && children.length > 0;
      if (hasContent) {
        setPendingLayoutType(type);
        return;
      }

      applyLayoutToDocument(
        document,
        template,
        t as I18nFn<undefined, undefined>,
        dispatchAction,
      );
    },
    [templates, document, t, dispatchAction],
  );

  const confirmApplyLayout = useCallback(() => {
    if (!pendingLayoutType) return;
    const template = templates?.[pendingLayoutType];
    if (template && isLayoutTemplate(template)) {
      applyLayoutToDocument(
        document,
        template,
        t as I18nFn<undefined, undefined>,
        dispatchAction,
      );
    }
    setPendingLayoutType(null);
  }, [pendingLayoutType, templates, document, t, dispatchAction]);

  return (
    <>
      <p className="mb-3 text-xs text-muted-foreground">
        {tBuilder("baseBuilder.blocks.layouts.subtitle")}
      </p>
      <TemplateSearchField
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <TemplatesPanelContent
        filteredTemplates={filteredTemplates}
        onApplyLayout={applyLayout}
      />

      <AlertDialog
        open={pendingLayoutType != null}
        onOpenChange={(open) => {
          if (!open) setPendingLayoutType(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tBuilder("baseBuilder.blocks.layouts.replaceTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tBuilder("baseBuilder.blocks.layouts.replaceDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {tBuilder("baseBuilder.blocks.layouts.replaceCancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmApplyLayout}>
              {tBuilder("baseBuilder.blocks.layouts.replaceConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

LayoutsPanel.displayName = "LayoutsPanel";
