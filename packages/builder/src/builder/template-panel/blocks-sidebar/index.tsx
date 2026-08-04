"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  cn,
} from "@timelish/ui";
import { Blocks, ListTree } from "lucide-react";
import { memo } from "react";
import { useShowBlocksPanel } from "../../../documents/editor/context";
import { BaseZodDictionary } from "../../../documents/types";
import { BlocksPanel } from "./blocks-panel";
import { OutlinePanel } from "./outline-panel";

type BlocksPanelProps<T extends BaseZodDictionary = any> = {
  className?: string;
  allowOnly?: (keyof T)[];
};

export const BlocksSidebar = memo(
  <T extends BaseZodDictionary = any>({
    className,
    allowOnly,
  }: BlocksPanelProps<T>) => {
    const t = useI18n("builder");
    const show = useShowBlocksPanel();

    return (
      <div
        className={cn(
          "w-0 opacity-0 border-r bg-background transition-all flex flex-col",
          "max-h-[calc(100vh-250px)] min-h-72",
          show && "w-80 opacity-100",
          className,
        )}
      >
        <Accordion
          type="single"
          defaultValue="blocks"
          className="flex-1 h-full flex flex-col justify-between"
        >
          {/* Blocks Section */}
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

          {/* Document Outline Section */}
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
      </div>
    );
  },
);
