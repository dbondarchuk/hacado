"use client";

import { BuilderKeys, useI18n } from "@hacado/i18n/client";
import {
  Badge,
  Button,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@hacado/ui";
import { ChevronRight, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as z from "zod";
import { StyleValue } from "../../style/css-renderer";
import {
  BaseStyleDictionary,
  StyleCategory,
  StyleDefinition,
  StyleDictionary,
  StyleVariant,
} from "../../style/types";
import { AddVariantButton } from "./add-variant-button";
import { StyleCategoryStyle } from "./style-category-style";

interface StyleCategoryProps<T extends BaseStyleDictionary> {
  category: StyleCategory;
  categoryStyles: StyleDefinition<T[keyof T]>[];
  styles: StyleValue<T>;
  availableStyles: StyleDictionary<T>;
  searchTerm?: string;
  onAddVariant: (styleName: keyof T) => void;
  onAddVariantFromStyle: (styleDefinition: StyleDefinition<T[keyof T]>) => void;
  onUpdateVariant: (
    styleName: keyof T,
    variantIndex: number,
    updates: Partial<StyleVariant<T[keyof T]>>,
  ) => void;
  onUpdateStyle: (
    styleName: keyof T,
    variantIndex: number,
    value: z.infer<T[keyof T]>,
  ) => void;
  onDeleteVariant: (styleName: keyof T, variantIndex: number) => void;
  onMoveVariant: (
    styleName: keyof T,
    fromIndex: number,
    toIndex: number,
  ) => void;
  onCloneVariant: (styleName: keyof T, variantIndex: number) => void;
}

export const StyleCategoryComponent = <T extends BaseStyleDictionary>({
  category,
  categoryStyles,
  styles,
  availableStyles,
  searchTerm,
  onAddVariant,
  onAddVariantFromStyle,
  onUpdateVariant,
  onUpdateStyle,
  onDeleteVariant,
  onMoveVariant,
  onCloneVariant,
}: StyleCategoryProps<T>) => {
  const t = useI18n("builder");
  const [isOpen, setIsOpen] = useState(false);
  const previousActiveCountRef = useRef(categoryStyles.length);

  // Helper function to safely translate categories
  const getCategoryLabel = (category: StyleCategory) => {
    const categoryLabel =
      `pageBuilder.styles.categories.${category}` as BuilderKeys;
    return t.has(categoryLabel) ? t(categoryLabel) : category;
  };

  // Filter to only show styles that have active variants
  const activeStylesInCategory = categoryStyles.filter(
    (style) =>
      styles[style.name as keyof T] &&
      styles[style.name as keyof T]!.length > 0,
  );

  // Count total active styles in this category
  const activeStylesCount = activeStylesInCategory.length;

  // Auto-expand category if searching and it has matching styles
  useEffect(() => {
    if (searchTerm && activeStylesCount > 0) {
      setIsOpen(true);
    } else if (activeStylesCount === 0) {
      setIsOpen(false);
    }
  }, [searchTerm, activeStylesCount]);

  // Auto-expand category when new styles are added
  useEffect(() => {
    const previousCount = previousActiveCountRef.current;
    if (activeStylesCount > previousCount) {
      setIsOpen(true);
    }
    previousActiveCountRef.current = activeStylesCount;
  }, [activeStylesCount]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-row gap-2 justify-between w-full">
        <CollapsibleTrigger className="flex items-center justify-between w-full gap-2 text-secondary-foreground font-medium hover:text-foreground transition-colors">
          <div className="flex items-center gap-2 w-full">
            <ChevronRight
              className={cn(
                "size-4 transition-transform",
                isOpen && "rotate-90",
              )}
            />
            <div className="flex flex-row gap-1 justify-between w-full">
              <span>{getCategoryLabel(category)}</span>
              {activeStylesCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {activeStylesCount}
                </Badge>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <div className="flex items-center gap-1">
          <AddVariantButton
            availableStyles={availableStyles}
            onAddVariant={onAddVariantFromStyle}
            category={category}
          >
            <Button variant="ghost" size="xs">
              <Plus size={16} />
            </Button>
          </AddVariantButton>
        </div>
      </div>

      <CollapsibleContent className="space-y-3 pt-2 pl-1">
        {/* Active Styles in this category */}
        {activeStylesInCategory.length > 0 && (
          <div className="space-y-3">
            {activeStylesInCategory.map((style) => {
              const styleVariants = styles[style.name as keyof T] || [];

              return (
                <StyleCategoryStyle
                  key={style.name}
                  style={style}
                  styleVariants={styleVariants}
                  searchTerm={searchTerm}
                  onAddVariant={onAddVariant}
                  onUpdateVariant={onUpdateVariant}
                  onUpdateStyle={onUpdateStyle}
                  onDeleteVariant={onDeleteVariant}
                  onMoveVariant={onMoveVariant}
                  onCloneVariant={onCloneVariant}
                />
              );
            })}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
