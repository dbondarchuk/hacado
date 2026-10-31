const usStates = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
] as const;

const caRegions = [
  ["AB", "Alberta"],
  ["BC", "British Columbia"],
  ["MB", "Manitoba"],
  ["NB", "New Brunswick"],
  ["NL", "Newfoundland and Labrador"],
  ["NT", "Northwest Territories"],
  ["NS", "Nova Scotia"],
  ["NU", "Nunavut"],
  ["ON", "Ontario"],
  ["PE", "Prince Edward Island"],
  ["QC", "Quebec"],
  ["SK", "Saskatchewan"],
  ["YT", "Yukon"],
] as const;

const regionsFor = (country: string) =>
  country.trim().toUpperCase() === "CA" ? caRegions : usStates;

export const canonicalSmsAddressRegion = (
  country: string,
  value: string | undefined,
) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";

  const match = regionsFor(country).find(
    ([code, name]) =>
      code.toLowerCase() === trimmed.toLowerCase() ||
      name.toLowerCase() === trimmed.toLowerCase(),
  );

  return match?.[1] ?? trimmed;
};

export const smsAddressRegionOptions = (
  country: string,
  value: string | undefined,
) => {
  const regions = regionsFor(country).map(([, name]) => ({
    value: name,
    label: name,
  }));
  const selected = canonicalSmsAddressRegion(country, value);
  if (!selected || regions.some((region) => region.value === selected)) {
    return regions;
  }

  return [{ value: selected, label: selected }, ...regions];
};
