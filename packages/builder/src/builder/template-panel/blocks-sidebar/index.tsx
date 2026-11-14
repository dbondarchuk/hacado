"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@hacado/ui/accordion";
import { cn } from "@hacado/ui/cn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hacado/ui/tabs";
import {
  AppWindow,
  Blocks,
  Layers,
  LayoutTemplate,
  ListTree,
} from "lucide-react";
import { memo, useMemo } from "react";
import {
  useBlocksSidebarTab,
  useEnableModalsView,
  useSetBlocksSidebarTab,
  useShowBlocksPanel,
  useTemplates,
} from "../../../documents/editor/context";
import {
  BaseZodDictionary,
  isLayoutTemplate,
  isSectionTemplate,
} from "../../../documents/types";
import { BlocksPanel } from "./blocks-panel";
import { OutlinePanel } from "./outline-panel";
import { LayoutsPanel, TemplatesPanel } from "./templates-panel";

type BlocksSidebarProps<T extends BaseZodDictionary = any> = {
  className?: string;
  allowOnly?: (keyof T)[];
  modalsPanel?: React.ReactNode;
};

const SidebarAccordion = memo(
  ({
    allowOnly,
    showLayouts,
    modalsSection,
    defaultOpen,
  }: {
    allowOnly?: string[];
    showLayouts: boolean;
    modalsSection?: React.ReactNode;
    defaultOpen: string;
  }) => {
    const t = useI18n("builder");
    const templates = useTemplates();

    const { showSectionTemplates, showLayoutTemplates } = useMemo(() => {
      const entries = Object.values(templates || {});
      return {
        showSectionTemplates: entries.some(isSectionTemplate),
        showLayoutTemplates: entries.some(isLayoutTemplate),
      };
    }, [templates]);

    return (
      <Accordion
        type="single"
        defaultValue={defaultOpen}
        className="flex w-full flex-col justify-between"
      >
        {modalsSection ? (
          <AccordionItem value="modals" className="border-none">
            <AccordionTrigger className="px-4 py-2 hover:no-underline [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-2">
                <AppWindow className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t("baseBuilder.modals.title")}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-2">
              {modalsSection}
            </AccordionContent>
          </AccordionItem>
        ) : null}

        <AccordionItem value="blocks" className="border-none">
          <AccordionTrigger className="px-4 py-2 hover:no-underline [&[data-state=open]>svg]:rotate-180">
            <div className="flex items-center gap-2">
              <Blocks className="h-4 w-4" />
              <span className="text-sm font-medium">
                {t("baseBuilder.blocks.panel.title")}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-2">
            <BlocksPanel allowOnly={allowOnly} />
          </AccordionContent>
        </AccordionItem>

        {showSectionTemplates ? (
          <AccordionItem value="templates" className="border-none">
            <AccordionTrigger className="px-4 py-2 hover:no-underline [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t("baseBuilder.blocks.templates.title")}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-2">
              <TemplatesPanel />
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {showLayouts && showLayoutTemplates ? (
          <AccordionItem value="layouts" className="border-none">
            <AccordionTrigger className="px-4 py-2 hover:no-underline [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t("baseBuilder.blocks.layouts.title")}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-2">
              <LayoutsPanel />
            </AccordionContent>
          </AccordionItem>
        ) : null}

        <AccordionItem value="outline" className="border-none">
          <AccordionContent className="px-4 pb-2">
            <OutlinePanel />
          </AccordionContent>
          <AccordionTrigger className="px-4 py-2 hover:no-underline [&[data-state=open]>svg]:rotate-180">
            <div className="flex items-center gap-2">
              <ListTree className="h-4 w-4" />
              <span className="text-sm font-medium">
                {t("baseBuilder.blocks.outline.title")}
              </span>
            </div>
          </AccordionTrigger>
        </AccordionItem>
      </Accordion>
    );
  },
);

export const BlocksSidebar = memo(
  <T extends BaseZodDictionary = any>({
    className,
    allowOnly,
    modalsPanel,
  }: BlocksSidebarProps<T>) => {
    const t = useI18n("builder");
    const show = useShowBlocksPanel();
    const enableModalsView = useEnableModalsView();
    const blocksSidebarTab = useBlocksSidebarTab();
    const setBlocksSidebarTab = useSetBlocksSidebarTab();

    const shellClassName = cn(
      "w-0 opacity-0 border-r bg-background transition-all flex flex-col",
      "max-h-[calc(100vh-250px)] min-h-72",
      show && "w-80 opacity-100",
      className,
    );

    if (!enableModalsView || !modalsPanel) {
      return (
        <div className={cn(shellClassName, "overflow-y-auto")}>
          <SidebarAccordion
            allowOnly={allowOnly as string[] | undefined}
            showLayouts
            defaultOpen="blocks"
          />
        </div>
      );
    }

    return (
      <div className={cn(shellClassName, "overflow-hidden")}>
        <Tabs
          value={blocksSidebarTab}
          onValueChange={(value) =>
            setBlocksSidebarTab(value as "layout" | "modals")
          }
          className="flex h-full min-h-0 flex-col"
        >
          <div className="shrink-0 px-3 pt-0">
            <TabsList variant="line" className="w-full">
              <TabsTrigger value="layout" className="flex-1">
                {t("baseBuilder.modals.tabs.layout")}
              </TabsTrigger>
              <TabsTrigger value="modals" className="flex-1">
                {t("baseBuilder.modals.tabs.modals")}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="layout"
            className="mt-0 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden"
            forceMount
          >
            <SidebarAccordion
              allowOnly={allowOnly as string[] | undefined}
              showLayouts
              defaultOpen="blocks"
            />
          </TabsContent>
          <TabsContent
            value="modals"
            className="mt-0 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden"
            forceMount
          >
            <SidebarAccordion
              allowOnly={allowOnly as string[] | undefined}
              showLayouts={false}
              modalsSection={modalsPanel}
              defaultOpen="modals"
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  },
);
