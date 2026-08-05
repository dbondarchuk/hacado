"use client";

import { UploadedFile } from "@hacado/types";
import { cn, SidebarInset, SidebarProvider, useSidebar } from "@hacado/ui";
import { useEffect } from "react";
import { useCookies } from "react-cookie";
import { createPortal } from "react-dom";
import {
  EditorArgsContext,
  EditorStateProvider,
  useEditorStateErrors,
  useFullScreen,
  useResetDocument,
  useSetToggleInspectorDrawer,
} from "../documents/editor/context";
import { TEditorBlock, TEditorConfiguration } from "../documents/editor/core";
import { ReaderDocumentBlocksDictionary } from "../documents/reader/core";
import {
  BaseZodDictionary,
  EditorDocumentBlocksDictionary,
  TemplatesConfiguration,
} from "../documents/types";
import { InspectorDrawer, SidebarTab } from "./inspector-drawer";
import { TemplatePanel } from "./template-panel";
import { PortalProvider } from "./template-panel/portal-context";
import { BuilderToolbar } from "./template-panel/toolbar/builder-toolbar";

export type BuilderProps<T extends BaseZodDictionary> = {
  defaultValue?: TEditorConfiguration;
  onChange?: (value: TEditorConfiguration) => void;
  onIsValidChange?: (isValid: boolean) => void;
  args?: Record<string, any>;
  schemas: T;
  editorBlocks: EditorDocumentBlocksDictionary<T>;
  readerBlocks: ReaderDocumentBlocksDictionary<T>;
  templates?: TemplatesConfiguration;
  rootBlock: TEditorBlock;
  key?: string;
  extraTabs?: SidebarTab[];
  sidebarWidth?: number;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  getImageBlock?: (file: UploadedFile) => TEditorBlock;
};

const SIDEBAR_COOKIE_NAME = "builder-sidebar-open";

const BuilderSidebarListener = () => {
  const setToggleInspectorDrawer = useSetToggleInspectorDrawer();
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    setToggleInspectorDrawer(toggleSidebar);
  }, [toggleSidebar, setToggleInspectorDrawer]);

  return null;
};

const BuilderSidebarProvider = ({
  children,
  sidebarWidth,
}: {
  children: React.ReactNode;
  sidebarWidth: number;
}) => {
  const [cookies] = useCookies([SIDEBAR_COOKIE_NAME]);
  const defaultOpen = cookies[SIDEBAR_COOKIE_NAME]?.toString() === "true";

  return (
    <SidebarProvider
      cookieName={SIDEBAR_COOKIE_NAME}
      defaultOpen={defaultOpen}
      // suppressHydrationWarning for open/close state
      suppressHydrationWarning
      className={cn(
        "!bg-transparent h-full min-h-full w-full justify-center relative",
      )}
      style={
        {
          "--sidebar-width": `${sidebarWidth}rem`,
        } as React.CSSProperties
      }
    >
      <BuilderSidebarListener />
      {children}
    </SidebarProvider>
  );
};

const BuilderFullScreenProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const fullScreen = useFullScreen();

  const Element = (
    <div
      className={cn(
        "flex flex-col w-full h-full min-h-full",
        fullScreen && "fixed inset-0 z-50 pointer-events-auto bg-background",
      )}
      data-shimmer-no-children
    >
      {children}
    </div>
  );

  return fullScreen ? createPortal(Element, document.body) : Element;
};

const BuilderInternal = ({
  defaultValue,
  onChange,
  onIsValidChange,
  readerBlocks,
  args,
  key,
  extraTabs = [],
  sidebarWidth = 18,
  header,
  footer,
}: Omit<BuilderProps<any>, "editorBlocks" | "rootBlock" | "schemas">) => {
  const resetDocument = useResetDocument();
  const errors = useEditorStateErrors();
  const isValid = Object.keys(errors).length === 0;

  useEffect(() => {
    onIsValidChange?.(isValid);
  }, [isValid, onIsValidChange]);

  useEffect(() => resetDocument(defaultValue, onChange), [key]);

  return (
    <BuilderFullScreenProvider>
      <PortalProvider>
        <BuilderToolbar args={args} />
        <BuilderSidebarProvider sidebarWidth={sidebarWidth}>
          <SidebarInset
            className="flex flex-col w-full h-full min-h-full"
            asDiv
          >
            <TemplatePanel
              args={args}
              readerBlocks={readerBlocks}
              header={header}
              footer={footer}
            />
          </SidebarInset>
          <InspectorDrawer extraTabs={extraTabs} />
        </BuilderSidebarProvider>
      </PortalProvider>
    </BuilderFullScreenProvider>
  );
};

export const Builder = <T extends BaseZodDictionary>({
  args,
  defaultValue,
  editorBlocks,
  rootBlock,
  getImageBlock,
  schemas,
  ...rest
}: BuilderProps<T>) => {
  return (
    <EditorStateProvider
      blocks={editorBlocks}
      readerBlocks={rest.readerBlocks}
      templates={rest.templates}
      rootBlock={rootBlock}
      document={defaultValue}
      schemas={schemas}
      getImageBlock={getImageBlock}
    >
      <EditorArgsContext.Provider value={args || {}}>
        <BuilderInternal args={args} defaultValue={defaultValue} {...rest} />
      </EditorArgsContext.Provider>
    </EditorStateProvider>
  );
};
