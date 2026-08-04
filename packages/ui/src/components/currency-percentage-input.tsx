"use client";

import type React from "react";

import { useI18n } from "@timelish/i18n/client";
import { formatAmountString } from "@timelish/utils";
import { DollarSign, Percent } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCurrencyFormat, useCurrencySymbol } from "../context/config";
import { Button } from "./button";
import { Input } from "./input";

interface CurrencyPercentageInputProps {
  maxAmount: number;
  value?: number;
  onChange?: (amount: number) => void;
  label?: string;
  className?: string;
}

export function CurrencyPercentageInput({
  maxAmount,
  value = 0,
  onChange,
  className = "",
}: CurrencyPercentageInputProps) {
  const t = useI18n("ui");

  const [mode, setMode] = useState<"amount" | "percentage">("amount");
  const [inputValue, setInputValue] = useState(value.toFixed(2));
  const isUserInputRef = useRef(false);
  const currencySymbol = useCurrencySymbol();
  const formatCurrency = useCurrencyFormat();

  const calculateAmount = (percentage: number) => {
    return (maxAmount * percentage) / 100;
  };

  const calculatePercentage = (amount: number) => {
    return (amount / maxAmount) * 100;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    isUserInputRef.current = true;

    if (mode === "amount") {
      // Allow only numbers and one decimal point
      if (!/^\d*\.?\d{0,2}$/.test(rawValue) && rawValue !== "") return;

      const numValue = Number.parseFloat(rawValue) || 0;
      if (numValue > maxAmount) return;

      setInputValue(rawValue);
      onChange?.(numValue);
    } else {
      // Percentage mode
      if (!/^\d*\.?\d{0,2}$/.test(rawValue) && rawValue !== "") return;

      const numValue = Number.parseFloat(rawValue) || 0;
      if (numValue > 100) return;

      setInputValue(rawValue);
      const calculatedAmount = calculateAmount(numValue);
      onChange?.(calculatedAmount);
    }
  };

  const toggleMode = () => {
    const newMode = mode === "amount" ? "percentage" : "amount";
    setMode(newMode);

    if (newMode === "percentage") {
      // Convert current amount to percentage
      const percentage = calculatePercentage(value);
      setInputValue(percentage > 0 ? percentage.toFixed(2) : "");
    } else {
      // Convert to amount
      setInputValue(value > 0 ? formatAmountString(value) : "");
    }
  };

  useEffect(() => {
    if (isUserInputRef.current) {
      isUserInputRef.current = false;
      return;
    }

    if (mode === "amount") {
      setInputValue(value > 0 ? formatAmountString(value) : "");
    } else {
      const percentage = calculatePercentage(value);
      setInputValue(percentage > 0 ? percentage.toFixed(2) : "");
    }
  }, [value, mode]);

  const displayAmount =
    mode === "percentage" && inputValue
      ? formatCurrency(calculateAmount(Number.parseFloat(inputValue)))
      : null;

  return (
    <div className={className}>
      <div className="flex gap-2 justify-end">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {mode === "amount" ? (
              <span className="text-muted-foreground">{currencySymbol}</span>
            ) : (
              <Percent className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <Input
            type="number"
            inputMode="decimal"
            placeholder={mode === "amount" ? "0.00" : "0"}
            value={inputValue}
            onChange={handleInputChange}
            className="pl-9 max-w-32 text-right"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleMode}
          className="shrink-0"
        >
          {mode === "amount" ? (
            <Percent className="h-4 w-4" />
          ) : (
            <DollarSign className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="mt-2 flex flex-row gap-2 items-center justify-between text-base text-muted-foreground">
        {mode === "percentage" && displayAmount && (
          <span>{t("currencyInput.amount", { amount: displayAmount })}</span>
        )}
        <span className="ml-auto">
          {t("currencyInput.max", { max: formatCurrency(maxAmount) })}
        </span>
      </div>
    </div>
  );
}
