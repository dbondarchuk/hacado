"use client";
import { authClient } from "@/app/auth-client";
import { sessionCanInstallApp } from "@/lib/billing/subscription-plan-access";
import { AvailableApps } from "@hacado/app-store";
import { useI18n } from "@hacado/i18n/client";
import { App } from "@hacado/types";
import {
  Button,
  Card,
  CardContent,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Heading,
  Input,
  Link,
  Markdown,
} from "@hacado/ui";
import { ConnectedAppNameAndLogo } from "@hacado/ui-admin";
import { canInstallApp } from "@hacado/utils";
import React from "react";

export type AppStoreProps = {};

function useCanInstallApp() {
  const { data: session } = authClient.useSession();
  return React.useCallback(
    (app: App) => {
      if (!session?.user) return false;
      if (!canInstallApp(session.user as any, app)) return false;
      return sessionCanInstallApp(session as any, app.name);
    },
    [session],
  );
}

const AppCard: React.FC<{ app: App }> = ({ app }) => {
  const t = useI18n();

  return (
    <Card className="pt-4 h-full">
      <CardContent className="flex flex-col gap-4 h-full">
        <div className="flex flex-row justify-between items-center">
          <ConnectedAppNameAndLogo appName={app.name} />
        </div>
        <div className="text-default mt-2 flex-grow text-base line-clamp-3">
          <Markdown markdown={t(app.description.text)} prose="none" />
        </div>
        <Link
          href={`/dashboard/apps/store/${app.name}`}
          button
          variant="outline"
        >
          {t("apps.common.details")}
        </Link>
      </CardContent>
    </Card>
  );
};

export const AppStore: React.FC<AppStoreProps> = ({}) => {
  const tApps = useI18n("apps");
  const t = useI18n();
  const canInstallApp = useCanInstallApp();
  const apps = React.useMemo(
    () =>
      Object.values(AvailableApps).filter(
        (app) => !app.isHidden && canInstallApp(app),
      ),
    [canInstallApp],
  );

  const categories = React.useMemo(
    () => Array.from(new Set(apps.flatMap((app) => app.category))),
    [apps],
  );

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string | undefined>(undefined);

  const filteredApps = React.useMemo(
    () =>
      apps.filter((app) => {
        if (
          category &&
          !app.category.some(
            (c) => c.toLocaleLowerCase() === category.toLocaleLowerCase(),
          )
        )
          return false;

        if (search.length === 0) return true;

        const s = search.toLocaleLowerCase();
        return (
          app.name.toLocaleLowerCase().includes(s) ||
          app.displayName.toLocaleLowerCase().includes(s) ||
          app.category.some((c) => c.toLocaleLowerCase().includes(s)) ||
          app.description.text.toLocaleLowerCase().includes(s)
        );
      }),
    [apps, category, search],
  );

  return (
    <div className="flex flex-col w-full gap-8">
      <div className="flex flex-col md:flex-row justify-between gap-2">
        <Heading
          title={tApps("common.appStore")}
          description={tApps("common.addNewApps")}
        />
        <Input
          placeholder={tApps("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-96"
        />
      </div>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <div className="flex flex-col gap-6 w-full">
          <div className="flex flex-row justify-between items-center">
            <div>
              <h2 className="text-emphasis mt-0 text-lg font-semibold leading-none">
                {tApps("common.mostPopular")}
              </h2>
            </div>
            <div className="flex flex-row gap-2 justify-end">
              <CarouselPrevious className="relative translate-y-0 rounded-none border-none left-0 top-0" />
              <CarouselNext className="relative translate-y-0 rounded-none border-none right-0 top-0" />
            </div>
          </div>
          <CarouselContent className="items-stretch w-0 min-w-full">
            {apps
              .filter((app) => app.isFeatured)
              .map((app) => (
                <CarouselItem
                  className="w-full md:basis-1/2 lg:basis-1/3"
                  key={app.name}
                >
                  <AppCard app={app} />
                </CarouselItem>
              ))}
          </CarouselContent>
        </div>
      </Carousel>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-emphasis mt-0 text-lg font-semibold leading-none">
              {tApps("common.allApps")}
            </h2>
          </div>
          <div className="flex flex-row flex-wrap gap-2 md:justify-end">
            <Button
              variant={!!category ? "secondary" : "default"}
              onClick={() => setCategory(undefined)}
            >
              {tApps("common.all")}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={category !== cat ? "secondary" : "default"}
                onClick={() => setCategory(cat)}
                className="capitalize"
              >
                {t(`${cat}`)}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => (
            <AppCard app={app} key={app.name} />
          ))}
        </div>
      </div>
    </div>
  );
};
