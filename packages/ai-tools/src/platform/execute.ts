import {
  loadBusinessContext,
  selectBusinessSlice,
  type BusinessContextNeed,
  type BusinessContextSlice,
} from "@hacado/ai-core";
import { getLoggerFactory } from "@hacado/logger";
import type { CommunicationChannel } from "@hacado/types/communication";
import type { IServicesContainer } from "@hacado/types/services";
import type { StockMediaProviderFilter } from "@hacado/types/stock-media";
import { getWebsiteUrl } from "@hacado/utils/website";
import { executeAskUser } from "../ask-user";

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Prefer an absolute logo URL for AI consumers that place images on canvases. */
async function withAbsoluteLogoUrl(
  services: IServicesContainer,
  slice: BusinessContextSlice,
): Promise<BusinessContextSlice> {
  const logoAsset =
    typeof slice.logoAsset === "string" ? slice.logoAsset.trim() : "";

  if (!logoAsset) return slice;

  if (isAbsoluteHttpUrl(logoAsset)) {
    return { ...slice, logoUrl: logoAsset };
  }

  try {
    const organization = await services.organizationService.getOrganization();
    if (!organization?.slug) return slice;

    const websiteUrl = getWebsiteUrl(organization).replace(/\/$/, "");
    const path = logoAsset.startsWith("/")
      ? logoAsset
      : logoAsset.startsWith("assets/") || logoAsset.startsWith("files/")
        ? `/${logoAsset}`
        : `/assets/${logoAsset.replace(/^\/+/, "")}`;

    return { ...slice, logoUrl: `${websiteUrl}${path}` };
  } catch {
    return slice;
  }
}

function pageHref(slug: string): string {
  if (!slug || slug === "home") return "/";

  return `/${slug}`.replace(/\/{2,}/g, "/");
}

function buildCatalogSummary(business: BusinessContextSlice | undefined) {
  if (!business) {
    return {
      members: 0,
      services: 0,
      addons: 0,
      packages: 0,
    };
  }

  const names = (items: Array<{ name: string }> | undefined, limit = 12) =>
    (items ?? []).slice(0, limit).map((item) => item.name);

  return {
    members: business.members?.length ?? 0,
    services: business.services?.length ?? 0,
    addons: business.addons?.length ?? 0,
    packages: business.packages?.length ?? 0,
    memberNames: names(business.members),
    serviceNames: names(business.services),
    addonNames: names(business.addons),
    packageNames: names(business.packages),
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string");
}

async function executePlatformToolInner(
  name: string,
  args: Record<string, unknown>,
  services: IServicesContainer,
): Promise<unknown> {
  switch (name) {
    case "platform_getBusinessProfile": {
      const needs = Array.isArray(args.needs)
        ? (args.needs as BusinessContextNeed[])
        : (["profile", "branding"] satisfies BusinessContextNeed[]);

      const raw = await loadBusinessContext(services);
      const wantsSummary = needs.includes("summary");
      const sliceNeeds = needs.filter(
        (need): need is Exclude<BusinessContextNeed, "summary"> =>
          need !== "summary",
      );

      const sliceNeedsResolved: BusinessContextNeed[] = sliceNeeds.length
        ? sliceNeeds
        : wantsSummary
          ? ["members", "services", "addons", "packages", "profile"]
          : ["profile", "branding"];

      let slice = selectBusinessSlice(raw, sliceNeedsResolved);

      if (sliceNeedsResolved.includes("branding")) {
        slice = await withAbsoluteLogoUrl(services, slice);
      }

      if (!wantsSummary) return slice;

      const forSummary = selectBusinessSlice(raw, [
        "members",
        "services",
        "addons",
        "packages",
        "profile",
      ]);

      return {
        ...slice,
        catalogSummary: buildCatalogSummary(forSummary),
      };
    }

    case "platform_getCatalog": {
      const include = asStringArray(args.include);
      const wants =
        include.length > 0
          ? include
          : (["services", "addons", "packages"] as const);

      const needs = wants.filter(
        (item): item is "services" | "addons" | "packages" =>
          item === "services" || item === "addons" || item === "packages",
      );

      const raw = await loadBusinessContext(services);
      return selectBusinessSlice(raw, needs.length ? needs : ["services"]);
    }

    case "platform_searchPages": {
      const limit = Math.min(
        40,
        Math.max(1, Math.floor(Number(args.limit) || 20)),
      );

      const publishedOnly = args.publishedOnly !== false;
      const query = typeof args.query === "string" ? args.query.trim() : "";

      const result = await services.pagesService.getPages({
        search: query || undefined,
        limit,
        offset: 0,
        publishStatus: publishedOnly ? [true] : undefined,
      });

      const items = result.items.map((page) => ({
        id: String(page._id),
        title: page.title,
        slug: page.slug,
        href: pageHref(page.slug),
        published: Boolean(page.published),
      }));

      return {
        available: true,
        items,
        hint: items.length
          ? "Use item.href for internal links. Prefer /book for booking CTAs when a book page exists."
          : "No matching pages. Prefer /book for booking CTAs; do not invent slugs.",
      };
    }

    case "platform_searchCustomers": {
      const limit = Math.min(
        40,
        Math.max(1, Math.floor(Number(args.limit) || 20)),
      );

      const query = typeof args.query === "string" ? args.query.trim() : "";

      const result = await services.customersService.getCustomers({
        search: query || undefined,
        limit,
        offset: 0,
      });

      return {
        available: true,
        items: result.items.map((customer) => ({
          id: String(customer._id),
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        })),
        total: result.total,
      };
    }

    case "platform_getTeamMembers": {
      const members = await services.teamService.getActiveMembers();
      return {
        available: true,
        items: members.map((member) => ({
          id: String(member._id),
          name: member.name,
          jobTitle: member.jobTitle ?? undefined,
          email: member.email,
        })),
      };
    }

    case "platform_getScheduleOverview": {
      const memberId =
        typeof args.memberId === "string" ? args.memberId.trim() : "";

      const startRaw = typeof args.start === "string" ? args.start : "";
      const endRaw = typeof args.end === "string" ? args.end : "";
      const start = new Date(startRaw);
      const end = new Date(endRaw);

      if (
        !memberId ||
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        return {
          available: false,
          error: "memberId, start, and end (ISO dates) are required",
        };
      }

      const schedule = await services.scheduleService.getSchedule(
        start,
        end,
        memberId,
      );

      return {
        available: true,
        memberId,
        start: start.toISOString(),
        end: end.toISOString(),
        schedule,
      };
    }

    case "platform_searchAppointments": {
      const limit = Math.min(
        40,
        Math.max(1, Math.floor(Number(args.limit) || 20)),
      );

      const query = typeof args.query === "string" ? args.query.trim() : "";

      const memberId =
        typeof args.memberId === "string" ? args.memberId.trim() : undefined;

      const result = await services.bookingService.getAppointments({
        search: query || undefined,
        limit,
        offset: 0,
        memberId: memberId || undefined,
      });

      return {
        available: true,
        items: result.items.map((appointment: any) => ({
          id: String(appointment._id),
          status: appointment.status,
          dateTime: appointment.dateTime,
          customerName: appointment.customerName ?? appointment.customer?.name,
          serviceName: appointment.serviceName ?? appointment.service?.name,
          memberId: appointment.memberId,
        })),
        total: result.total,
      };
    }

    case "platform_searchTemplates": {
      const limit = Math.min(
        40,
        Math.max(1, Math.floor(Number(args.limit) || 20)),
      );

      const query = typeof args.query === "string" ? args.query.trim() : "";

      const type = Array.isArray(args.type)
        ? (args.type as CommunicationChannel[])
        : undefined;

      const result = await services.templatesService.getTemplates({
        search: query || undefined,
        limit,
        offset: 0,
        type,
      });

      return {
        available: true,
        items: result.items.map((template) => ({
          id: String(template._id),
          name: template.name,
          type: template.type,
        })),
        total: result.total,
      };
    }

    case "platform_listConnectedApps": {
      const scope =
        typeof args.scope === "string" && args.scope.trim()
          ? args.scope.trim()
          : undefined;

      const apps = (
        scope
          ? await services.connectedAppsService.getAppsByScope(scope as any)
          : await services.connectedAppsService.getApps()
      ).map((app) => ({
        appId: String(app._id),
        appName: app.name,
      }));

      return {
        apps,
        scope: scope ?? null,
        hint: apps.length
          ? scope
            ? `Connected apps declaring scope "${scope}". For UI blocks, use schema defaultMetadata with the matching appId.`
            : "All connected apps. Optional scope filters (e.g. ui-components). For UI blocks, use schema defaultMetadata with the matching appId."
          : scope
            ? `No connected apps for scope "${scope}".`
            : "No connected apps.",
      };
    }

    case "platform_listPageChrome": {
      const [headers, footers] = await Promise.all([
        services.pagesService.getPageHeaders({ limit: 40, offset: 0 }),
        services.pagesService.getPageFooters({ limit: 40, offset: 0 }),
      ]);

      return {
        availableHeaders: headers.items.map((item) => ({
          id: String(item._id),
          name: item.name,
          usedCount: item.usedCount,
        })),
        availableFooters: footers.items.map((item) => ({
          id: String(item._id),
          name: item.name,
          usedCount: item.usedCount,
        })),
        hint: "Pick headerId/footerId from these lists in proposeDocumentSettings when choosing page chrome.",
      };
    }

    case "platform_searchStockImages": {
      const query = typeof args.query === "string" ? args.query : "";
      const count = typeof args.count === "number" ? args.count : undefined;

      const provider =
        typeof args.provider === "string"
          ? (args.provider as StockMediaProviderFilter)
          : "all";

      return services.stockMediaProvider.searchImages({
        query,
        count,
        provider,
      });
    }

    case "platform_searchStockVideos": {
      const query = typeof args.query === "string" ? args.query : "";
      const count = typeof args.count === "number" ? args.count : undefined;

      const provider =
        typeof args.provider === "string"
          ? (args.provider as StockMediaProviderFilter)
          : "all";

      return services.stockMediaProvider.searchVideos({
        query,
        count,
        provider,
      });
    }

    case "platform_askUser":
      return executeAskUser(args);

    default:
      return { error: `Unknown platform tool: ${name}` };
  }
}

export async function executePlatformTool(
  name: string,
  args: Record<string, unknown>,
  services: IServicesContainer,
): Promise<unknown> {
  const logger = getLoggerFactory("ai-tools")("executePlatformTool");
  const started = Date.now();

  logger.debug(
    { tool: name, argKeys: Object.keys(args) },
    "Executing platform tool",
  );

  try {
    const result = await executePlatformToolInner(name, args, services);
    logger.debug(
      {
        tool: name,
        durationMs: Date.now() - started,
        hasError:
          Boolean(result) &&
          typeof result === "object" &&
          "error" in (result as object),
      },
      "Platform tool completed",
    );

    return result;
  } catch (error) {
    logger.error(
      { err: error, tool: name, durationMs: Date.now() - started },
      "Platform tool failed",
    );

    throw error;
  }
}
