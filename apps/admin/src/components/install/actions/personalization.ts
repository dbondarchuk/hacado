"use server";

import { auth } from "@/app/auth";
import { getActor } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
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
  const newBrand: BrandConfiguration = {
    ...brand,
    logo: logo ?? brand.logo,
    favicon: logo ?? brand.favicon,
  };
  await services.configurationService.setConfiguration(
    "brand",
    newBrand,
    eventSource,
  );

  logger.debug({ organizationId }, "Applied install personalization");
  return { ok: true };
}
