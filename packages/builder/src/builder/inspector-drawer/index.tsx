import {
  useSelectedBlockId,
  useSelectedSidebarTab,
  useSelectedSlot,
  useSetSidebarTab,
} from "../../documents/editor/context";

import { useI18n } from "@hacado/i18n/client";
import { cn } from "@hacado/ui/cn";
import { Sheet, SheetContent } from "@hacado/ui/sheet";
import { useSidebar } from "@hacado/ui/sidebar";
import {
  ResponsiveTabsList,
  Tabs,
  TabsContent,
  TabsTrigger,
} from "@hacado/ui/tabs";
import { Paintbrush, SquareDashedMousePointer } from "lucide-react";
import React, { memo, useEffect, useMemo } from "react";
import {
  ConfigurationPanel,
  ConfigurationPanelTab,
} from "./configuration-panel";
import { StylesPanel, StylesPanelTab } from "./styles-panel";

export type SidebarTab = {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  content: React.ReactNode;
};

const SelectBlockListener: React.FC = memo(() => {
  const selectedBlockId = useSelectedBlockId();
  const selectedSlot = useSelectedSlot();
  const selectedTab = useSelectedSidebarTab();
  const setSidebarTab = useSetSidebarTab();
  useEffect(() => {
    // Leave host tabs (AI, settings, …) alone when the selection changes.
    if (
      selectedTab !== ConfigurationPanelTab &&
      selectedTab !== StylesPanelTab
    ) {
      return;
    }

    if (selectedBlockId || selectedSlot) {
      setSidebarTab(ConfigurationPanelTab);
    } else {
      setSidebarTab(StylesPanelTab);
    }
  }, [selectedBlockId, selectedSlot, selectedTab, setSidebarTab]);

  return null;
});

function InspectorTabs(props: {
  tabs: SidebarTab[];
  selectedTab: string;
  onTabChange: (value: string) => void;
}) {
  return (
    <div className="bg-background relative flex h-full w-full flex-col overflow-hidden border-b border-secondary">
      <div className="px-2 py-2">
        <Tabs
          defaultValue={props.tabs[0]?.value}
          value={props.selectedTab}
          onValueChange={props.onTabChange}
        >
          <SelectBlockListener />
          <div className="sticky top-0 z-10 w-full">
            <ResponsiveTabsList
              dontScrollIntoView
              variant="line"
              className="flex w-full flex-row items-center gap-2"
            >
              {props.tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-1 gap-2"
                >
                  {tab.icon} {tab.label}
                </TabsTrigger>
              ))}
            </ResponsiveTabsList>
          </div>
          <div className="max-h-[calc(100dvh-140px)] overflow-y-auto">
            {props.tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {tab.content}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * Builder inspector panel. Uses SidebarProvider open state (same as the
 * toolbar toggle) but owns its own layout — width collapse + overflow clip,
 * not offcanvas translate (which left a peeking sliver).
 */
export const InspectorDrawer: React.FC<{ extraTabs?: SidebarTab[] }> = ({
  extraTabs = [],
}) => {
  const selectedTab = useSelectedSidebarTab();
  const setSidebarTab = useSetSidebarTab();
  const { open, isMobile, openMobile, setOpenMobile } = useSidebar();
  const t = useI18n("builder");

  const allTabs = useMemo(
    () => [
      {
        value: StylesPanelTab,
        label: t("baseBuilder.inspector.styles"),
        icon: <Paintbrush size={16} />,
        content: <StylesPanel />,
      },
      {
        value: ConfigurationPanelTab,
        label: t("baseBuilder.inspector.inspect"),
        icon: <SquareDashedMousePointer size={16} />,
        content: <ConfigurationPanel />,
      },
      ...extraTabs,
    ],
    [t, extraTabs],
  );

  const onTabChange = (value: string) => setSidebarTab(value as any);
  const tabs = (
    <InspectorTabs
      tabs={allTabs}
      selectedTab={selectedTab}
      onTabChange={onTabChange}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="right"
          className="w-[var(--sidebar-width)] p-0 [&>button]:hidden"
        >
          {tabs}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        "relative hidden h-full shrink-0 overflow-hidden md:block",
        "transition-[width] duration-200 ease-linear",
        open ? "w-[var(--sidebar-width)]" : "w-0",
      )}
    >
      <aside className="flex h-full w-[var(--sidebar-width)] flex-col border-l border-secondary bg-background">
        {tabs}
      </aside>
    </div>
  );
};
