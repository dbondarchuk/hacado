import { blocksToPlainText } from "@hacado/page-builder-base/plain-text";
import type {
  BrandConfiguration,
  GeneralConfiguration,
  IServicesContainer,
  Page,
  PageListModel,
  ScheduleConfiguration,
  SocialConfiguration,
} from "@hacado/types";
import { pageSlugHasPlaceholder } from "@hacado/types";
import {
  formatOfferSummary,
  formatPackageSummary,
  formatServiceSummary,
  getPublicCatalogSnapshot,
  type PublicCatalogMember,
  type PublicCatalogOffer,
  type PublicCatalogPackage,
  type PublicCatalogService,
} from "./catalog-public";
import { pageHtmlPath, pageMarkdownPath, toAbsoluteUrl } from "./urls";

type LlmsSiteContext = {
  websiteUrl: string;
  general: GeneralConfiguration;
  brand: BrandConfiguration;
  social?: SocialConfiguration;
  schedule?: ScheduleConfiguration;
  pages: PageListModel[];
  offers: PublicCatalogOffer[];
  services: PublicCatalogService[];
  packages: PublicCatalogPackage[];
  members: PublicCatalogMember[];
};

function formatTeamProse(members: PublicCatalogMember[]): string {
  if (!members.length) return "";

  const parts = members.map((member) => {
    const bio = member.bio?.trim();
    return bio ? `${member.name} — ${bio}` : member.name;
  });

  return `Team: ${parts.join(". ")}.`;
}

function formatContactProse(general: GeneralConfiguration): string {
  const lines: string[] = [];
  if (general.phone) lines.push(`Phone: ${general.phone}`);
  if (general.email) lines.push(`Email: ${general.email}`);

  if (general.address) {
    const address = general.country
      ? `${general.address}, ${general.country}`
      : general.address;
    lines.push(`Address: ${address}`);
  }

  return lines.join("\n");
}

function formatHoursProse(schedule?: ScheduleConfiguration): string {
  if (!schedule?.schedule?.length) return "";

  const dayNames = [
    "",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const parts = schedule.schedule
    .slice()
    .sort((a, b) => a.weekDay - b.weekDay)
    .flatMap((day) => {
      const name = dayNames[day.weekDay] || `Day ${day.weekDay}`;
      return (day.shifts || []).map(
        (shift) => `${name} ${shift.start}-${shift.end}`,
      );
    });

  if (!parts.length) return "";
  return `Hours: ${parts.join("; ")}.`;
}

function formatSocialProse(social?: SocialConfiguration): string {
  const urls = (social?.links || [])
    .map((link) => link.url?.trim())
    .filter(Boolean);

  if (!urls.length) return "";
  return `Social: ${urls.join(", ")}.`;
}

async function loadLlmsSiteContext(
  services: IServicesContainer,
  websiteUrl: string,
): Promise<LlmsSiteContext | null> {
  const { general, brand, social, schedule } =
    await services.configurationService.getConfigurations(
      "general",
      "brand",
      "social",
      "schedule",
    );

  if (!general?.name || !brand) return null;

  const pagesResult = await services.pagesService.getPages({
    publishStatus: [true],
    maxPublishDate: new Date(),
  });

  const pages = (pagesResult.items || []).filter(
    (page) => !pageSlugHasPlaceholder(page.slug),
  );

  const catalog = await getPublicCatalogSnapshot(
    services,
    general.currency,
    brand.language,
  );

  return {
    websiteUrl,
    general,
    brand,
    social,
    schedule,
    pages,
    offers: catalog.offers,
    services: catalog.services,
    packages: catalog.packages,
    members: catalog.members,
  };
}

function buildHeader(ctx: LlmsSiteContext): string {
  const sections = [
    `# ${ctx.general.name}`,
    "",
    `> ${ctx.brand.description}`,
    "",
    formatContactProse(ctx.general),
    formatHoursProse(ctx.schedule),
    formatTeamProse(ctx.members),
    formatSocialProse(ctx.social),
    "",
    "This is a booking website. Prefer the linked Markdown pages and llms-full.txt for detailed content.",
  ];

  return sections
    .filter((line) => line !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export async function buildLlmsTxt(
  services: IServicesContainer,
  websiteUrl: string,
): Promise<string | null> {
  const ctx = await loadLlmsSiteContext(services, websiteUrl);
  if (!ctx) return null;

  const pageLines = ctx.pages.map((page) => {
    const href = toAbsoluteUrl(ctx.websiteUrl, pageMarkdownPath(page.slug));
    const note = page.description?.trim();
    return note
      ? `- [${page.title}](${href}): ${note}`
      : `- [${page.title}](${href})`;
  });

  const homeMd = toAbsoluteUrl(ctx.websiteUrl, pageMarkdownPath("home"));
  const serviceLines = ctx.services.map((service) => {
    const summary = formatServiceSummary(service);
    return summary
      ? `- [${service.name}](${homeMd}): ${summary}`
      : `- [${service.name}](${homeMd})`;
  });

  const packageLines = ctx.packages.map((pkg) => {
    const summary = formatPackageSummary(pkg);
    return summary
      ? `- [${pkg.name}](${homeMd}): Package. ${summary}`
      : `- [${pkg.name}](${homeMd}): Package`;
  });

  const parts = [buildHeader(ctx).trimEnd(), ""];
  if (pageLines.length) {
    parts.push("## Pages", "", ...pageLines, "");
  }

  if (serviceLines.length) {
    parts.push("## Services", "", ...serviceLines, "");
  }

  if (packageLines.length) {
    parts.push("## Packages", "", ...packageLines, "");
  }

  parts.push(
    "## Optional",
    "",
    `- [Full site content](${toAbsoluteUrl(ctx.websiteUrl, "/llms-full.txt")}): concatenated Markdown of pages, services, packages, and team`,
  );

  return parts.join("\n").trim() + "\n";
}

export async function buildLlmsFullTxt(
  services: IServicesContainer,
  websiteUrl: string,
): Promise<string | null> {
  const ctx = await loadLlmsSiteContext(services, websiteUrl);
  if (!ctx) return null;

  const parts = [buildHeader(ctx)];
  const hours = formatHoursProse(ctx.schedule);
  if (hours) {
    parts.push("", "## Hours", "", hours);
  }

  if (ctx.members.length) {
    parts.push("", "## Team", "");
    for (const member of ctx.members) {
      parts.push(`### ${member.name}`);
      if (member.bio?.trim()) parts.push("", member.bio.trim());
      parts.push("");
    }
  }

  if (ctx.offers.length) {
    parts.push("## Services and packages", "");
    for (const offer of ctx.offers) {
      parts.push(`### ${offer.name}`);
      if (offer.kind === "package") {
        parts.push("", "Package");
      }
      const summary = formatOfferSummary(offer);
      if (summary) parts.push("", summary);
      if (
        offer.kind === "service" &&
        offer.isFromPricing &&
        offer.specialistNames.length
      ) {
        parts.push("", `Specialists: ${offer.specialistNames.join(", ")}`);
      }
      if (offer.kind === "package" && offer.included.length) {
        parts.push(
          "",
          "Included:",
          ...offer.included.map((item) =>
            item.credits > 1
              ? `- ${item.credits}× ${item.name}`
              : `- ${item.name}`,
          ),
        );
      }
      parts.push("");
    }
  }

  if (ctx.pages.length) {
    parts.push("## Pages", "");
    for (const page of ctx.pages) {
      const fullPage = await services.pagesService.getPage(page._id);
      const htmlUrl = toAbsoluteUrl(ctx.websiteUrl, pageHtmlPath(page.slug));
      parts.push(`### ${page.title}`, "", htmlUrl);
      if (page.description?.trim()) {
        parts.push("", page.description.trim());
      }
      const body = fullPage?.content ? blocksToPlainText(fullPage.content) : "";
      if (body) parts.push("", body);
      parts.push("");
    }
  }

  return (
    parts
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim() + "\n"
  );
}

export async function buildPageMarkdown(
  services: IServicesContainer,
  websiteUrl: string,
  page: Page,
): Promise<string | null> {
  if (pageSlugHasPlaceholder(page.slug)) return null;
  if (!page.published || page.publishDate > new Date()) return null;

  const htmlUrl = toAbsoluteUrl(websiteUrl, pageHtmlPath(page.slug));
  const body = page.content ? blocksToPlainText(page.content) : "";
  const parts = [`# ${page.title}`, "", htmlUrl];
  if (page.description?.trim()) {
    parts.push("", page.description.trim());
  }

  if (body) {
    parts.push("", body);
  }

  return parts.join("\n").trim() + "\n";
}

export { pageHtmlPath, pageMarkdownPath, toAbsoluteUrl };
