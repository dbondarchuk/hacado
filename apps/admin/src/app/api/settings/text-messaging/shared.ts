import { getServicesContainer } from "@/app/utils";
import { memberEventSource } from "@hacado/types";

export const publicPageUrl = async (
  services: Awaited<ReturnType<typeof getServicesContainer>>,
  websiteUrl: string,
  pageId: string | undefined,
) => {
  const id = pageId?.trim();
  const origin = publicWebsiteUrl(websiteUrl);

  if (!id || !origin) return undefined;

  const page = await services.pagesService.getPage(id);
  const slug = page?.published ? page.slug?.replace(/^\/+/, "").trim() : "";
  if (!slug) return undefined;

  return `${origin}/${slug}`;
};

const publicWebsiteUrl = (websiteUrl: string) => {
  try {
    const url = new URL(websiteUrl.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    if (
      !url.hostname ||
      url.hostname === "undefined" ||
      url.hostname.endsWith(".undefined")
    ) {
      return undefined;
    }

    return url.origin;
  } catch {
    return undefined;
  }
};

const MAX_OPT_IN_PNG_BYTES = 5_000_000;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const pngFileFromDataUrl = (dataUrl: string) => {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=\r\n]+)$/.exec(dataUrl);
  if (!match) return null;

  const buffer = Buffer.from(match[1].replace(/\s/g, ""), "base64");
  if (
    buffer.length < PNG_MAGIC.length ||
    buffer.length > MAX_OPT_IN_PNG_BYTES
  ) {
    return null;
  }
  if (!PNG_MAGIC.every((byte, index) => buffer[index] === byte)) return null;

  return new File([new Uint8Array(buffer)], "sms-opt-in.png", {
    type: "image/png",
  });
};

export async function storeOptInImage(input: {
  services: Awaited<ReturnType<typeof getServicesContainer>>;
  memberId: string;
  websiteUrl: string;
  dataUrl?: string;
  logger: { warn: (data: unknown, message: string) => void };
}) {
  const base = publicWebsiteUrl(input.websiteUrl);
  const file = input.dataUrl ? pngFileFromDataUrl(input.dataUrl) : null;
  if (!file || !base) return undefined;

  try {
    const asset = await input.services.assetsService.createAsset(
      {
        filename: `sms-opt-in-${Date.now()}.png`,
        mimeType: "image/png",
        description: "SMS opt-in booking form",
      },
      file,
      memberEventSource(input.memberId),
    );
    return `${base}/assets/${asset.filename}`;
  } catch (error) {
    input.logger.warn({ error }, "SMS opt-in screenshot was not stored");
    return undefined;
  }
}
