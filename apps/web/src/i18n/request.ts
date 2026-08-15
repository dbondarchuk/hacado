import { getServicesContainer } from "@/utils/utils";
import { AppsTranslations } from "@hacado/app-store/translations";
import { getConfig } from "@hacado/i18n/request";
import { headers } from "next/headers";

const config = getConfig(
  async (baseLocale: string | undefined) => {
    const headersList = await headers();

    const servicesContainer = await getServicesContainer();

    let locale =
      baseLocale ||
      headersList.get("x-locale") ||
      (await servicesContainer.configurationService.getConfiguration("brand"))
        ?.language ||
      "en";

    return { locale, includeAdmin: false };
  },
  async () => {
    const servicesContainer = await getServicesContainer();
    const installedApps = Array.from(
      new Set(
        (await servicesContainer.connectedAppsService.getApps()).map(
          (app) => app.name,
        ),
      ),
    );

    const messages = {
      public: async (locale: string) => {
        const promises = installedApps
          .filter((app) => AppsTranslations[app]?.public)
          .map(async (app) => [
            `app_${app}_public`,
            await AppsTranslations[app]?.public?.(locale),
          ]);

        const entries = await Promise.all(promises);
        return Object.fromEntries(entries);
      },
      admin: async (locale: string) => {
        return {};
      },
      overrides: async (locale: string) => {
        const promises = installedApps
          .filter((app) => AppsTranslations[app]?.overrides)
          .map(async (app) => await AppsTranslations[app]?.overrides?.(locale));
        const overrides = await Promise.all(promises);

        return overrides;
      },
    };

    return messages;
  },
);

export default config;
