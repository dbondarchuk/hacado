import { getServicesContainer, getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { AvailableApps } from "@hacado/app-store";
import { AppMenuItems } from "@hacado/app-store/menu-items";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading } from "@hacado/ui";
import {
  HeaderActionButtonsContainer,
  HeaderActionButtonsProvider,
} from "@hacado/ui-admin-kit";
import { meetsRequiredPermission } from "@hacado/utils";
import { Metadata } from "next";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";

type Props = PageProps<"/dashboard/[...slug]">;

const getAppPage = cache(async (path: string) => {
  const logger = getLoggerFactory("AdminDashboardPage")("getAppPage");
  const tAdmin = await getI18nAsync("admin");
  const t = await getI18nAsync();
  const servicesContainer = await getServicesContainer();
  const session = await getSession();
  logger.debug(
    {
      slug: path,
    },
    "Processing dashboard page request",
  );

  const app = Object.entries(AppMenuItems)
    .map(([appName, menuItems]) => ({
      app: AvailableApps[appName],
      menuItems,
    }))
    .find(
      ({ app, menuItems }) =>
        app.type === "complex" &&
        menuItems?.some(({ href }) => href.toLocaleLowerCase() === path),
    );

  if (!app) {
    logger.warn({ path }, "No app found for path");
    redirect("/dashboard");
  }

  const installs = await servicesContainer.connectedAppsService.getAppsByApp(
    app.app.name,
  );
  const appId =
    app.app.target === "member"
      ? installs.find((install) => install.memberId === session?.user?.memberId)
          ?._id
      : installs[0]?._id;
  if (!appId) {
    logger.warn({ appId }, "No app ID found for app");
    redirect("/dashboard");
  }

  const menuItem = app.menuItems?.find(
    ({ href }) => href.toLocaleLowerCase() === path,
  );

  if (!menuItem) {
    logger.warn({ path }, "No menu item found for path");
    redirect("/dashboard");
  }

  if (!meetsRequiredPermission(session?.user, menuItem.requiredPermission)) {
    logger.warn(
      { path, requiredPermission: menuItem.requiredPermission },
      "User missing permission for app page",
    );
    forbidden();
  }

  const breadcrumbItems = [
    { title: tAdmin("navigation.dashboard"), link: "/dashboard" },
    ...(!menuItem.noAppsBreadcrumb
      ? [{ title: tAdmin("navigation.apps"), link: "/dashboard/apps" }]
      : []),
    ...(menuItem.pageBreadcrumbs?.map((b) => ({
      ...b,
      title: t(b.title, { appName: t(app.app.displayName) }),
    })) || [
      {
        title: t(menuItem.pageTitle || app.app.displayName, {
          appName: t(app.app.displayName),
        }),
        link: `/dashboard/${path}`,
      },
    ]),
  ];

  return {
    title: t(menuItem.pageTitle || app.app.displayName),
    description: t(
      menuItem.pageDescription || "apps.common.defaultDescription",
      {
        appName: t(app.app.displayName),
      },
    ),
    breadcrumbItems,
    appId,
    menuItem,
    app,
    servicesContainer,
  };
});

const getSlug = cache(async (props: Props) => {
  const { slug } = await props.params;
  return slug?.join("/").toLocaleLowerCase() || "/";
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const path = await getSlug(props);
  const appPage = await getAppPage(path);
  return {
    title: appPage.title,
    description: appPage.description,
  };
}

export default async function Page(props: Props) {
  const logger = getLoggerFactory("AdminDashboardPage")("Page");
  const path = await getSlug(props);
  const searchParams = await props.searchParams;
  logger.debug(
    {
      slug: path,
      searchParams: searchParams,
    },
    "Processing dashboard page request",
  );

  const {
    menuItem,
    breadcrumbItems,
    appId,
    title,
    description,
    servicesContainer,
  } = await getAppPage(path);

  return (
    <PageContainer scrollable={!menuItem.notScrollable}>
      <HeaderActionButtonsProvider>
        <div className="flex flex-1 flex-col gap-4 w-full">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex flex-row items-center gap-4 justify-between">
            {!menuItem.hideHeading && (
              <Heading
                title={title}
                description={description}
                className="flex-1"
              />
            )}
            <HeaderActionButtonsContainer />
          </div>
          <menuItem.Page
            appId={appId}
            searchParams={searchParams}
            services={servicesContainer}
          />
        </div>
      </HeaderActionButtonsProvider>
    </PageContainer>
  );
}
