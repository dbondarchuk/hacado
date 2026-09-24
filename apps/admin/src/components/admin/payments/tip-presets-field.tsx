"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { FormDescription } from "@hacado/ui";
import { Sortable } from "@hacado/ui-admin";
import React from "react";
import { FieldError, UseFormReturn } from "react-hook-form";
import { TipPresetCard } from "./tip-preset-card";

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

export type TipPresetsFieldLabels = {
  title: string;
  description: string;
  percentage: string;
  move: string;
  remove: string;
};

export type TipPresetsFieldProps = {
  form: UseFormReturn<any>;
  name: string;
  disabled?: boolean;
  labels: TipPresetsFieldLabels;
  max?: number;
  className?: string;
};

export const TipPresetsField: React.FC<TipPresetsFieldProps> = ({
  form,
  name,
  disabled,
  labels,
  max = 4,
  className,
}) => {
  const presets =
    (form.watch(name) as Array<number | undefined> | undefined) ?? [];
  const [ids, setIds] = React.useState<string[]>(() =>
    presets.map(() => createId()),
  );

  const idsRef = React.useRef(ids);
  idsRef.current = ids;

  React.useLayoutEffect(() => {
    setIds((prev) => {
      if (prev.length === presets.length) {
        return prev;
      }
      if (presets.length > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: presets.length - prev.length }, () =>
            createId(),
          ),
        ];
      }

      return prev.slice(0, presets.length);
    });
  }, [presets.length]);

  const getPresets = () =>
    (form.getValues(name) as Array<number | undefined> | undefined) ?? [];

  const setPresets = (next: Array<number | undefined>, nextIds?: string[]) => {
    if (nextIds) {
      idsRef.current = nextIds;
      setIds(nextIds);
    }
    form.setValue(name, next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSort = (activeId: string, overId: string) => {
    const currentIds = idsRef.current;
    const from = currentIds.indexOf(activeId);
    const to = currentIds.indexOf(overId);
    if (from < 0 || to < 0 || from === to) {
      return;
    }

    const current = getPresets();
    const nextIds = arrayMove(currentIds, from, to);
    setPresets(arrayMove(current, from, to), nextIds);
  };

  const onAdd = () => {
    if (presets.length >= max) {
      return;
    }

    setPresets([...getPresets(), 15], [...idsRef.current, createId()]);
  };

  const onRemove = (index: number) => {
    setPresets(
      getPresets().filter((_, i) => i !== index),
      idsRef.current.filter((_, i) => i !== index),
    );
  };

  const onItemChange = (index: number, value: number | undefined) => {
    const next = [...getPresets()];
    next[index] = value;
    setPresets(next);
  };

  const { error: fieldError } = form.getFieldState(name, form.formState);
  const invalidMessage =
    typeof fieldError?.message === "string" ? fieldError.message : undefined;
  const itemErrors = Array.isArray(fieldError)
    ? fieldError
    : (fieldError as { [index: number]: FieldError } | undefined);

  return (
    <div className={className ?? "flex flex-col gap-2"}>
      <FormDescription>{labels.description}</FormDescription>
      <Sortable
        title={labels.title}
        ids={ids}
        onSort={onSort}
        onAdd={presets.length < max ? onAdd : undefined}
        disabled={disabled}
        invalid={
          invalidMessage
            ? { isInvalid: true, message: invalidMessage }
            : undefined
        }
      >
        <div className="flex flex-col gap-2">
          {ids.map((id, index) => {
            const itemError = itemErrors?.[index];
            const itemMessage =
              itemError &&
              typeof itemError === "object" &&
              "message" in itemError
                ? String(itemError.message ?? "")
                : undefined;

            return (
              <TipPresetCard
                key={id}
                id={id}
                value={presets[index]}
                disabled={disabled}
                percentageLabel={labels.percentage}
                moveLabel={labels.move}
                removeLabel={labels.remove}
                errorMessage={itemMessage}
                onChange={(value) => onItemChange(index, value)}
                onBlur={() => form.trigger(name)}
                remove={() => onRemove(index)}
              />
            );
          })}
        </div>
      </Sortable>
    </div>
  );
};
