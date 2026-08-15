import { getI18nAsync } from "@hacado/i18n/server";
import { Home } from "lucide-react";

import { getServicesContainer } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Link,
} from "@hacado/ui";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const logger = getLoggerFactory("NotFoundComponent")("generateMetadata");
  logger.debug("Generating not found metadata");

  const t = await getI18nAsync("translation");
  const servicesContainer = await getServicesContainer();
  const brand =
    await servicesContainer.configurationService.getConfiguration("brand");

  try {
    const title = [t("notFound.title"), brand.title]
      .filter((x) => !!x)
      .join(" | ");

    const description = [t("notFound.description"), brand.description]
      .filter((x) => !!x)
      .join("\n");

    const keywords = brand.keywords;

    logger.debug(
      {
        generatedTitle: title,
        generatedDescription: description,
        generatedKeywords: keywords,
      },
      "Generated not found metadata",
    );

    return {
      title,
      description,
      keywords,
      icons: {
        icon: brand.favicon || "/icon.ico",
      },
    };
  } catch (error: any) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      "Error generating not found metadata",
    );

    // Return basic metadata on error
    return {
      title: t("notFound.title"),
      description: t("notFound.description"),
    };
  }
}

export default async function NotFound() {
  const t = await getI18nAsync("translation");

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center p-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-transparent to-transparent dark:from-primary/5"
      />

      <div
        aria-hidden="true"
        className="select-none absolute left-1/2 top-0 -z-10 -translate-x-1/2 text-[140px] font-extrabold tracking-tight text-primary/10 dark:text-primary/5"
      >
        404
      </div>

      <Card className="w-full max-w-xl overflow-hidden border-border/60 bg-background/70 backdrop-blur appear">
        <CardHeader className="space-y-4 text-center">
          <CardTitle className="text-2xl md:text-3xl">
            {t("notFound.title")}
          </CardTitle>
          <CardDescription className="text-sm md:text-base text-muted-foreground/90">
            {t("notFound.description")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2"
              button
              variant="default"
            >
              <Home className="size-4" />
              {t("notFound.button")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
