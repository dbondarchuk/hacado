import { ConnectedAppStatus } from "@hacado/types/apps";

export const appStatusTextClasses: Record<ConnectedAppStatus, string> = {
  connected: "text-green-500",
  failed: "text-red-500",
  pending: "text-yellow-500",
};
