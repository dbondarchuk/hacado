/** ISO 3166-1 alpha-2 countries allowed for public (non-invitation) signup. */
export const PUBLIC_SIGNUP_COUNTRY_CODES = new Set([
  // North America
  "US",
  "CA",
  "MX",
  "PR",
  "VI",
  "GU",
  "AS",
  "MP",
  "BM",
  "GL",
  "PM",
  // EU-27
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
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
  "ES",
  "SE",
  // EEA / EFTA
  "IS",
  "LI",
  "NO",
  "CH",
  // UK and Crown dependencies
  "GB",
  "GI",
  "GG",
  "JE",
  "IM",
  // Balkans
  "AL",
  "BA",
  "ME",
  "MK",
  "RS",
  "XK",
  // Eastern Europe (RU and BY are intentionally omitted)
  "UA",
  "MD",
  // Microstates and territories
  "AD",
  "MC",
  "SM",
  "VA",
  "FO",
  "AX",
  // Turkey and Caucasus
  "TR",
  "GE",
  "AM",
  "AZ",
]);

export function isAllowedSignupCountry(countryCode: string | null): boolean {
  if (!countryCode) return false;
  return PUBLIC_SIGNUP_COUNTRY_CODES.has(countryCode.toUpperCase());
}
