import { auth } from "@/app/auth";
import { AppsTranslations } from "@hacado/app-store/translations";
import { getConfig } from "@hacado/i18n/request";
import { ServicesContainer } from "@hacado/services";
import { headers } from "next/headers";

const config = getConfig(
  async (baseLocale: string | undefined) => {
    const headersList = await headers();
    // const isInstallPath = headersList.get("x-is-install-path") === "true";

    if (baseLocale) {
      return {
        locale: baseLocale,
        includeAdmin: true,
        includeInstall: true,
      };
    }

    if (headersList.get("x-locale")) {
      return {
        locale: headersList.get("x-locale") as string,
        includeAdmin: true,
        includeInstall: true,
      };
    }

    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session) {
      return { locale: "en", includeAdmin: true, includeInstall: true };
    }

    let locale = (session.user as { language?: string }).language || "en";
    return { locale, includeAdmin: true, includeInstall: true };
  },
  async () => {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session) {
      return {
        public: async (locale: string) => ({}),
        admin: async (locale: string) => ({}),
        overrides: async (locale: string) => [],
      };
    }

    const organizationId = session.user.organizationId;
    const installedApps = Array.from(
      new Set(
        (
          await ServicesContainer(organizationId).connectedAppsService.getApps()
        ).map((app) => app.name),
      ),
    );

    const allApps = Object.keys(AppsTranslations);

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
        // Include all apps, not just installed apps to display in store / set up forms
        const promises = allApps
          .filter((app) => AppsTranslations[app]?.admin)
          .map(async (app) => [
            `app_${app}_admin`,
            await AppsTranslations[app]?.admin?.(locale),
          ]);

        const entries = await Promise.all(promises);
        return Object.fromEntries(entries);
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
