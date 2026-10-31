import { getLoggerFactory } from "@hacado/logger";
import { Telnyx } from "telnyx";
import { getTelnyxConfiguration } from "./config";

export class TelnyxWebhookConfigError extends Error {}

export const unwrapTelnyxWebhook = async <T>(
  bodyText: string,
  headers: Headers,
): Promise<T> => {
  const logger = getLoggerFactory("TelnyxWebhook")("unwrap");
  const config = getTelnyxConfiguration();
  if (!config.publicKey) {
    logger.error("TELNYX_PUBLIC_KEY is not configured");
    throw new TelnyxWebhookConfigError("TELNYX_PUBLIC_KEY is not configured");
  }

  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });

  const client = new Telnyx({
    apiKey: config.apiKey || "webhook",
    publicKey: config.publicKey,
  });

  return (await client.webhooks.unwrap(bodyText, { headers: record })) as T;
};
