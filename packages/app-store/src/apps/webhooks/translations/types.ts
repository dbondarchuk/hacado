import { WEBHOOKS_APP_NAME } from "../const";
import type {
  PrefixedKeys as WebhooksAdminAllKeys,
  Keys as WebhooksAdminKeys,
} from "./en/admin.keys";

export type { WebhooksAdminAllKeys, WebhooksAdminKeys };

export const webhooksAdminNamespace = `app_${WEBHOOKS_APP_NAME}_admin` as const;

export type WebhooksAdminNamespace = typeof webhooksAdminNamespace;
