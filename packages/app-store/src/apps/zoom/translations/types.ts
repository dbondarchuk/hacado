import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { ZOOM_APP_NAME } from "../const";
import type admin from "./en/admin.generated";

export type ZoomAdminKeys = Leaves<typeof admin>;
export const zoomAdminNamespace = `app_${ZOOM_APP_NAME}_admin` as const;

export type ZoomAdminNamespace = typeof zoomAdminNamespace;

export type ZoomAdminAllKeys = AllKeys<ZoomAdminNamespace, ZoomAdminKeys>;
