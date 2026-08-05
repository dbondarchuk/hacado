import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { ICS_APP_NAME } from "../const";
import type admin from "./en/admin.generated";

export type IcsAdminKeys = Leaves<typeof admin>;
export const icsAdminNamespace = `app_${ICS_APP_NAME}_admin` as const;

export type IcsAdminNamespace = typeof icsAdminNamespace;

export type IcsAdminAllKeys = AllKeys<IcsAdminNamespace, IcsAdminKeys>;
