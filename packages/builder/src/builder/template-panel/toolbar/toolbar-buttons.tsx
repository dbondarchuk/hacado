"use client";

import { Fragment, createContext, useContext, useMemo } from "react";

/**
 * Built-in toolbar groups that accept extra buttons.
 *
 * - history: undo / redo
 * - blockMove: move up, down, and out
 * - clipboard: copy / paste
 * - blockActions: clone / delete
 * - block: the selected block's own toolbar
 * - viewport: screen-size picker
 * - errors: validation status
 * - view: preview, full screen, and animation
 * - panels: context, blocks panel, and sidebar
 */
export type ToolbarSection =
  | "history"
  | "blockMove"
  | "clipboard"
  | "blockActions"
  | "block"
  | "viewport"
  | "errors"
  | "view"
  | "panels";

export type ToolbarButtonInjection = {
  id: string;
  section: ToolbarSection;
  /** `start` renders before the section's own buttons. Defaults to `end`. */
  position?: "start" | "end";
  children: React.ReactNode;
};

const EMPTY_TOOLBAR_BUTTONS: ToolbarButtonInjection[] = [];

const ToolbarButtonsContext = createContext<ToolbarButtonInjection[]>(
  EMPTY_TOOLBAR_BUTTONS,
);

export function ToolbarButtonsProvider({
  buttons,
  children,
}: {
  buttons?: ToolbarButtonInjection[];
  children: React.ReactNode;
}) {
  return (
    <ToolbarButtonsContext.Provider value={buttons ?? EMPTY_TOOLBAR_BUTTONS}>
      {children}
    </ToolbarButtonsContext.Provider>
  );
}

function useSectionButtons(section: ToolbarSection, position: "start" | "end") {
  const buttons = useContext(ToolbarButtonsContext);

  return useMemo(
    () =>
      buttons.filter(
        (button) =>
          button.section === section && (button.position ?? "end") === position,
      ),
    [buttons, section, position],
  );
}

export function ToolbarSectionButtons({
  section,
  position,
}: {
  section: ToolbarSection;
  position: "start" | "end";
}) {
  const buttons = useSectionButtons(section, position);

  if (buttons.length === 0) {
    return null;
  }

  return (
    <>
      {buttons.map((button) => (
        <Fragment key={button.id}>{button.children}</Fragment>
      ))}
    </>
  );
}

export function useHasToolbarSectionButtons(section: ToolbarSection) {
  const buttons = useContext(ToolbarButtonsContext);

  return useMemo(
    () => buttons.some((button) => button.section === section),
    [buttons, section],
  );
}
