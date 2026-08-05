"use client";
import { JSX, useCallback, useId } from "react";

import { cn, FormDescription, Label } from "@hacado/ui";
import { ArgumentsAutocomplete } from "@hacado/ui-admin";
import React from "react";
import { useEditorArgs } from "../../../../../../documents/editor/context";
import { ResetButton } from "./reset-button";
import { useDebouncedParentCommit } from "./use-debounced-parent-commit";

type Props = {
  label: React.ReactNode;
  rows?: number;
  placeholder?: string;
  helperText?: string | JSX.Element;
  /**
   * Milliseconds to debounce parent `onChange`. Omit or `0` for immediate updates on each keystroke.
   */
  debounceMs?: number;
} & (
  | {
      defaultValue: string;
      onChange: (v: string) => void;
      nullable?: false;
    }
  | {
      defaultValue: string | null;
      onChange: (v: string | null) => void;
      nullable: true;
    }
);

export const TextInput: React.FC<Props> = ({
  helperText,
  label,
  placeholder,
  rows,
  defaultValue,
  nullable,
  debounceMs = 100,
  onChange,
}) => {
  const [value, setValue] = React.useState(defaultValue);

  const { schedule, flush, discardPending } = useDebouncedParentCommit<string>({
    delayMs: debounceMs,
    commit: useCallback(
      (v) => {
        onChange(v as any);
      },
      [onChange],
    ),
  });

  React.useEffect(() => {
    discardPending();
    setValue(defaultValue);
  }, [defaultValue, discardPending]);

  const args = useEditorArgs();
  const isMultiline = typeof rows === "number" && rows > 1;
  const id = useId();

  const onChangeCallback = useCallback(
    (next: string) => {
      setValue(next);
      schedule(next);
    },
    [schedule],
  );

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex w-full">
        {/* @ts-expect-error - TODO: fix this */}
        <ArgumentsAutocomplete
          args={args}
          asInput={!isMultiline}
          className={cn("w-full", isMultiline && "max-h-40")}
          placeholder={placeholder}
          value={value ?? undefined}
          h="sm"
          id={id}
          onChange={onChangeCallback}
          onBlur={debounceMs > 0 ? flush : undefined}
        />
        {nullable && (
          <ResetButton
            size="sm"
            onClick={() => {
              discardPending();
              setValue(null);
              onChange(null);
            }}
          />
        )}
      </div>
      {helperText && (
        <FormDescription className="text-xs">{helperText}</FormDescription>
      )}
    </div>
  );
};
