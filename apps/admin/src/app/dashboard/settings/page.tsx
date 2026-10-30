import { getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { navItems } from "@/constants/data";
import { filterNavItemsForPermission } from "@/lib/auth/filter-nav-items-for-role";
import {
  filterNavItemsForPlanTier,
  getSessionPlanTier,
} from "@/lib/billing/subscription-plan-access";
import { getI18nAsync } from "@hacado/i18n/server";
import type { NavItem } from "@hacado/types/admin";
import {
  Breadcrumbs,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Heading,
  Link,
} from "@hacado/ui";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return { title: t("navigation.settings") };
}

const visibleSettingsLinks = (
  user: Parameters<typeof filterNavItemsForPermission>[1],
  planTier: ReturnType<typeof getSessionPlanTier>,
): NavItem[] => {
  const settingsGroup = navItems.find((group) => group.id === "settings");
  if (!settingsGroup) return [];

  const [visible] = filterNavItemsForPermission(
    filterNavItemsForPlanTier([settingsGroup], planTier),
    user,
  );

  return (visible?.children ?? []).flatMap((section) => {
    const links = (section.items ?? []).filter((item) => item.href);
    if (links.length) return links;
    return section.href ? [section] : [];
  });
};

export default async function Page() {
  const t = await getI18nAsync();
  const session = await getSession();
  const links = visibleSettingsLinks(session.user, getSessionPlanTier(session));

  const breadcrumbItems = [
    { title: t("admin.navigation.dashboard"), link: "/dashboard" },
    { title: t("admin.navigation.settings"), link: "/dashboard/settings" },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Breadcrumbs items={breadcrumbItems} />
        <Heading
          title={t("admin.navigation.settings")}
          description={t("admin.settings.hub.description")}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((item) => (
            <Link
              key={item.id}
              href={item.href!}
              variant="none"
              className="block h-full rounded-lg text-card-foreground hover:text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full transition-colors hover:bg-accent/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    {item.icon ? (
                      <span className="text-muted-foreground [&>svg]:size-5 [&>svg]:shrink-0">
                        {item.icon}
                      </span>
                    ) : null}
                    {t(item.title)}
                  </CardTitle>
                  {item.description ? (
                    <CardDescription>{t(item.description)}</CardDescription>
                  ) : null}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
