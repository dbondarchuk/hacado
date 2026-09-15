import {
  MenuItemAppearanceOverride,
  MenuItemWithSubMenu,
  PageHeaderScrolledStyle,
  PageHeaderUpdateModel,
  resolvePageHeaderPosition,
} from "@hacado/types";

type ScrolledPickSource = PageHeaderUpdateModel & {
  scrolled?: PageHeaderScrolledStyle;
};

/** Prefer scrolled override when scrolled and the override is defined (null clears to default). */
export function pickScrolledValue<T>(
  rest: T | null | undefined,
  override: T | null | undefined,
  isScrolled: boolean,
): T | null | undefined {
  if (!isScrolled || override === undefined) {
    return rest;
  }
  return override;
}

export function resolveHeaderStyle(
  config: ScrolledPickSource,
  isScrolled: boolean,
) {
  const scrolled = config.scrolled;
  const position = resolvePageHeaderPosition(config);

  return {
    position,
    backgroundColor: pickScrolledValue(
      config.backgroundColor,
      scrolled?.backgroundColor,
      isScrolled,
    ),
    textColor: pickScrolledValue(
      config.textColor,
      scrolled?.textColor,
      isScrolled,
    ),
    hideName: pickScrolledValue(
      config.hideName,
      scrolled?.hideName,
      isScrolled,
    ),
    showLogo: pickScrolledValue(
      config.showLogo,
      scrolled?.showLogo,
      isScrolled,
    ),
    logoSize: pickScrolledValue(
      config.logoSize,
      scrolled?.logoSize,
      isScrolled,
    ),
    logoNameFontSize: pickScrolledValue(
      config.logoNameFontSize,
      scrolled?.logoNameFontSize,
      isScrolled,
    ),
    logoNameFontWeight: pickScrolledValue(
      config.logoNameFontWeight,
      scrolled?.logoNameFontWeight,
      isScrolled,
    ),
    customLogoText: pickScrolledValue(
      config.customLogoText,
      scrolled?.customLogoText,
      isScrolled,
    ),
    shadow: pickScrolledValue(config.shadow, scrolled?.shadow, isScrolled),
    backdropBlur: pickScrolledValue(
      config.backdropBlur,
      scrolled?.backdropBlur,
      isScrolled,
    ),
  };
}

function applyMenuItemAppearanceOverride<T extends MenuItemWithSubMenu>(
  item: T,
  override: MenuItemAppearanceOverride | undefined,
): T {
  if (!override) {
    return item;
  }

  const merged = { ...item } as T & Record<string, unknown>;

  for (const key of Object.keys(
    override,
  ) as (keyof MenuItemAppearanceOverride)[]) {
    const value = override[key];
    if (value === undefined) {
      continue;
    }

    // Additional classes append to existing classes (null keeps existing only).
    if (key === "className") {
      if (value === null) {
        continue;
      }

      const rest =
        "className" in item && typeof item.className === "string"
          ? item.className
          : "";
      const combined = [rest, value].filter(Boolean).join(" ").trim();
      merged.className = combined || undefined;
      continue;
    }

    merged[key as string] = value;
  }

  return merged;
}

export type MergeMenuItemAppearanceOptions = {
  isScrolled?: boolean;
  isMobile?: boolean;
};

/**
 * Apply mobile then scrolled appearance overrides (scrolled wins on conflicts).
 * Scrolled appearance also applies on mobile viewports so drawer / mobile chrome
 * items match the scrolled look (e.g. reverse overlay text on a solid drawer).
 */
export function mergeMenuItemAppearance<T extends MenuItemWithSubMenu>(
  item: T,
  isScrolledOrOptions: boolean | MergeMenuItemAppearanceOptions = false,
  maybeIsMobile?: boolean,
): T {
  const options: MergeMenuItemAppearanceOptions =
    typeof isScrolledOrOptions === "boolean"
      ? { isScrolled: isScrolledOrOptions, isMobile: maybeIsMobile }
      : isScrolledOrOptions;

  if (item.type === "spacer") {
    return item;
  }

  let result = item;

  if (options.isMobile && "mobile" in item) {
    result = applyMenuItemAppearanceOverride(
      result,
      item.mobile as MenuItemAppearanceOverride | undefined,
    );
  }

  const applyScrolled = Boolean(options.isScrolled || options.isMobile);
  if (applyScrolled && "scrolled" in item) {
    result = applyMenuItemAppearanceOverride(
      result,
      item.scrolled as MenuItemAppearanceOverride | undefined,
    );
  }

  return result;
}
