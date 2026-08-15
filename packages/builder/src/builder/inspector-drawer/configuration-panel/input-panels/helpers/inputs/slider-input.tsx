"use client";
import React, { useCallback, useEffect, useState } from "react";

import { Label } from "@hacado/ui";
import { RawSliderInput } from "./raw/raw-slider-input";
import { ResetButton } from "./reset-button";
import { useDebouncedParentCommit } from "./use-debounced-parent-commit";

type SliderInputProps = {
  label: string;
  iconLabel: React.JSX.Element;

  step?: number;
  units: string;
  min?: number;
  max?: number;
  /**
   * Milliseconds to debounce parent `onChange` while dragging. Omit or `0` for immediate updates.
   * When debounced, parent still receives the final value on pointer release (`onValueCommit`) and on unmount.
   */
  debounceMs?: number;
} & (
  | {
      defaultValue: number;
      onChange: (v: number) => void;
      nullable?: false;
    }
  | {
      defaultValue: number | null;
      onChange: (v: number | null) => void;
      nullable: true;
    }
);

export const SliderInput: React.FC<SliderInputProps> = ({
  label,
  defaultValue,
  onChange,
  nullable,
  debounceMs = 100,
  ...props
}) => {
  const [value, setValue] = useState(defaultValue);

  const { schedule, flush, discardPending } = useDebouncedParentCommit<number>({
    delayMs: debounceMs,
    commit: useCallback(
      (v: number) => {
        onChange(v as any);
      },
      [onChange],
    ),
  });

  useEffect(() => {
    discardPending();
    setValue(defaultValue);
  }, [defaultValue, discardPending]);

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex w-full">
        <RawSliderInput
          value={value}
          setValue={(next: number) => {
            setValue(next);
            schedule(next);
          }}
          onCommit={debounceMs > 0 ? flush : undefined}
          {...props}
        />
        {nullable && (
          <ResetButton
            onClick={() => {
              discardPending();
              setValue(null);
              onChange(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
