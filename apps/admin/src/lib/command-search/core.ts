import { getLoggerFactory } from "@hacado/logger";
import { CommandSearchGroup } from "@hacado/types/apps";
import { BillingPlanTier, meetsMinimumPlanTier } from "@hacado/types/billing";
import { IServicesContainer } from "@hacado/types/services";
import { SessionUser } from "@hacado/types/users";
import { gateMemberIds } from "@hacado/utils/gate-member-ids";
import { canManageTeam, hasPermission } from "@hacado/utils/permissions";
import type { CommandSearchScope } from "./scope";

const LIMIT = 5;

function listHref(path: string, query: string) {
  return `${path}?search=${encodeURIComponent(query)}`;
}

function subtitle(...parts: Array<string | null | undefined>) {
  const value = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  return value || undefined;
}

function formatWhen(value: Date | string, timeZone: string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}

export async function searchCoreRecords({
  query,
  user,
  services,
  planTier,
  scope,
}: {
  query: string;
  user: SessionUser;
  services: IServicesContainer;
  planTier: BillingPlanTier | null;
  scope?: CommandSearchScope;
}): Promise<CommandSearchGroup[]> {
  const logger = getLoggerFactory("AdminAPI/search")("core");
  const solo = meetsMinimumPlanTier(planTier, BillingPlanTier.Solo);

  const take = async (
    id: string,
    allowed: boolean,
    run: () => Promise<CommandSearchGroup>,
  ) => {
    if (scope && scope !== id) return null;
    if (!allowed) return null;

    try {
      const group = await run();
      return group.items.length > 0 ? group : null;
    } catch (error) {
      logger.warn({ error }, "Command search source failed");
      return null;
    }
  };

  const groups = await Promise.all([
    take("customers", hasPermission(user, "customer", "read"), async () => {
      const result = await services.customersService.getCustomers({
        search: query,
        limit: LIMIT,
        offset: 0,
      });

      return {
        id: "customers",
        labelKey: "admin.navigation.customers",
        listHref: listHref("/dashboard/customers", query),
        items: result.items.map((customer) => ({
          id: customer._id,
          title: customer.name,
          subtitle: subtitle(customer.email, customer.phone),
          href: `/dashboard/customers/${customer._id}`,
          image: personImage(customer.name, customer.avatar),
        })),
      };
    }),
    take(
      "appointments",
      hasPermission(user, "appointment", "read"),
      async () => {
        const { timeZone } =
          await services.configurationService.getConfiguration("general");

        const memberIds = gateMemberIds(user, undefined);
        const result = await services.bookingService.getAppointments({
          search: query,
          limit: LIMIT,
          offset: 0,
          ...(memberIds ? { memberId: memberIds } : {}),
        });

        return {
          id: "appointments",
          labelKey: "admin.navigation.appointments",
          listHref: listHref("/dashboard/appointments", query),
          items: result.items.map((appointment) => ({
            id: appointment._id,
            title: appointment.fields.name,
            subtitle: subtitle(
              appointment.service?.name,
              formatWhen(appointment.dateTime, timeZone),
            ),
            href: `/dashboard/appointments/${appointment._id}`,
          })),
        };
      },
    ),
    take("pages", hasPermission(user, "page", "read"), async () => {
      const result = await services.pagesService.getPages({
        search: query,
        limit: LIMIT,
        offset: 0,
      });

      return {
        id: "pages",
        labelKey: "admin.navigation.pages",
        listHref: listHref("/dashboard/pages", query),
        items: result.items.map((page) => ({
          id: page._id,
          title: page.title,
          subtitle: page.slug,
          href: `/dashboard/pages/${page._id}`,
        })),
      };
    }),
    take("headers", hasPermission(user, "page", "read"), async () => {
      const result = await services.pagesService.getPageHeaders({
        search: query,
        limit: LIMIT,
        offset: 0,
      });

      return {
        id: "headers",
        labelKey: "admin.navigation.pageHeaders",
        listHref: listHref("/dashboard/pages/headers", query),
        items: result.items.map((header) => ({
          id: header._id,
          title: header.name,
          href: `/dashboard/pages/headers/${header._id}`,
        })),
      };
    }),
    take("footers", hasPermission(user, "page", "read"), async () => {
      const result = await services.pagesService.getPageFooters({
        search: query,
        limit: LIMIT,
        offset: 0,
      });

      return {
        id: "footers",
        labelKey: "admin.navigation.pageFooters",
        listHref: listHref("/dashboard/pages/footers", query),
        items: result.items.map((footer) => ({
          id: footer._id,
          title: footer.name,
          href: `/dashboard/pages/footers/${footer._id}`,
        })),
      };
    }),
    take(
      "templates",
      hasPermission(user, "communication", "readAll"),
      async () => {
        const result = await services.templatesService.getTemplates({
          search: query,
          limit: LIMIT,
          offset: 0,
        });

        return {
          id: "templates",
          labelKey: "admin.navigation.templates",
          listHref: listHref("/dashboard/templates", query),
          items: result.items.map((template) => ({
            id: template._id,
            title: template.name,
            subtitle: template.type,
            href: `/dashboard/templates/${template._id}`,
          })),
        };
      },
    ),
    take("options", hasPermission(user, "service", "read"), async () => {
      const result = await services.catalogService.getServices({
        search: query,
        limit: LIMIT,
        offset: 0,
      });

      return {
        id: "options",
        labelKey: "admin.navigation.services",
        listHref: listHref("/dashboard/catalog/services", query),
        items: result.items.map((option) => ({
          id: option._id,
          title: option.name,
          href: `/dashboard/catalog/services/${option._id}`,
        })),
      };
    }),
    take("addons", hasPermission(user, "service", "read"), async () => {
      const result = await services.catalogService.getAddons({
        search: query,
        limit: LIMIT,
        offset: 0,
      });

      return {
        id: "addons",
        labelKey: "admin.navigation.addons",
        listHref: listHref("/dashboard/catalog/addons", query),
        items: result.items.map((addon) => ({
          id: addon._id,
          title: addon.name,
          href: `/dashboard/catalog/addons/${addon._id}`,
        })),
      };
    }),
    take("fields", hasPermission(user, "service", "read"), async () => {
      const result = await services.catalogService.getFields({
        search: query,
        limit: LIMIT,
        offset: 0,
      } as Parameters<IServicesContainer["catalogService"]["getFields"]>[0]);

      return {
        id: "fields",
        labelKey: "admin.navigation.fields",
        listHref: listHref("/dashboard/catalog/fields", query),
        items: result.items.map((field) => ({
          id: field._id,
          title: fieldLabel(field),
          href: `/dashboard/catalog/fields/${field._id}`,
        })),
      };
    }),
    take(
      "discounts",
      hasPermission(user, "discount", "read") && solo,
      async () => {
        const result = await services.catalogService.getDiscounts({
          search: query,
          limit: LIMIT,
          offset: 0,
        });

        return {
          id: "discounts",
          labelKey: "admin.navigation.discounts",
          listHref: listHref("/dashboard/catalog/discounts", query),
          items: result.items.map((discount) => ({
            id: discount._id,
            title: discount.name,
            href: `/dashboard/catalog/discounts/${discount._id}`,
          })),
        };
      },
    ),
    take(
      "gift-cards",
      hasPermission(user, "giftCard", "read") && solo,
      async () => {
        const result = await services.giftCardsService.getGiftCards({
          search: query,
          limit: LIMIT,
          offset: 0,
        });

        return {
          id: "gift-cards",
          labelKey: "admin.navigation.giftCards",
          listHref: listHref("/dashboard/catalog/gift-cards", query),
          items: result.items.map((giftCard) => ({
            id: giftCard._id,
            title: giftCard.code,
            subtitle: giftCard.customer?.name,
            href: `/dashboard/catalog/gift-cards/${giftCard._id}`,
          })),
        };
      },
    ),
    take(
      "packages",
      hasPermission(user, "package", "read") && solo,
      async () => {
        const result = await services.packagesService.getPackages({
          search: query,
          limit: LIMIT,
          offset: 0,
        });

        return {
          id: "packages",
          labelKey: "admin.navigation.packages",
          listHref: listHref("/dashboard/catalog/packages", query),
          items: result.items.map((pkg) => ({
            id: pkg._id,
            title: pkg.name,
            href: `/dashboard/catalog/packages/${pkg._id}`,
          })),
        };
      },
    ),
    take("assets", hasPermission(user, "page", "read"), async () => {
      const result = await services.assetsService.getAssets({
        search: query,
        limit: LIMIT,
        offset: 0,
      });

      return {
        id: "assets",
        labelKey: "admin.navigation.assets",
        listHref: listHref("/dashboard/assets", query),
        items: result.items.map((asset) => ({
          id: asset._id,
          title: asset.filename,
          subtitle: asset.mimeType,
          href: `/dashboard/assets/${asset._id}`,
        })),
      };
    }),
    take("team", canManageTeam(user), async () => {
      const needle = query.toLowerCase();
      const members = await services.teamService.getMembers();
      const matches = members
        .filter((member) => {
          const haystack = [member.name, member.email, member.jobTitle]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(needle);
        })
        .slice(0, LIMIT);

      return {
        id: "team",
        labelKey: "admin.navigation.team",
        listHref: listHref("/dashboard/settings/team", query),
        items: matches.map((member) => ({
          id: member._id,
          title: member.name,
          subtitle: subtitle(member.email, member.jobTitle),
          href: `/dashboard/settings/team/${member._id}/profile`,
          image: personImage(member.name, member.image),
        })),
      };
    }),
  ]);

  return groups.filter((group): group is CommandSearchGroup => group !== null);
}

function fieldLabel(field: { name: string; data?: { label?: string } }) {
  return field.data?.label || field.name;
}

function personImage(name?: string | null, src?: string | null) {
  const label = name?.trim();
  if (!label && !src) return undefined;

  const fallback =
    label
      ?.split(" ")
      .map((part) => part[0]?.toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join("") || "?";

  return { src: src || undefined, fallback };
}
