"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@hacado/i18n/client";
import { Button, cn, Label } from "@hacado/ui";
import { ArrowDown, ArrowUp, Copy, GripVertical, Trash } from "lucide-react";
import * as z from "zod";
import {
  BaseStyleDictionary,
  StyleDefinition,
  StyleVariant,
} from "../../style/types";
import {
  getStateCssSelector,
  isParentTarget,
  isPseudoElementState,
  isSelectorTarget,
  isSelfTarget,
  isViewState,
  parentLevelKeys,
  StateWithTarget,
} from "../../style/zod";
import { BreakpointSelector } from "./breakpoint-selector";
import { StateSelector } from "./state-selector";

interface StyleVariantProps<T extends BaseStyleDictionary> {
  variant: StyleVariant<T[keyof T]>;
  variantIndex: number;
  variantCount: number;
  sortableId: string;
  style: StyleDefinition<T[keyof T]>;
  styleName: keyof T;
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

export const StyleVariantComponent = <T extends BaseStyleDictionary>({
  variant,
  variantIndex,
  variantCount,
  sortableId,
  style,
  styleName,
  onUpdateVariant,
  onUpdateStyle,
  onDeleteVariant,
  onMoveVariant,
  onCloneVariant,
}: StyleVariantProps<T>) => {
  const t = useI18n();
  const canSort = variantCount > 1;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    disabled: !canSort,
  });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getVariantLabel = (variant: StyleVariant<T[keyof T]>) => {
    const parts = [];
    if (variant.breakpoint?.length) {
      const breakpointLabels = variant.breakpoint.map((bp) =>
        t(`builder.pageBuilder.styles.breakpoints.${bp}`),
      );
      parts.push(
        breakpointLabels.join(t("builder.pageBuilder.styles.breakpoints.and")),
      );
    }
    if (variant.state?.length) {
      const stateLabels = (variant.state as StateWithTarget[]).map(
        (stateWithParent) => {
          const stateLabel = (() => {
            if (stateWithParent.state === "default") return "";
            if (
              isPseudoElementState(stateWithParent.state) ||
              isViewState(stateWithParent.state)
            ) {
              return getStateCssSelector(stateWithParent.state);
            }
            return `:${t(`builder.pageBuilder.styles.states.${stateWithParent.state}`)}`;
          })().toLocaleLowerCase();

          if (isSelfTarget(stateWithParent)) {
            return stateWithParent.state === "default"
              ? t("builder.pageBuilder.styles.states.default")
              : stateLabel;
          }

          if (isParentTarget(stateWithParent)) {
            const level = stateWithParent.target?.data
              ?.level as (typeof parentLevelKeys)[number];
            const parentLabel = t(
              `builder.pageBuilder.styles.states.parentLevels.${level}`,
            );

            return `${parentLabel}${stateLabel}`;
          }

          if (isSelectorTarget(stateWithParent)) {
            const selector = stateWithParent.target?.data?.selector;
            const stateType = stateWithParent.target?.data?.stateType;
            return stateType === "block"
              ? `${stateLabel} ${selector}`
              : `${selector}${stateLabel}`;
          }

          return stateLabel;
        },
      );
      parts.push(stateLabels.join(", "));
    }
    return parts.length > 0
      ? parts.join(" - ")
      : t("builder.pageBuilder.styles.base");
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={cn("flex flex-col gap-2", isDragging && "opacity-60")}
    >
      {/* Variant header with breakpoint and state controls */}
      <div className="flex flex-col justify-between gap-2">
        <div className="flex items-center gap-1 justify-between">
          <div className="flex min-w-0 items-center gap-1">
            {canSort && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="shrink-0 cursor-grab touch-none"
                aria-label={t("builder.pageBuilder.styles.reorderVariant")}
                {...attributes}
                {...listeners}
              >
                <GripVertical className="size-3.5" />
              </Button>
            )}
            <span className="truncate text-xs text-muted-foreground">
              {getVariantLabel(variant)}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {canSort && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={variantIndex === 0}
                  aria-label={t("builder.pageBuilder.styles.moveVariantUp")}
                  onClick={() =>
                    onMoveVariant(styleName, variantIndex, variantIndex - 1)
                  }
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={variantIndex === variantCount - 1}
                  aria-label={t("builder.pageBuilder.styles.moveVariantDown")}
                  onClick={() =>
                    onMoveVariant(styleName, variantIndex, variantIndex + 1)
                  }
                >
                  <ArrowDown className="size-3.5" />
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label={t("builder.pageBuilder.styles.cloneVariant")}
              onClick={() => onCloneVariant(styleName, variantIndex)}
            >
              <Copy className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onDeleteVariant(styleName, variantIndex)}
            >
              <Trash />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1 justify-between">
          {/* Breakpoint selector */}
          <BreakpointSelector
            breakpoints={variant.breakpoint || []}
            onBreakpointsChange={(breakpoints) =>
              onUpdateVariant(styleName, variantIndex, {
                breakpoint: breakpoints,
              })
            }
            styleName={style.name}
            variantIndex={variantIndex}
          />

          {/* State selector */}
          <StateSelector
            states={(variant.state || []) as StateWithTarget[]}
            onStatesChange={(states) =>
              onUpdateVariant(styleName, variantIndex, { state: states })
            }
            styleName={style.name}
            variantIndex={variantIndex}
          />
        </div>
      </div>

      {/* Style component */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium">
          {t.has(`builder.pageBuilder.styles.properties.${style.name}`)
            ? t(`builder.pageBuilder.styles.properties.${style.name}`)
            : t(style.label)}
        </Label>
        <style.component
          value={variant.value}
          onChange={(value) => onUpdateStyle(styleName, variantIndex, value)}
        />
      </div>
    </div>
  );
};
