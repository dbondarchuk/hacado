import { AppsTranslations } from "@hacado/app-store/translations";
import { getConfig } from "@hacado/i18n/request";

const config = getConfig(
  async (baseLocale: string | undefined) => {
    const locale = baseLocale || "en";
    return { locale, includeAdmin: true };
  },
  async () => {
    const allApps = Object.keys(AppsTranslations);

    const messages = {
      public: async (locale: string) => {
        const promises = allApps
          .filter((app) => AppsTranslations[app]?.public)
          .map(async (app) => [
            `app_${app}_public`,
            await AppsTranslations[app]?.public?.(locale),
          ]);

        const entries = await Promise.all(promises);
        return Object.fromEntries(entries);
      },
      admin: async (locale: string) => {
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
        const promises = allApps
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
