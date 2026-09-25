"use server";

import { auth } from "@/app/auth";
import { getActor } from "@/app/utils";
import { validateFaviconValue } from "@/lib/validate-favicon";
import { getLoggerFactory } from "@hacado/logger";
import {
  getPackSuggestedStyling,
  WEBSITE_PACK_IDS,
  type WebsitePackId,
} from "@hacado/page-builder/templates";
import { ServicesContainer } from "@hacado/services";
import {
  asOptionalField,
  fontName,
  zAssetName,
  type BrandConfiguration,
  type StylingConfiguration,
} from "@hacado/types";
import { headers } from "next/headers";
import * as z from "zod";

const installHexColor = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
  error: "install.personalization.invalidColor",
});

const installPersonalizationInputSchema = z.object({
  primaryColorHex: installHexColor,
  secondaryColorHex: installHexColor,
  primaryFont: fontName,
  secondaryFont: fontName,
  installLogo: asOptionalField(zAssetName).nullable(),
});

export type InstallPersonalizationInput = z.infer<
  typeof installPersonalizationInputSchema
>;

export async function applyInstallPersonalization(
  input: InstallPersonalizationInput,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const logger = getLoggerFactory("InstallActions")(
    "applyInstallPersonalization",
  );
  logger.debug({ input }, "Applying install personalization");
  const parsed = installPersonalizationInputSchema.safeParse(input);
  if (!parsed.success) {
    logger.error({ error: parsed.error }, "Invalid personalization input");
    return { ok: false, code: "invalid_input" };
  }

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;
  if (!session?.user || !organizationId) {
    logger.error({ session, organizationId }, "Unauthorized");
    return { ok: false, code: "unauthorized" };
  }
  if (!(session.user as { emailVerified?: boolean }).emailVerified) {
    logger.error({ userId: session.user.id }, "Email not verified");
    return { ok: false, code: "email_not_verified" };
  }

  const logo = parsed.data.installLogo?.trim();
  const services = ServicesContainer(organizationId, true);
  const eventSource = await getActor();
  const existingStyling =
    (await services.configurationService.getConfiguration("styling")) ?? {};
  const otherColors = (existingStyling.colors ?? []).filter(
    (c) => c.type !== "primary" && c.type !== "secondary",
  );

  const newStyling: StylingConfiguration = {
    ...existingStyling,
    colors: [
      ...otherColors,
      { type: "primary", value: parsed.data.primaryColorHex },
      { type: "secondary", value: parsed.data.secondaryColorHex },
    ],
    fonts: {
      ...(existingStyling.fonts ?? {}),
      primary: parsed.data.primaryFont,
      secondary: parsed.data.secondaryFont,
    },
  };

  await services.configurationService.setConfiguration(
    "styling",
    newStyling,
    eventSource,
  );

  logger.debug({ organizationId }, "Applied styling configuration");

  const brand = await services.configurationService.getConfiguration("brand");
  if (!brand || Object.keys(brand).length === 0) {
    logger.error({ organizationId }, "Brand configuration not found");
    return { ok: false, code: "no_brand" };
  }

  let favicon = brand.favicon;
  if (logo) {
    const faviconValidation = await validateFaviconValue(
      logo,
      services.assetsService,
    );

    if (faviconValidation.ok) {
      favicon = logo;
      logger.debug(
        { logo },
        "Install logo meets favicon rules; using as favicon",
      );
    } else {
      logger.debug(
        { logo, code: faviconValidation.code },
        "Install logo does not meet favicon rules; leaving favicon unchanged",
      );
    }
  }

  const newBrand: BrandConfiguration = {
    ...brand,
    logo: logo ?? brand.logo,
    favicon,
  };
  await services.configurationService.setConfiguration(
    "brand",
    newBrand,
    eventSource,
  );

  logger.debug({ organizationId }, "Applied install personalization");
  return { ok: true };
}

export type ApplyInstallPackStylingResult =
  | {
      ok: true;
      primaryColorHex: string;
      secondaryColorHex: string;
      primaryFont: string;
      secondaryFont: string;
    }
  | { ok: false; code: string };

/** Apply a website pack’s suggested colors and fonts to org styling. */
export async function applyInstallPackStyling(
  packId: string,
): Promise<ApplyInstallPackStylingResult> {
  const logger = getLoggerFactory("InstallActions")("applyInstallPackStyling");
  logger.debug({ packId }, "Applying install pack styling");

  if (!(WEBSITE_PACK_IDS as string[]).includes(packId)) {
    logger.error({ packId }, "Invalid website pack id");
    return { ok: false, code: "invalid_pack" };
  }

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;
  if (!session?.user || !organizationId) {
    logger.error({ session, organizationId }, "Unauthorized");
    return { ok: false, code: "unauthorized" };
  }
  if (!(session.user as { emailVerified?: boolean }).emailVerified) {
    logger.error({ userId: session.user.id }, "Email not verified");
    return { ok: false, code: "email_not_verified" };
  }

  const packStyling = getPackSuggestedStyling(packId as WebsitePackId);
  const services = ServicesContainer(organizationId, true);
  const eventSource = await getActor();
  const existingStyling =
    (await services.configurationService.getConfiguration("styling")) ?? {};

  const newStyling: StylingConfiguration = {
    ...existingStyling,
    colors: packStyling.colors,
    fonts: {
      ...(existingStyling.fonts ?? {}),
      ...(packStyling.fonts ?? {}),
    },
  };

  await services.configurationService.setConfiguration(
    "styling",
    newStyling,
    eventSource,
  );

  const primaryColorHex =
    packStyling.colors?.find((c) => c.type === "primary")?.value ?? "#2563eb";
  const secondaryColorHex =
    packStyling.colors?.find((c) => c.type === "secondary")?.value ??
    primaryColorHex;
  const primaryFont = packStyling.fonts?.primary ?? "Inter";
  const secondaryFont = packStyling.fonts?.secondary ?? "Playfair Display";

  logger.debug(
    { organizationId, packId, primaryColorHex, primaryFont },
    "Applied pack styling configuration",
  );

  return {
    ok: true,
    primaryColorHex,
    secondaryColorHex,
    primaryFont,
    secondaryFont,
  };
}
