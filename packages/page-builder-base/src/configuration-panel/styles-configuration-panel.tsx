"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { BaseBlockProps as BaseBlockPropsType } from "@timelish/builder";
import { AllKeys, useI18n } from "@timelish/i18n/client";
import React, { useCallback, useMemo, useState } from "react";
import * as z from "zod";
import { Shortcuts } from "../shortcuts";
import { Shortcut } from "../shortcuts/types";
import { DefaultCSSProperties, StyleValue } from "../style/css-renderer";
import {
  BaseStyleDictionary,
  StyleCategory,
  StyleDefinition,
  StyleDictionary,
  StyleVariant,
} from "../style/types";
import {
  CSSPreview,
  SearchBar,
  StyleCategoryComponent,
  StylesClipboardToolbar,
} from "./components";
import { BaseBlockProps } from "./components/base-block-props";

interface StylesConfigurationPanelProps<T extends BaseStyleDictionary> {
  styles: StyleValue<T>;
  onStylesChange: (styles: StyleValue<T>) => void;
  availableStyles: StyleDictionary<T>;
  defaultProperties?: DefaultCSSProperties<T>;
  shortcuts?: Shortcut<T>[];
  props?: any;
  onPropsChange?: (props: any) => void;
  base?: BaseBlockPropsType;
  onBaseChange?: (base: BaseBlockPropsType) => void;
  children?: React.ReactNode;
}

export const StylesConfigurationPanel = <T extends BaseStyleDictionary>({
  styles,
  onStylesChange,
  availableStyles,
  defaultProperties,
  shortcuts,
  props,
  onPropsChange,
  children,
  base,
  onBaseChange,
}: StylesConfigurationPanelProps<T>) => {
  const t = useI18n();
  const [searchTerm, setSearchTerm] = useState("");

  // Helper function to safely translate categories
  const getCategoryLabel = (category: StyleCategory) => {
    const categoryLabel =
      `builder.pageBuilder.styles.categories.${category}` as AllKeys;
    return t.has(categoryLabel) ? t(categoryLabel) : category;
  };

  // Group styles by category and filter to only show categories with active styles
  const stylesByCategory = useMemo(
    () =>
      Object.values(availableStyles).reduce(
        (acc, style: StyleDefinition<T[keyof T]>) => {
          if (!acc[style.category]) {
            acc[style.category] = [];
          }
          acc[style.category].push(style);
          return acc;
        },
        {},
      ) as Record<StyleCategory, StyleDefinition<T[keyof T]>[]>,
    [availableStyles],
  );

  // Filter to only show categories that have active styles
  const activeCategories = useMemo(
    () =>
      Object.entries(stylesByCategory) as [
        StyleCategory,
        StyleDefinition<T[keyof T]>[],
      ][],
    [stylesByCategory],
  );

  // Filter categories by search term
  const filteredCategories = useMemo(
    () =>
      activeCategories.filter(([category, categoryStyles]) => {
        if (searchTerm) {
          const categoryLabel = getCategoryLabel(category);
          return (
            categoryLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
            categoryStyles.some(
              (style) =>
                t(style.label)
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                style.name.toLowerCase().includes(searchTerm.toLowerCase()),
            )
          );
        }
        return true;
      }),
    [activeCategories, searchTerm],
  );

  const addStyle = useCallback(
    (style: StyleDefinition<T[keyof T]>) => {
      const newStyles = {
        ...styles,
        [style.name]: [
          {
            breakpoint: [],
            state: [],
            value: style.defaultValue,
          },
        ],
      };
      onStylesChange(newStyles);
    },
    [onStylesChange, styles],
  );

  const updateStyle = useCallback(
    (styleName: keyof T, variantIndex: number, value: z.infer<T[keyof T]>) => {
      const currentVariants = styles[styleName] || [];
      const newVariants = [...currentVariants];
      newVariants[variantIndex] = {
        ...newVariants[variantIndex],
        value,
      };

      const newStyles: StyleValue<T> = {
        ...styles,
        [styleName]: newVariants,
      };
      onStylesChange(newStyles);
    },
    [onStylesChange, styles],
  );

  const deleteStyle = useCallback(
    (styleName: keyof T) => {
      const newStyles: StyleValue<T> = { ...styles };
      delete newStyles[styleName];
      onStylesChange(newStyles);
    },
    [onStylesChange, styles],
  );

  const addVariant = useCallback(
    (styleName: keyof T) => {
      const currentVariants = styles[styleName] || [];
      const newVariants = [
        ...currentVariants,
        {
          breakpoint: [],
          state: [],
          value: availableStyles[styleName].defaultValue,
        },
      ];

      const newStyles: StyleValue<T> = {
        ...styles,
        [styleName]: newVariants,
      };
      onStylesChange(newStyles);
    },
    [onStylesChange, styles, availableStyles],
  );

  const addVariantFromStyle = useCallback(
    (styleDefinition: StyleDefinition<T[keyof T]>) => {
      const styleName = styleDefinition.name as keyof T;
      const currentVariants = styles[styleName] || [];

      const newVariants = [
        ...currentVariants,
        {
          breakpoint: [],
          state: [],
          value: styleDefinition.defaultValue,
        },
      ];

      const newStyles: StyleValue<T> = {
        ...styles,
        [styleName]: newVariants,
      };
      onStylesChange(newStyles);
    },
    [onStylesChange, styles],
  );

  const updateVariant = useCallback(
    (
      styleName: keyof T,
      variantIndex: number,
      updates: Partial<StyleVariant<T[keyof T]>>,
    ) => {
      const currentVariants = styles[styleName] || [];
      const newVariants = [...currentVariants];
      newVariants[variantIndex] = { ...newVariants[variantIndex], ...updates };

      const newStyles: StyleValue<T> = {
        ...styles,
        [styleName]: newVariants,
      };
      onStylesChange(newStyles);
    },
    [onStylesChange, styles],
  );

  const deleteVariant = useCallback(
    (styleName: keyof T, variantIndex: number) => {
      const currentVariants = styles[styleName] || [];
      const newVariants = [...currentVariants];
      newVariants.splice(variantIndex, 1);

      const newStyles: StyleValue<T> = {
        ...styles,
        [styleName]: newVariants,
      };
      onStylesChange(newStyles);
    },
    [onStylesChange, styles],
  );

  const moveVariant = useCallback(
    (styleName: keyof T, fromIndex: number, toIndex: number) => {
      const currentVariants = styles[styleName] || [];
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= currentVariants.length ||
        toIndex >= currentVariants.length ||
        fromIndex === toIndex
      ) {
        return;
      }

      const newStyles: StyleValue<T> = {
        ...styles,
        [styleName]: arrayMove(currentVariants, fromIndex, toIndex),
      };
      onStylesChange(newStyles);
    },
    [onStylesChange, styles],
  );

  const cloneVariant = useCallback(
    (styleName: keyof T, variantIndex: number) => {
      const currentVariants = styles[styleName] || [];
      const variant = currentVariants[variantIndex];
      if (!variant) return;

      const newVariants = [...currentVariants];
      newVariants.splice(variantIndex + 1, 0, structuredClone(variant));

      const newStyles: StyleValue<T> = {
        ...styles,
        [styleName]: newVariants,
      };
      onStylesChange(newStyles);
    },
    [onStylesChange, styles],
  );

  return (
    <div className="grid grid-cols-1 gap-4">
      {children}

      {/* Base */}
      {!!onBaseChange && (
        <BaseBlockProps base={base || {}} onBaseChange={onBaseChange} />
      )}

      {/* Shortcuts */}
      {shortcuts && shortcuts.length > 0 && (
        <Shortcuts
          shortcuts={shortcuts}
          styles={styles}
          onStylesChange={onStylesChange}
          props={props}
          onPropsChange={onPropsChange}
        />
      )}

      {/* Copy / paste styles */}
      <div className="flex items-center gap-2">
        <StylesClipboardToolbar
          styles={styles}
          onStylesChange={onStylesChange}
          availableStyles={availableStyles}
        />
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          availableStyles={availableStyles}
          onAddStyle={addStyle}
          className="flex-1 min-w-0"
        />
      </div>

      {/* Categories */}
      {filteredCategories.map(([category, categoryStyles]) => (
        <StyleCategoryComponent
          key={category}
          category={category}
          categoryStyles={categoryStyles}
          styles={styles}
          availableStyles={availableStyles}
          searchTerm={searchTerm}
          onAddVariant={addVariant}
          onAddVariantFromStyle={addVariantFromStyle}
          onUpdateVariant={updateVariant}
          onUpdateStyle={updateStyle}
          onDeleteVariant={deleteVariant}
          onMoveVariant={moveVariant}
          onCloneVariant={cloneVariant}
        />
      ))}

      {/* CSS Preview */}
      <CSSPreview
        availableStyles={availableStyles}
        styles={styles}
        defaultProperties={defaultProperties}
      />
    </div>
  );
};
