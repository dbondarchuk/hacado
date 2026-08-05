"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@hacado/ui";
import { ChevronRight, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as z from "zod";
import {
  BaseStyleDictionary,
  StyleDefinition,
  StyleVariant,
} from "../../style/types";
import { StyleVariantComponent } from "./style-variant";

interface StyleCategoryStyleProps<T extends BaseStyleDictionary> {
  style: StyleDefinition<T[keyof T]>;
  styleVariants: StyleVariant<T[keyof T]>[];
  searchTerm?: string;
  onAddVariant: (styleName: keyof T) => void;
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

export const StyleCategoryStyle = <T extends BaseStyleDictionary>({
  style,
  styleVariants,
  searchTerm,
  onAddVariant,
  onUpdateVariant,
  onUpdateStyle,
  onDeleteVariant,
  onMoveVariant,
  onCloneVariant,
}: StyleCategoryStyleProps<T>) => {
  const t = useI18n();
  const [isStyleOpen, setIsStyleOpen] = useState(searchTerm ? true : false);
  const previousVariantsCountRef = useRef(styleVariants.length);
  const styleName = style.name as keyof T;

  const variantIds = useMemo(
    () => styleVariants.map((_, variantIndex) => String(variantIndex)),
    [styleVariants.length],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const fromIndex = Number(active.id);
      const toIndex = Number(over.id);
      if (Number.isNaN(fromIndex) || Number.isNaN(toIndex)) return;

      onMoveVariant(styleName, fromIndex, toIndex);
    },
    [onMoveVariant, styleName],
  );

  // Auto-expand when searching
  useEffect(() => {
    if (searchTerm) {
      setIsStyleOpen(true);
    } else {
      setIsStyleOpen(false);
    }
  }, [searchTerm]);

  // Auto-expand style when new variants are added
  useEffect(() => {
    const previousCount = previousVariantsCountRef.current;
    if (styleVariants.length > previousCount) {
      setIsStyleOpen(true);
    }
    previousVariantsCountRef.current = styleVariants.length;
  }, [styleVariants.length]);

  const variantList = styleVariants.map((variant, variantIndex) => (
    <StyleVariantComponent
      key={variantIndex}
      variant={variant}
      variantIndex={variantIndex}
      variantCount={styleVariants.length}
      sortableId={String(variantIndex)}
      style={style}
      styleName={styleName}
      onUpdateVariant={onUpdateVariant}
      onUpdateStyle={onUpdateStyle}
      onDeleteVariant={onDeleteVariant}
      onMoveVariant={onMoveVariant}
      onCloneVariant={onCloneVariant}
    />
  ));

  return (
    <Collapsible open={isStyleOpen} onOpenChange={setIsStyleOpen}>
      <div className="flex flex-row gap-2 justify-between w-full">
        <CollapsibleTrigger className="flex items-center justify-between w-full gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <div className="flex items-center gap-2">
            <ChevronRight
              className={cn(
                "size-3 transition-transform",
                isStyleOpen && "rotate-90",
              )}
            />
            <style.icon className="size-4" />
            <span className="text-left">{t(style.label)}</span>
          </div>
        </CollapsibleTrigger>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              onAddVariant(styleName);
            }}
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>

      <CollapsibleContent className="space-y-2 pt-2 pl-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={variantIds}
            strategy={verticalListSortingStrategy}
          >
            {variantList}
          </SortableContext>
        </DndContext>
      </CollapsibleContent>
    </Collapsible>
  );
};
