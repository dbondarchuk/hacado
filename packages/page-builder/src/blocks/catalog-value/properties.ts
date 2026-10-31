export const catalogSources = [
  "service",
  "addon",
  "member",
  "package",
] as const;
export type CatalogSource = (typeof catalogSources)[number];

export const durationFormats = [
  "duration",
  "hours",
  "minutes",
  "hoursMinutes",
] as const;
export type DurationFormat = (typeof durationFormats)[number];

export const durationStyles = ["long", "medium", "short"] as const;
export type DurationStyle = (typeof durationStyles)[number];

export type CatalogPropertyKind = "text" | "multiline" | "price" | "duration";

export type CatalogProperty = {
  id: string;
  kind: CatalogPropertyKind;
};

export const catalogProperties = {
  service: [
    { id: "name", kind: "text" },
    { id: "description", kind: "multiline" },
    { id: "price", kind: "price" },
    { id: "duration", kind: "duration" },
  ],
  addon: [
    { id: "name", kind: "text" },
    { id: "description", kind: "multiline" },
    { id: "price", kind: "price" },
    { id: "duration", kind: "duration" },
  ],
  member: [
    { id: "name", kind: "text" },
    { id: "jobTitle", kind: "text" },
    { id: "bio", kind: "multiline" },
    { id: "email", kind: "text" },
    { id: "phone", kind: "text" },
  ],
  package: [
    { id: "name", kind: "text" },
    { id: "description", kind: "multiline" },
    { id: "price", kind: "price" },
  ],
} as const satisfies Record<
  CatalogSource,
  readonly { id: string; kind: CatalogPropertyKind }[]
>;

export function getCatalogProperty(
  source: CatalogSource | null | undefined,
  propertyId: string | null | undefined,
) {
  if (!source || !propertyId) return undefined;
  return catalogProperties[source].find(
    (property) => property.id === propertyId,
  ) as CatalogProperty | undefined;
}

export function isMultilineProperty(
  source: CatalogSource | null | undefined,
  propertyId: string | null | undefined,
) {
  return getCatalogProperty(source, propertyId)?.kind === "multiline";
}

export function isDurationProperty(
  source: CatalogSource | null | undefined,
  propertyId: string | null | undefined,
) {
  return getCatalogProperty(source, propertyId)?.kind === "duration";
}

export function isPriceProperty(
  source: CatalogSource | null | undefined,
  propertyId: string | null | undefined,
) {
  return getCatalogProperty(source, propertyId)?.kind === "price";
}
