import {
  localeNamespaceLoaders,
  resolveMessageLocale,
} from "./locale-namespace-loaders.generated";

export const AutomaticStructuredDataTranslations = {
  admin: async (locale: string) => {
    const l = resolveMessageLocale(locale);
    const { namespaceLoaders } = await localeNamespaceLoaders[l]();
    return (await namespaceLoaders.admin()).default;
  },
};
