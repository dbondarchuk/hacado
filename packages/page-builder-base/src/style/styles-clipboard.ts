"use client";

import { useCallback, useSyncExternalStore } from "react";
import { StyleValue } from "./css-renderer";
import { BaseStyleDictionary, StyleDictionary } from "./types";

const STORAGE_KEY = "hacado:page-builder-copied-styles";

export type CopiedBlockStyles = StyleValue<BaseStyleDictionary>;

const listeners = new Set<() => void>();

const readFromSessionStorage = (): CopiedBlockStyles | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed as CopiedBlockStyles;
  } catch {
    return null;
  }
};

const writeToSessionStorage = (styles: CopiedBlockStyles | null) => {
  if (typeof window === "undefined") return;

  if (styles && Object.keys(styles).length > 0) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(styles));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
};

let copiedStyles: CopiedBlockStyles | null = readFromSessionStorage();

const notify = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    copiedStyles = readFromSessionStorage();
    notify();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
};

const getSnapshot = () => copiedStyles;

export const cloneBlockStyles = <T extends BaseStyleDictionary>(
  styles: StyleValue<T> | null | undefined,
): StyleValue<T> => JSON.parse(JSON.stringify(styles ?? {})) as StyleValue<T>;

export const filterStylesForTarget = <T extends BaseStyleDictionary>(
  sourceStyles: CopiedBlockStyles | null | undefined,
  availableStyles: StyleDictionary<T>,
): StyleValue<T> => {
  if (!sourceStyles) return {} as StyleValue<T>;

  const availableKeys = new Set(Object.keys(availableStyles));
  const filtered = {} as StyleValue<T>;
  const cloned = cloneBlockStyles(sourceStyles);

  for (const [styleName, variants] of Object.entries(cloned)) {
    if (!availableKeys.has(styleName) || !variants?.length) continue;
    filtered[styleName as keyof T] = variants as StyleValue<T>[keyof T];
  }

  return filtered;
};

export const setCopiedBlockStyles = (styles: CopiedBlockStyles | null) => {
  copiedStyles = styles;
  writeToSessionStorage(styles);
  notify();
};

export const useCopiedBlockStyles = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => null);

export const useStylesClipboard = () => {
  const activeCopiedStyles = useCopiedBlockStyles();

  const hasCopiedStyles =
    activeCopiedStyles !== null &&
    Object.keys(activeCopiedStyles).length > 0;

  const copyStyles = useCallback(
    (styles: StyleValue<BaseStyleDictionary> | null | undefined) => {
      setCopiedBlockStyles(cloneBlockStyles(styles));
    },
    [],
  );

  const getPasteableStyles = useCallback(
    <T extends BaseStyleDictionary>(availableStyles: StyleDictionary<T>) =>
      filterStylesForTarget(activeCopiedStyles, availableStyles),
    [activeCopiedStyles],
  );

  return {
    hasCopiedStyles,
    copyStyles,
    getPasteableStyles,
  };
};
