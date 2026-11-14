const EXTRA_TOP_PADDING = 8;

/** Positions a mention dropdown so it stays within the viewport horizontally. */
export function positionMentionDropdown(
  dropdown: HTMLElement,
  caret: { left: number; top: number; height: number },
  options: {
    mode: "absolute" | "fixed";
    anchor: HTMLElement;
    padding?: number;
  },
) {
  const padding = options.padding ?? 8;
  const { mode, anchor } = options;
  const view = anchor.ownerDocument.defaultView ?? window;
  const scrollLeft = "scrollLeft" in anchor ? (anchor.scrollLeft as number) : 0;

  dropdown.classList.remove("hidden");
  dropdown.style.top = `${caret.top + caret.height + EXTRA_TOP_PADDING}px`;
  dropdown.style.left = `${caret.left}px`;

  const width = dropdown.offsetWidth;
  if (!width) return;

  const viewportWidth = view.innerWidth;
  const caretViewportX =
    mode === "fixed"
      ? caret.left
      : anchor.getBoundingClientRect().left + caret.left - scrollLeft;

  const spaceRight = viewportWidth - caretViewportX - padding;
  const spaceLeft = caretViewportX - padding;

  let left = caret.left;

  // Prefer opening to the right; flip left only when right is too tight and left has more room.
  if (width > spaceRight && spaceLeft > spaceRight) {
    left = caret.left - width;
  }

  let viewportLeft =
    mode === "fixed"
      ? left
      : anchor.getBoundingClientRect().left + left - scrollLeft;

  if (viewportLeft + width > viewportWidth - padding) {
    left -= viewportLeft + width - (viewportWidth - padding);
    viewportLeft = viewportWidth - padding - width;
  }

  if (viewportLeft < padding) {
    left += padding - viewportLeft;
  }

  dropdown.style.left = `${left}px`;
}
