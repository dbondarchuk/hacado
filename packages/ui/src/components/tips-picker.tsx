"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrencySymbol } from "../context";
import { cn } from "../utils/cn";
import { Button } from "./button";
import { Input } from "./input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
} from "./input-group";

export type TipMode = "none" | "preset" | "custom";

export type TipsPickerLabels = {
  title: string;
  none: string;
  preset: (percent: number) => string;
  custom: string;
  customAmount: string;
  tip: string;
  total: string;
};

export type TipsPickerProps = {
  presets: number[];
  tipMode: TipMode;
  tipPresetPercent?: number;
  customTip: string;
  tipAmount: number;
  totalAmount: number;
  formatCurrency: (amount: number) => string;
  labels: TipsPickerLabels;
  disabled?: boolean;
  className?: string;
  onSelectNone: () => void;
  onSelectPreset: (percent: number) => void;
  onSelectCustom: () => void;
  onCustomTipChange: (value: string) => void;
};

export function TipsPicker({
  presets,
  tipMode,
  tipPresetPercent,
  customTip,
  tipAmount,
  totalAmount,
  formatCurrency,
  labels,
  disabled,
  className,
  onSelectNone,
  onSelectPreset,
  onSelectCustom,
  onCustomTipChange,
}: TipsPickerProps) {
  const currencySymbol = useCurrencySymbol();

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-sm font-medium">{labels.title}</p>
      <div className="flex flex-wrap gap-2 justify-between">
        <Button
          type="button"
          size="sm"
          variant={tipMode === "none" ? "default" : "outline"}
          onClick={onSelectNone}
          disabled={disabled}
        >
          {labels.none}
        </Button>
        {presets.map((percent) => (
          <Button
            key={percent}
            type="button"
            size="sm"
            variant={
              tipMode === "preset" && tipPresetPercent === percent
                ? "default"
                : "outline"
            }
            onClick={() => onSelectPreset(percent)}
            disabled={disabled}
          >
            {labels.preset(percent)}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant={tipMode === "custom" ? "default" : "outline"}
          onClick={onSelectCustom}
          disabled={disabled}
        >
          {labels.custom}
        </Button>
      </div>
      {tipMode === "custom" && (
        <InputGroup>
          <InputGroupAddon
            className={InputGroupAddonClasses({
              variant: "prefix",
            })}
          >
            {currencySymbol}
          </InputGroupAddon>
          <InputGroupInput>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder={labels.customAmount}
              value={customTip}
              onChange={(e) => onCustomTipChange(e.target.value)}
              disabled={disabled}
              className={InputGroupInputClasses({
                variant: "prefix",
              })}
            />
          </InputGroupInput>
        </InputGroup>
      )}
      <div className="flex flex-col gap-1 text-sm border-t pt-3">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{labels.tip}</span>
          <span>{formatCurrency(tipAmount)}</span>
        </div>
        <div className="flex justify-between gap-4 font-medium">
          <span>{labels.total}</span>
          <span className="font-bold text-lg">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function roundTipMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeTipAmount(args: {
  tipMode: TipMode;
  tipPresetPercent?: number;
  customTip: string;
  baseAmount: number;
}): number {
  if (args.tipMode === "none") {
    return 0;
  }
  if (args.tipMode === "preset" && args.tipPresetPercent) {
    return roundTipMoney((args.baseAmount * args.tipPresetPercent) / 100);
  }
  if (args.tipMode === "custom") {
    const parsed = Number.parseFloat(args.customTip);
    return Number.isFinite(parsed) && parsed > 0 ? roundTipMoney(parsed) : 0;
  }
  return 0;
}

export type BookingTipsPickerProps = {
  enabled: boolean;
  presets: number[];
  baseAmount: number;
  formatCurrency: (amount: number) => string;
  labels: TipsPickerLabels;
  disabled?: boolean;
  className?: string;
  /** Fires with the resolved tip (debounced for custom amount). */
  onDebouncedTipAmountChange: (tipAmount: number) => void;
};

/**
 * Tip picker with local mode/preset/custom state and debounced tipAmount
 * callbacks for recreating payment intents (booking + similar flows).
 */
export function BookingTipsPicker({
  enabled,
  presets,
  baseAmount,
  formatCurrency,
  labels,
  disabled,
  className,
  onDebouncedTipAmountChange,
}: BookingTipsPickerProps) {
  const [tipMode, setTipMode] = useState<TipMode>("none");
  const [tipPresetPercent, setTipPresetPercent] = useState<
    number | undefined
  >();
  const [customTip, setCustomTip] = useState("");
  const onTipChangeRef = useRef(onDebouncedTipAmountChange);
  onTipChangeRef.current = onDebouncedTipAmountChange;

  const tipAmount = useMemo(
    () =>
      enabled
        ? computeTipAmount({
            tipMode,
            tipPresetPercent,
            customTip,
            baseAmount,
          })
        : 0,
    [enabled, tipMode, tipPresetPercent, customTip, baseAmount],
  );

  const totalAmount = useMemo(
    () => roundTipMoney(baseAmount + tipAmount),
    [baseAmount, tipAmount],
  );

  useEffect(() => {
    if (!enabled) {
      onTipChangeRef.current(0);
      return;
    }

    const handle = window.setTimeout(
      () => {
        onTipChangeRef.current(tipAmount);
      },
      tipMode === "custom" ? 400 : 0,
    );

    return () => window.clearTimeout(handle);
  }, [enabled, tipAmount, tipMode]);

  if (!enabled) {
    return null;
  }

  return (
    <TipsPicker
      presets={presets}
      tipMode={tipMode}
      tipPresetPercent={tipPresetPercent}
      customTip={customTip}
      tipAmount={tipAmount}
      totalAmount={totalAmount}
      formatCurrency={formatCurrency}
      labels={labels}
      disabled={disabled}
      className={className}
      onSelectNone={() => {
        setTipMode("none");
        setTipPresetPercent(undefined);
        setCustomTip("");
      }}
      onSelectPreset={(percent) => {
        setTipMode("preset");
        setTipPresetPercent(percent);
        setCustomTip("");
      }}
      onSelectCustom={() => {
        setTipMode("custom");
        setTipPresetPercent(undefined);
      }}
      onCustomTipChange={setCustomTip}
    />
  );
}
