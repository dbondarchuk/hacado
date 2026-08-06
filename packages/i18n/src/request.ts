import { getRequestConfig } from "next-intl/server";
import {
  localeNamespaceLoaders,
  resolveMessageLocale,
} from "./locales/locale-namespace-loaders.generated";
import { mergeObjects } from "./utils";

export const getConfig = (
  getLocale: (baseLocale: string | undefined) => Promise<{
    locale: string;
    includeAdmin: boolean;
    includeInstall?: boolean;
  }>,
  getMessages?: () => Promise<{
    public: (locale: string) => Promise<Record<string, Record<string, any>>>;
    admin: (locale: string) => Promise<Record<string, Record<string, any>>>;
    overrides: (locale: string) => Promise<(Record<string, any> | undefined)[]>;
  }>,
) =>
  getRequestConfig(async ({ locale: baseLocale }) => {
    const { locale, includeAdmin, includeInstall } =
      await getLocale(baseLocale);

    const r = resolveMessageLocale(locale);
    const { namespaceLoaders } = await localeNamespaceLoaders[r]();

    const externalMessages = await getMessages?.();
    const publicMessages = await externalMessages?.public(locale);

    const [translation, ui, validation] = await Promise.all([
      namespaceLoaders.translation(),
      namespaceLoaders.ui(),
      namespaceLoaders.validation(),
    ]);
    let messages: Record<string, any> = {
      translation: translation.default,
      ui: ui.default,
      validation: validation.default,
      ...(publicMessages || {}),
    };

    if (includeAdmin) {
      const [admin, builder, apps] = await Promise.all([
        namespaceLoaders.admin(),
        namespaceLoaders.builder(),
        namespaceLoaders.apps(),
      ]);
      messages.admin = admin.default;
      messages.builder = builder.default;
      messages.apps = apps.default;

      const adminMessages = await externalMessages?.admin(locale);
      messages = {
        ...messages,
        ...(adminMessages || {}),
      };
    }

    if (includeInstall) {
      messages.install = (await namespaceLoaders.install()).default;
    }

    const overrideEntries = await externalMessages?.overrides(locale);
    const overrides =
      overrideEntries?.filter(Boolean).reduce(
        (acc, entry) => {
          return mergeObjects(acc as {}, entry ?? {});
        },
        {} as Record<string, any>,
      ) ?? {};

    messages = mergeObjects(messages, overrides);

    return {
      locale,
      onError: (error) => console.error(error),
      getMessageFallback: ({ namespace, key }) => `${namespace}.${key}`,

      messages,
    };
  });
