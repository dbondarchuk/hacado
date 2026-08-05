import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { SQUARE_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";
import type publicKeys from "./en/public.generated";

export type SquareAdminKeys = Leaves<typeof adminKeys>;
export const squareAdminNamespace = `app_${SQUARE_APP_NAME}_admin` as const;

export type SquareAdminNamespace = typeof squareAdminNamespace;

export type SquareAdminAllKeys = AllKeys<SquareAdminNamespace, SquareAdminKeys>;

export type SquarePublicKeys = Leaves<typeof publicKeys>;
export const squarePublicNamespace = `app_${SQUARE_APP_NAME}_public` as const;

export type SquarePublicNamespace = typeof squarePublicNamespace;

export type SquarePublicAllKeys = AllKeys<
  SquarePublicNamespace,
  SquarePublicKeys
>;
