import {
  formatPostalStreetAddress,
  localBusinessTypeForIndustry,
  normalizePostalAddress,
  type BrandConfiguration,
  type GeneralConfiguration,
  type IServicesContainer,
  type ScheduleConfiguration,
  type SocialConfiguration,
} from "@hacado/types";
import { stripMarkdown } from "@hacado/utils";
import {
  getPublicCatalogSnapshot,
  type PublicCatalogMember,
  type PublicCatalogOffer,
  type PublicCatalogPackage,
  type PublicCatalogService,
} from "./catalog-public";
import { pageHtmlPath, toAbsoluteUrl, toAbsoluteWebsiteUrl } from "./urls";

const DAY_NAMES = [
  "",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type JsonLdGraph = {
  "@context": "https://schema.org";
  "@graph": Record<string, unknown>[];
};

function plainTextDescription(
  value: string | undefined | null,
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const plain = stripMarkdown(trimmed).replace(/\s+/g, " ").trim();
  return plain || undefined;
}

function businessId(websiteUrl: string) {
  return `${websiteUrl.replace(/\/$/, "")}/#business`;
}

function websiteId(websiteUrl: string) {
  return `${websiteUrl.replace(/\/$/, "")}/#website`;
}

function openingHours(schedule?: ScheduleConfiguration) {
  if (!schedule?.schedule?.length) return undefined;

  const specs = schedule.schedule.flatMap((day) => {
    const dayOfWeek = DAY_NAMES[day.weekDay];
    if (!dayOfWeek) return [];
    return (day.shifts || []).map((shift) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek,
      opens: shift.start,
      closes: shift.end,
    }));
  });

  return specs.length ? specs : undefined;
}

function sameAs(social?: SocialConfiguration) {
  const urls = (social?.links || [])
    .map((link) => link.url?.trim())
    .filter(Boolean);

  return urls.length ? urls : undefined;
}

function personNodes(
  websiteUrl: string,
  members: PublicCatalogMember[],
): Record<string, unknown>[] {
  return members.map((member) => {
    const node: Record<string, unknown> = {
      "@type": "Person",
      "@id": `${websiteUrl.replace(/\/$/, "")}/#person-${member.id}`,
      name: member.name,
    };
    if (member.bio?.trim()) node.description = member.bio.trim();
    if (member.image) {
      node.image = toAbsoluteWebsiteUrl(websiteUrl, member.image);
    }
    return node;
  });
}

function toIso8601Duration(minutes: number): string | undefined {
  if (!Number.isFinite(minutes) || minutes <= 0) return undefined;

  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (hours && mins) return `PT${hours}H${mins}M`;
  if (hours) return `PT${hours}H`;
  return `PT${mins}M`;
}

function serviceItemOffered(
  service: PublicCatalogService,
): Record<string, unknown> {
  const itemOffered: Record<string, unknown> = {
    "@type": "Service",
    name: service.name,
    description: plainTextDescription(service.description),
  };

  if (service.durationType === "fixed" && service.duration != null) {
    const timeRequired = toIso8601Duration(service.duration);
    if (timeRequired) itemOffered.timeRequired = timeRequired;
  }

  return itemOffered;
}

function offerForService(
  service: PublicCatalogService,
): Record<string, unknown> | undefined {
  const itemOffered = serviceItemOffered(service);

  if (service.price == null) {
    return {
      "@type": "Offer",
      itemOffered,
    };
  }

  if (service.isFromPricing) {
    const offer: Record<string, unknown> = {
      "@type": "AggregateOffer",
      lowPrice: service.price,
      priceCurrency: service.currency,
      itemOffered,
    };

    if (service.durationType === "flexible") {
      offer.unitText = "HOUR";
    }

    return offer;
  }

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    price: service.price,
    priceCurrency: service.currency,
    itemOffered,
  };
  if (service.durationType === "flexible") {
    offer.unitText = "HOUR";
  }
  return offer;
}

function offerForPackage(pkg: PublicCatalogPackage): Record<string, unknown> {
  const included = pkg.included
    .map((item) =>
      item.credits > 1 ? `${item.credits}× ${item.name}` : item.name,
    )
    .join(", ");
  const descriptionParts = [
    plainTextDescription(pkg.description),
    included ? `Includes ${included}` : undefined,
    pkg.validityMonths
      ? `Valid for ${pkg.validityMonths} month${pkg.validityMonths === 1 ? "" : "s"}`
      : undefined,
  ].filter(Boolean);

  return {
    "@type": "Offer",
    price: pkg.price,
    priceCurrency: pkg.currency,
    itemOffered: {
      "@type": "Service",
      name: pkg.name,
      description: descriptionParts.join(". "),
      category: "Package",
    },
  };
}

function offerForCatalogOffer(
  offer: PublicCatalogOffer,
): Record<string, unknown> | undefined {
  return offer.kind === "package"
    ? offerForPackage(offer)
    : offerForService(offer);
}

export function buildSiteJsonLd(args: {
  websiteUrl: string;
  general: GeneralConfiguration;
  brand: BrandConfiguration;
  social?: SocialConfiguration;
  schedule?: ScheduleConfiguration;
  offers: PublicCatalogOffer[];
  members: PublicCatalogMember[];
}): JsonLdGraph {
  const { websiteUrl, general, brand, social, schedule, offers, members } =
    args;
  const base = websiteUrl.replace(/\/$/, "");
  const people = personNodes(websiteUrl, members);
  const makesOffer = offers
    .map(offerForCatalogOffer)
    .filter((offer): offer is Record<string, unknown> => !!offer);

  const business: Record<string, unknown> = {
    "@type": localBusinessTypeForIndustry(general.industry),
    "@id": businessId(websiteUrl),
    name: general.name,
    description: brand.description,
    url: base,
  };

  if (brand.logo) {
    business.logo = toAbsoluteWebsiteUrl(websiteUrl, brand.logo);
    business.image = toAbsoluteWebsiteUrl(websiteUrl, brand.logo);
  }
  if (general.phone) business.telephone = general.phone;
  if (general.email) business.email = general.email;

  const postalAddress = normalizePostalAddress(
    general.address,
    general.country,
  );
  if (postalAddress) {
    const streetAddress = formatPostalStreetAddress(postalAddress);
    business.address = {
      "@type": "PostalAddress",
      ...(streetAddress ? { streetAddress } : {}),
      ...(postalAddress.addressLocality
        ? { addressLocality: postalAddress.addressLocality }
        : {}),
      ...(postalAddress.addressRegion
        ? { addressRegion: postalAddress.addressRegion }
        : {}),
      ...(postalAddress.postalCode
        ? { postalCode: postalAddress.postalCode }
        : {}),
      ...(postalAddress.addressCountry
        ? { addressCountry: postalAddress.addressCountry }
        : {}),
    };
  } else if (general.country) {
    business.address = {
      "@type": "PostalAddress",
      addressCountry: general.country,
    };
  }

  const hours = openingHours(schedule);
  if (hours) business.openingHoursSpecification = hours;
  const socialUrls = sameAs(social);
  if (socialUrls) business.sameAs = socialUrls;
  if (people.length) {
    business.employee = people.map((person) => ({ "@id": person["@id"] }));
  }
  if (makesOffer.length) business.makesOffer = makesOffer;

  const website: Record<string, unknown> = {
    "@type": "WebSite",
    "@id": websiteId(websiteUrl),
    url: base,
    name: brand.title || general.name,
    description: brand.description,
    publisher: { "@id": businessId(websiteUrl) },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [business, website, ...people],
  };
}

export function buildPageJsonLd(args: {
  websiteUrl: string;
  slug: string;
  name: string;
  description?: string;
  dateModified?: Date;
}): JsonLdGraph {
  const { websiteUrl, slug, name, description, dateModified } = args;
  const pageUrl = toAbsoluteUrl(websiteUrl, pageHtmlPath(slug));
  const webPage: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name,
    isPartOf: { "@id": websiteId(websiteUrl) },
    about: { "@id": businessId(websiteUrl) },
  };
  if (description) webPage.description = description;
  if (dateModified) webPage.dateModified = dateModified.toISOString();

  const graph: Record<string, unknown>[] = [webPage];

  if (slug && slug !== "home") {
    const segments = slug.split("/").filter(Boolean);
    const itemListElement = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: toAbsoluteUrl(websiteUrl, "/"),
      },
      ...segments.map((segment, index) => {
        const path = segments.slice(0, index + 1).join("/");
        return {
          "@type": "ListItem",
          position: index + 2,
          name: segment,
          item: toAbsoluteUrl(websiteUrl, `/${path}`),
        };
      }),
    ];
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement,
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export async function loadSiteJsonLd(
  services: IServicesContainer,
  websiteUrl: string,
  general: GeneralConfiguration,
  brand: BrandConfiguration,
  social?: SocialConfiguration,
  schedule?: ScheduleConfiguration,
): Promise<JsonLdGraph> {
  const catalog = await getPublicCatalogSnapshot(
    services,
    general.currency,
    brand.language,
  );
  return buildSiteJsonLd({
    websiteUrl,
    general,
    brand,
    social,
    schedule,
    offers: catalog.offers,
    members: catalog.members,
  });
}

export function jsonLdScriptContent(graph: JsonLdGraph): string {
  return JSON.stringify(graph);
}
