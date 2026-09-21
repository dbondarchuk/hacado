import {
  ConnectedOauthAppTokens,
  zNonEmptyString,
  zTaggedUnion,
} from "@hacado/types";
import * as z from "zod";

export const googleAnalyticsConfigurationSchema = z.object({
  propertyId: z.string().optional(),
  propertyName: z.string().optional(),
  streamId: z.string().optional(),
  streamName: z.string().optional(),
  measurementId: z.string().optional(),
  /** Encrypted Measurement Protocol API secret. */
  apiSecret: z.string().optional(),
});

export type GoogleAnalyticsConfiguration = ConnectedOauthAppTokens &
  z.infer<typeof googleAnalyticsConfigurationSchema>;

export const dataStreamListItemSchema = z.object({
  propertyId: zNonEmptyString(),
  propertyName: zNonEmptyString(),
  streamId: zNonEmptyString(),
  streamName: zNonEmptyString(),
  measurementId: zNonEmptyString(),
});

export type DataStreamListItem = z.infer<typeof dataStreamListItemSchema>;

export const GetDataStreamListRequestType = "get-data-stream-list" as const;
export const GetSelectedDataStreamRequestType =
  "get-selected-data-stream" as const;
export const SetDataStreamRequestType = "set-data-stream" as const;

export const setDataStreamRequestSchema = z.object({
  stream: dataStreamListItemSchema,
});

export type SetDataStreamRequest = z.infer<typeof setDataStreamRequestSchema>;

export const requestActionSchema = zTaggedUnion([
  { type: GetDataStreamListRequestType },
  { type: GetSelectedDataStreamRequestType },
  { type: SetDataStreamRequestType, data: setDataStreamRequestSchema },
]);

export type RequestAction = z.infer<typeof requestActionSchema>;
