import type { IServicesContainer } from "@hacado/types/services";

/** Content language for labels/copy (palette/fonts come from tools). */
export async function resolveGiftCardContentLanguage(
  services: IServicesContainer,
): Promise<string> {
  try {
    const brand = await services.configurationService.getConfiguration("brand");
    const language =
      typeof brand?.language === "string" ? brand.language.trim() : "";

    return language || "en";
  } catch {
    return "en";
  }
}
