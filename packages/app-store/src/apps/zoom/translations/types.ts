import { ZOOM_APP_NAME } from "../const";
import type {
  PrefixedKeys as ZoomAdminAllKeys,
  Keys as ZoomAdminKeys,
} from "./en/admin.keys";

export type { ZoomAdminAllKeys, ZoomAdminKeys };

export const zoomAdminNamespace = `app_${ZOOM_APP_NAME}_admin` as const;

export type ZoomAdminNamespace = typeof zoomAdminNamespace;
