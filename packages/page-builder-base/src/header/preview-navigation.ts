import { KeyboardEvent, MouseEvent } from "react";

/** Prevents `<a href>` navigation while keeping other interactions (menus, drawers). */
export const blockPreviewLinkNavigation = (
  event: MouseEvent | KeyboardEvent,
) => {
  const target = event.target as HTMLElement | null;
  if (!target?.closest?.("a[href]")) return;
  if ("key" in event && event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
};
