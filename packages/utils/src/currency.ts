import { Language } from "@hacado/i18n";
import { Currency, Discount } from "@hacado/types";

/** Rounds a number to two decimal places (e.g. currency amounts). */
export const round2 = (value: number): number => Math.round(value * 100) / 100;

export const formatAmountString = (value: number): string =>
  value.toFixed(2).replace(/\.00$/, "");

export const formatAmount = (value: number): number =>
  parseFloat(value.toFixed(2).replace(/\.00$/, ""));

export const getDiscountAmount = (
  price: number,
  discount: Discount,
): number => {
  switch (discount.type) {
    case "amount":
      return Math.min(price, discount.value);
    case "percentage":
      return Math.min(price, formatAmount((price * discount.value) / 100));
  }

  return 0;
};

export const formatAmountWithCurrency = (
  amount: number,
  locale: Language,
  currency: Currency,
) => {
  return Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    currencyDisplay: currency === "USD" ? "narrowSymbol" : "symbol",
  }).format(formatAmount(amount));
};
