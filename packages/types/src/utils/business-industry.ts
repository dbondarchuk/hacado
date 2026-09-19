import { BaseAllKeys } from "@hacado/i18n";
import * as z from "zod";

/**
 * UI grouping for industry comboboxes. Aligns with install catalog categories
 * where possible; each group lists schema.org LocalBusiness (sub)types.
 */
export const businessIndustryCategoryOptions = [
  "beauty",
  "wellness",
  "fitness",
  "medical",
  "home-services",
  "professional",
  "creative",
  "education",
  "coaching",
  "pet",
  "events",
  "meetings",
  "other",
] as const;

export type BusinessIndustryCategory =
  (typeof businessIndustryCategoryOptions)[number];

export type BusinessIndustryDefinition = {
  /** Stored in general configuration. */
  id: string;
  category: BusinessIndustryCategory;
  /** schema.org `@type` (LocalBusiness or a more specific subtype). */
  schemaOrgType: string;
  /** Install catalog category id for service/website template suggestions. */
  catalogCategory?: string;
};

/**
 * Leaf industries users can pick. Prefer the most specific schema.org type.
 * Category-level “general” options use the parent LocalBusiness subtype when one exists.
 */
export const businessIndustryDefinitions = [
  // Beauty (HealthAndBeautyBusiness)
  {
    id: "beauty",
    category: "beauty",
    schemaOrgType: "HealthAndBeautyBusiness",
    catalogCategory: "beauty",
  },
  {
    id: "beauty-salon",
    category: "beauty",
    schemaOrgType: "BeautySalon",
    catalogCategory: "beauty",
  },
  {
    id: "hair-salon",
    category: "beauty",
    schemaOrgType: "HairSalon",
    catalogCategory: "beauty",
  },
  {
    id: "nail-salon",
    category: "beauty",
    schemaOrgType: "NailSalon",
    catalogCategory: "beauty",
  },
  {
    id: "tattoo-parlor",
    category: "beauty",
    schemaOrgType: "TattooParlor",
    catalogCategory: "beauty",
  },

  // Wellness
  {
    id: "wellness",
    category: "wellness",
    schemaOrgType: "DaySpa",
    catalogCategory: "wellness",
  },
  {
    id: "day-spa",
    category: "wellness",
    schemaOrgType: "DaySpa",
    catalogCategory: "wellness",
  },

  // Fitness (SportsActivityLocation / HealthClub)
  {
    id: "fitness",
    category: "fitness",
    schemaOrgType: "SportsActivityLocation",
    catalogCategory: "fitness",
  },
  {
    id: "health-club",
    category: "fitness",
    schemaOrgType: "HealthClub",
    catalogCategory: "fitness",
  },
  {
    id: "exercise-gym",
    category: "fitness",
    schemaOrgType: "ExerciseGym",
    catalogCategory: "fitness",
  },
  {
    id: "sports-club",
    category: "fitness",
    schemaOrgType: "SportsClub",
    catalogCategory: "fitness",
  },
  {
    id: "golf-course",
    category: "fitness",
    schemaOrgType: "GolfCourse",
    catalogCategory: "fitness",
  },
  {
    id: "public-swimming-pool",
    category: "fitness",
    schemaOrgType: "PublicSwimmingPool",
    catalogCategory: "fitness",
  },

  // Medical
  {
    id: "medical",
    category: "medical",
    schemaOrgType: "MedicalClinic",
    catalogCategory: "medical",
  },
  {
    id: "medical-clinic",
    category: "medical",
    schemaOrgType: "MedicalClinic",
    catalogCategory: "medical",
  },
  {
    id: "dentist",
    category: "medical",
    schemaOrgType: "Dentist",
    catalogCategory: "medical",
  },
  {
    id: "physician",
    category: "medical",
    schemaOrgType: "Physician",
    catalogCategory: "medical",
  },
  {
    id: "optician",
    category: "medical",
    schemaOrgType: "Optician",
    catalogCategory: "medical",
  },
  {
    id: "pharmacy",
    category: "medical",
    schemaOrgType: "Pharmacy",
    catalogCategory: "medical",
  },

  // Home & construction
  {
    id: "home-services",
    category: "home-services",
    schemaOrgType: "HomeAndConstructionBusiness",
    catalogCategory: "home-services",
  },
  {
    id: "electrician",
    category: "home-services",
    schemaOrgType: "Electrician",
    catalogCategory: "home-services",
  },
  {
    id: "plumber",
    category: "home-services",
    schemaOrgType: "Plumber",
    catalogCategory: "home-services",
  },
  {
    id: "hvac",
    category: "home-services",
    schemaOrgType: "HVACBusiness",
    catalogCategory: "home-services",
  },
  {
    id: "house-painter",
    category: "home-services",
    schemaOrgType: "HousePainter",
    catalogCategory: "home-services",
  },
  {
    id: "locksmith",
    category: "home-services",
    schemaOrgType: "Locksmith",
    catalogCategory: "home-services",
  },
  {
    id: "moving-company",
    category: "home-services",
    schemaOrgType: "MovingCompany",
    catalogCategory: "home-services",
  },
  {
    id: "roofing-contractor",
    category: "home-services",
    schemaOrgType: "RoofingContractor",
    catalogCategory: "home-services",
  },
  {
    id: "general-contractor",
    category: "home-services",
    schemaOrgType: "GeneralContractor",
    catalogCategory: "home-services",
  },

  // Professional
  {
    id: "professional",
    category: "professional",
    schemaOrgType: "ProfessionalService",
    catalogCategory: "professional",
  },
  {
    id: "attorney",
    category: "professional",
    schemaOrgType: "Attorney",
    catalogCategory: "professional",
  },
  {
    id: "notary",
    category: "professional",
    schemaOrgType: "Notary",
    catalogCategory: "professional",
  },
  {
    id: "accounting-service",
    category: "professional",
    schemaOrgType: "AccountingService",
    catalogCategory: "professional",
  },
  {
    id: "insurance-agency",
    category: "professional",
    schemaOrgType: "InsuranceAgency",
    catalogCategory: "professional",
  },
  {
    id: "real-estate-agent",
    category: "professional",
    schemaOrgType: "RealEstateAgent",
    catalogCategory: "professional",
  },

  // Creative
  {
    id: "creative",
    category: "creative",
    schemaOrgType: "ProfessionalService",
    catalogCategory: "creative",
  },
  {
    id: "photography",
    category: "creative",
    schemaOrgType: "PhotographyBusiness",
    catalogCategory: "creative",
  },
  {
    id: "art-gallery",
    category: "creative",
    schemaOrgType: "ArtGallery",
    catalogCategory: "creative",
  },

  // Education
  {
    id: "education",
    category: "education",
    schemaOrgType: "ProfessionalService",
    catalogCategory: "education",
  },

  // Coaching
  {
    id: "coaching",
    category: "coaching",
    schemaOrgType: "ProfessionalService",
    catalogCategory: "coaching",
  },

  // Pet
  {
    id: "pet",
    category: "pet",
    schemaOrgType: "PetStore",
    catalogCategory: "pet",
  },
  {
    id: "pet-store",
    category: "pet",
    schemaOrgType: "PetStore",
    catalogCategory: "pet",
  },
  {
    id: "veterinary-care",
    category: "pet",
    schemaOrgType: "VeterinaryCare",
    catalogCategory: "pet",
  },

  // Events
  {
    id: "event",
    category: "events",
    schemaOrgType: "EntertainmentBusiness",
    catalogCategory: "event",
  },
  {
    id: "entertainment",
    category: "events",
    schemaOrgType: "EntertainmentBusiness",
    catalogCategory: "event",
  },
  {
    id: "comedy-club",
    category: "events",
    schemaOrgType: "ComedyClub",
    catalogCategory: "event",
  },

  // Meetings
  {
    id: "meetings",
    category: "meetings",
    schemaOrgType: "ProfessionalService",
    catalogCategory: "meetings",
  },

  // Other
  {
    id: "other",
    category: "other",
    schemaOrgType: "LocalBusiness",
  },
] as const satisfies readonly BusinessIndustryDefinition[];

export type BusinessIndustry =
  (typeof businessIndustryDefinitions)[number]["id"];

export const businessIndustryOptions = businessIndustryDefinitions.map(
  (d) => d.id,
) as [BusinessIndustry, ...BusinessIndustry[]];

export const zBusinessIndustry = z.enum(businessIndustryOptions, {
  message:
    "validation.configuration.general.industry.invalid" satisfies BaseAllKeys,
});

const industryById = new Map<string, BusinessIndustryDefinition>(
  businessIndustryDefinitions.map((d) => [d.id, d]),
);

export function getBusinessIndustryDefinition(
  industry: BusinessIndustry | undefined | null,
): BusinessIndustryDefinition | undefined {
  if (!industry) return undefined;
  return industryById.get(industry);
}

export function localBusinessTypeForIndustry(
  industry: BusinessIndustry | undefined | null,
): string {
  return (
    getBusinessIndustryDefinition(industry)?.schemaOrgType ?? "LocalBusiness"
  );
}

/** Install catalog category id to prefer when filtering service/website templates. */
export function catalogCategoryForIndustry(
  industry: BusinessIndustry | undefined | null,
): string | undefined {
  return getBusinessIndustryDefinition(industry)?.catalogCategory;
}
