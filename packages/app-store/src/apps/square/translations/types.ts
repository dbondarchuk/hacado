import { SQUARE_APP_NAME } from "../const";
import type {
  PrefixedKeys as SquareAdminAllKeys,
  Keys as SquareAdminKeys,
} from "./en/admin.keys";
import type {
  PrefixedKeys as SquarePublicAllKeys,
  Keys as SquarePublicKeys,
} from "./en/public.keys";

export type {
  SquareAdminAllKeys,
  SquareAdminKeys,
  SquarePublicAllKeys,
  SquarePublicKeys,
};

export const squareAdminNamespace = `app_${SQUARE_APP_NAME}_admin` as const;

export type SquareAdminNamespace = typeof squareAdminNamespace;

export const squarePublicNamespace = `app_${SQUARE_APP_NAME}_public` as const;

export type SquarePublicNamespace = typeof squarePublicNamespace;
