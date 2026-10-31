import {
  MenuItemAppearanceOverride,
  MenuItemWithSubMenu,
} from "@hacado/types/configuration/styling";
import {
  PageHeaderScrolledStyle,
  PageHeaderUpdateModel,
  resolvePageHeaderPosition,
} from "@hacado/types/pages";

type ScrolledPickSource = PageHeaderUpdateModel & {
  scrolled?: PageHeaderScrolledStyle;
  mobile?: PageHeaderScrolledStyle & {
    scrolled?: PageHeaderScrolledStyle;
  };
};

function headerLogoOverride(value: string | null | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

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

/**
 * Desktop uses default, then on-scroll.
 * Mobile rest overrides the default. Mobile on-scroll overrides that.
 * When mobile on-scroll is unset, a set mobile rest value stays;
 * otherwise the desktop on-scroll value is used.
 */
export function pickHeaderAppearanceValue<T>(
  rest: T | null | undefined,
  scrolled: T | null | undefined,
  mobile: T | null | undefined,
  mobileScrolled: T | null | undefined,
  isScrolled: boolean,
  isMobile: boolean,
): T | null | undefined {
  if (!isMobile) {
    return pickScrolledValue(rest, scrolled, isScrolled);
  }

  const atRest = mobile === undefined ? rest : mobile;
  if (!isScrolled) {
    return atRest;
  }

  if (mobileScrolled !== undefined) {
    return mobileScrolled;
  }

  if (mobile === undefined && scrolled !== undefined) {
    return scrolled;
  }

  return atRest;
}

export function resolveHeaderStyle(
  config: ScrolledPickSource,
  isScrolled: boolean,
  isMobile = false,
) {
  const scrolled = config.scrolled;
  const mobile = config.mobile;
  const mobileScrolled = mobile?.scrolled;
  const pick = <T>(
    rest: T | null | undefined,
    scrolledValue: T | null | undefined,
    mobileValue: T | null | undefined,
    mobileScrolledValue: T | null | undefined,
  ) =>
    pickHeaderAppearanceValue(
      rest,
      scrolledValue,
      mobileValue,
      mobileScrolledValue,
      isScrolled,
      isMobile,
    );

  const position = resolvePageHeaderPosition(config);

  return {
    position,
    backgroundColor: pick(
      config.backgroundColor,
      scrolled?.backgroundColor,
      mobile?.backgroundColor,
      mobileScrolled?.backgroundColor,
    ),
    textColor: pick(
      config.textColor,
      scrolled?.textColor,
      mobile?.textColor,
      mobileScrolled?.textColor,
    ),
    hideName: pick(
      config.hideName,
      scrolled?.hideName,
      mobile?.hideName,
      mobileScrolled?.hideName,
    ),
    showLogo: pick(
      config.showLogo,
      scrolled?.showLogo,
      mobile?.showLogo,
      mobileScrolled?.showLogo,
    ),
    logo: pick(
      headerLogoOverride(config.logo),
      headerLogoOverride(scrolled?.logo),
      headerLogoOverride(mobile?.logo),
      headerLogoOverride(mobileScrolled?.logo),
    ),
    logoSize: pick(
      config.logoSize,
      scrolled?.logoSize,
      mobile?.logoSize,
      mobileScrolled?.logoSize,
    ),
    logoNameFontSize: pick(
      config.logoNameFontSize,
      scrolled?.logoNameFontSize,
      mobile?.logoNameFontSize,
      mobileScrolled?.logoNameFontSize,
    ),
    logoNameFontWeight: pick(
      config.logoNameFontWeight,
      scrolled?.logoNameFontWeight,
      mobile?.logoNameFontWeight,
      mobileScrolled?.logoNameFontWeight,
    ),
    customLogoText: pick(
      config.customLogoText,
      scrolled?.customLogoText,
      mobile?.customLogoText,
      mobileScrolled?.customLogoText,
    ),
    shadow: pick(
      config.shadow,
      scrolled?.shadow,
      mobile?.shadow,
      mobileScrolled?.shadow,
    ),
    backdropBlur: pick(
      config.backdropBlur,
      scrolled?.backdropBlur,
      mobile?.backdropBlur,
      mobileScrolled?.backdropBlur,
    ),
  };
}

function hasMenuLabel(value: unknown) {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return false;
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

    if (key === "useDifferentLabel" || key === "label") {
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

  if (override.useDifferentLabel && hasMenuLabel(override.label)) {
    merged.label = override.label;
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
