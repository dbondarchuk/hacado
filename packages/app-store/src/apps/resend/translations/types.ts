import { RESEND_APP_NAME } from "../const";
import type {
  PrefixedKeys as ResendAdminAllKeys,
  Keys as ResendAdminKeys,
} from "./en/admin.keys";

export type { ResendAdminAllKeys, ResendAdminKeys };

export const resendAdminNamespace = `app_${RESEND_APP_NAME}_admin` as const;

export type ResendAdminNamespace = typeof resendAdminNamespace;
