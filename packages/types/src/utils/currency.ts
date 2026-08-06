import { BaseAllKeys } from "@hacado/i18n";
import * as z from "zod";

export const currencyOptions = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "HKD",
  "INR",
  "MXN",
  "NZD",
  "SEK",
  "SGD",
  "NOK",
  "TRY",
  "ZAR",
  "PLN",
  "CZK",
  "HUF",
  "ILS",
  "ISK",
] as const;

export type Currency = (typeof currencyOptions)[number];

export const zCurrency = z.enum(currencyOptions, {
  message:
    "validation.configuration.general.currency.invalid" satisfies BaseAllKeys,
});

export const CurrencySymbolMap: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
  CHF: "CHF",
  CNY: "¥",
  HKD: "HK$",
  INR: "₹",
  MXN: "MX$",
  NZD: "NZ$",
  SEK: "kr",
  SGD: "S$",
  NOK: "kr",
  TRY: "₺",
  ZAR: "R",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  ILS: "₪",
  ISK: "kr",
} as const;
