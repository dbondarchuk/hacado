import { BaseAllKeys } from "@hacado/i18n";
import * as z from "zod";

export const countryOptions = [
  "US",
  "CA",
  "GB",
  "JP",
  "AU",
  "CH",
  "CN",
  "HK",
  "IN",
  "MX",
  "NZ",
  "SE",
  "SG",
  "NO",
  "TR",
  "ZA",
  "AT",
  "BE",
  "BG",
  "CY",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "IE",
  "IT",
  "IS",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "SM",
] as const;

export type Country = (typeof countryOptions)[number];

export const zCountry = z.enum(countryOptions, {
  message:
    "validation.configuration.general.country.invalid" satisfies BaseAllKeys,
});
