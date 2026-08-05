import { getSession } from "@/app/utils";
import { sessionCanInstallApp } from "@/lib/billing/subscription-plan-access";
import { AvailableApps } from "@hacado/app-store";
import { AppImages } from "@hacado/app-store/images";
import { getI18nAsync } from "@hacado/i18n/server";
import { getAppScopeUsage, type SessionUser } from "@hacado/types";
import {
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Heading,
  Link,
  Markdown,
} from "@hacado/ui";
import { ConnectedAppNameAndLogo } from "@hacado/ui-admin";
import { canInstallApp } from "@hacado/utils";
import { ArrowLeft } from "lucide-react";
// import Image from "next/image";
import { redirect } from "next/navigation";
import React from "react";
import { AddOrUpdateAppButton } from "../add-or-update-app-dialog";
import { getInstalledApps } from "./actions";
import { AppEventSubscriptionsDialog } from "./app-event-subscriptions-dialog";
import { AppInstallUpgradeHint } from "./app-install-upgrade-hint";
import { InstallComplexAppButton } from "./install-complex-app-button";

export type AppDetailsProps = {
  appName: string;
};

export const AppDetails: React.FC<AppDetailsProps> = async ({ appName }) => {
  const app = AvailableApps[appName];
  const installed = await getInstalledApps(appName);
  const session = await getSession();
  const target = app?.target ?? "company";
  const canInstall =
    !!session &&
    !!app &&
    canInstallApp(session.user as SessionUser, app) &&
    sessionCanInstallApp(session, appName);

  if (!canInstall && installed.length === 0) {
    redirect("/dashboard/apps/store");
  }

  const t = await getI18nAsync();
  //if (app.isHidden) return null;

  return (
    <div className="flex flex-col w-full gap-8">
      <div className="flex flex-row gap-2">
        <Link
          button
          variant="outline"
          href="/dashboard/apps/store"
          className="border-none rounded-none -ml-4"
        >
          <ArrowLeft />
        </Link>
        <Heading title={t("apps.common.appStore")} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <div className="flex flex-col w-full gap-8">
          <ConnectedAppNameAndLogo
            appName={app.name}
            nameClassName="text-3xl text-accent-foreground"
            logoClassName="w-12 h-12"
          />
          <div className="flex flex-row flex-wrap gap-4 items-center">
            <span className="bg-secondary text-secondary-foreground text-emphasis rounded-md p-2 text-sm">
              {target === "member"
                ? t("apps.target.member")
                : t("apps.target.company")}
            </span>
            {app.isFeatured && (
              <span className="text-emphasis">{t("apps.common.featured")}</span>
            )}
            {app.scope.map((scope) => {
              const usage = getAppScopeUsage(scope);
              const scopeLabel = t.has(`apps.scopes.${scope}` as any)
                ? t(`apps.scopes.${scope}` as any)
                : scope;
              const usageLabel =
                usage === "member"
                  ? t("apps.target.member")
                  : usage === "company"
                    ? t("apps.target.company")
                    : null;
              return (
                <span
                  className="bg-secondary text-secondary-foreground text-emphasis rounded-md p-2 text-sm capitalize"
                  key={scope}
                >
                  {scopeLabel}
                  {usageLabel ? ` · ${usageLabel}` : null}
                </span>
              );
            })}
            {!!app.subscribeTo?.length && (
              <AppEventSubscriptionsDialog
                patterns={[...app.subscribeTo].sort()}
                triggerLabel={t(
                  "apps.common.eventSubscriptions.viewPatterns" as any,
                )}
                title={t("apps.common.eventSubscriptions.modalTitle" as any)}
                description={t(
                  "apps.common.eventSubscriptions.modalDescription" as any,
                )}
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            {app.type !== "complex" && app.type !== "system" ? (
              <AddOrUpdateAppButton
                appType={app.name}
                installBlocked={!canInstall}
              >
                <Button
                  variant="default"
                  disabled={
                    !canInstall ||
                    (app.dontAllowMultiple && installed.length > 0)
                  }
                  className="w-fit"
                >
                  {app.dontAllowMultiple && installed.length > 0
                    ? t("apps.common.alreadyInstalled")
                    : t("apps.common.addApp")}
                </Button>
              </AddOrUpdateAppButton>
            ) : (
              <InstallComplexAppButton
                appName={appName}
                installed={installed.length}
                installBlocked={!canInstall}
              />
            )}
            {!canInstall ? <AppInstallUpgradeHint /> : null}
          </div>

          <Markdown markdown={t(app.description.text)} className="max-w-full" />
        </div>

        {!!AppImages[app.name]?.length && (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            {/* <div className="flex flex-col gap-6">
              <div className="flex flex-row justify-between items-center">
                <div className="flex flex-row gap-2 justify-end">
                  <CarouselPrevious className="relative translate-y-0 rounded-none border-none left-0 top-0" />
                  <CarouselNext className="relative translate-y-0 rounded-none border-none right-0 top-0" />
                </div>
              </div> */}
            <CarouselContent className="h-full items-center">
              {AppImages[app.name].map((image, index) => (
                <CarouselItem
                  key={index}
                  className="items-center flex justify-center h-full"
                >
                  <img
                    src={image}
                    width={800}
                    height={400}
                    alt={app.displayName}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {/* </div> */}

            <CarouselPrevious className="rounded-none border-none left-0" />
            <CarouselNext className="rounded-none border-none right-0" />
          </Carousel>
        )}
      </div>
    </div>
  );
};
