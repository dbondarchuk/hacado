import { CookiesProvider } from "@/components/cookies-provider";
import {
  getOrganizationDomain,
  getOrganizationId,
  getPlanTier,
  getServicesContainer,
  getWebsiteUrl,
  isFreeTier,
  sessionCanUseFeature,
} from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { Resource } from "@hacado/types";
import { ConfigProvider, SonnerToaster, Toaster } from "@hacado/ui";
import {
  buildGoogleFontsUrl,
  DEFAULT_WEB_PRIMARY_FONT,
  DEFAULT_WEB_SECONDARY_FONT,
  getColorsCss,
} from "@hacado/utils";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import NextScript from "next/script";

import "../globals.css";

const ScriptRenderer = ({
  resource,
  id,
}: {
  resource: Resource;
  id: string | number;
}) => {
  switch (resource.source) {
    case "inline":
      return <NextScript id={id.toString()}>{resource.value}</NextScript>;
    case "remote":
      return <NextScript src={resource.url}></NextScript>;
  }
};

const CssRenderer = ({
  resource,
  id,
}: {
  resource: Resource;
  id: string | number;
}) => {
  switch (resource.source) {
    case "inline":
      return <style id={id.toString()}>{resource.value}</style>;
    case "remote":
      // eslint-disable-next-line @next/next/no-css-tags
      return <link rel="stylesheet" href={resource.url} />;
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const logger = getLoggerFactory("RootLayout")("RootLayout");
  logger.debug("Starting root layout render");

  const organizationId = await getOrganizationId();
  if (!organizationId) {
    logger.warn(
      "No organization ID found, redirecting to organization not found",
    );

    redirect("/organization-not-found");
  }

  const servicesContainer = await getServicesContainer();
  const { general, brand, scripts, styling } =
    await servicesContainer.configurationService.getConfigurations(
      "general",
      "brand",
      "scripts",
      "styling",
    );

  const locale = await getLocale();
  const websiteUrl = await getWebsiteUrl();

  logger.debug(
    { hasGeneral: !!general, hasScripts: !!scripts, hasStyling: !!styling },
    "Retrieved configurations",
  );

  if (!general || !general.name) {
    logger.debug("No general configuration found, returning minimal layout");
    return (
      <html>
        <body>{children}</body>
      </html>
    );
  }

  const primaryFont = styling?.fonts?.primary || DEFAULT_WEB_PRIMARY_FONT;
  const secondaryFont = styling?.fonts?.secondary || DEFAULT_WEB_SECONDARY_FONT;
  const tertiaryFont = styling?.fonts?.tertiary;
  const organizationDomain = await getOrganizationDomain();

  const canUseScripts = await sessionCanUseFeature("scripts");
  const planTier = await getPlanTier();
  const isFreeSubscription = await isFreeTier(planTier);

  const fontsCssUrl = buildGoogleFontsUrl(
    primaryFont,
    secondaryFont,
    tertiaryFont,
  );

  // const fontsRes = await fetch(fontsCssUrl, {
  //   cache: "force-cache",
  // });

  // const fonts = await fontsRes.text();
  const colors = getColorsCss(styling?.colors);

  logger.debug({ fontsCssUrl, hasColors: !!colors }, "Generated styles");

  return (
    <CookiesProvider>
      <html lang={locale} className="scroll-smooth">
        <head>
          <link rel="stylesheet" href={fontsCssUrl} />
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @layer base {

              :root {
                --font-primary: '${primaryFont}';
                --font-secondary: '${secondaryFont}';
                ${tertiaryFont ? `--font-tertiary: '${tertiaryFont}';` : ""}
                ${colors}
              }
            }
          `,
            }}
          />
          {brand.favicon && (
            <link
              rel="icon"
              href={brand.favicon}
              type="image/x-icon"
              sizes="any"
            />
          )}
          {!!canUseScripts &&
            scripts?.header?.map((resource, index) => (
              <ScriptRenderer resource={resource} id={index} key={index} />
            ))}
          {styling?.css?.map((resource, index) => (
            <CssRenderer resource={resource} id={index} key={index} />
          ))}
        </head>
        {/* <TwLoad /> */}
        <body className="font-primary">
          <ConfigProvider
            generalConfiguration={general}
            brandConfiguration={brand}
            domain={organizationDomain}
            websiteUrl={websiteUrl}
          >
            <NextIntlClientProvider>
              <main className="min-h-screen max-w-none">
                {children}
                {isFreeSubscription && (
                  <div className="text-center text-sm text-gray-500 w-full">
                    Built with{" "}
                    <a
                      href="https://hacado.com"
                      target="_blank"
                      className="text-xs text-primary underline"
                    >
                      Hacado
                    </a>
                  </div>
                )}
              </main>
              {!!canUseScripts &&
                scripts?.footer?.map((resource, index) => (
                  <ScriptRenderer resource={resource} id={index} key={index} />
                ))}
              <Toaster />
              <SonnerToaster />
            </NextIntlClientProvider>
          </ConfigProvider>
        </body>
      </html>
    </CookiesProvider>
  );
}
