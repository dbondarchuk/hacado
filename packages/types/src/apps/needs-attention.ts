import type { AllKeys, I18nNamespaces } from "@hacado/i18n";
import type { OrganizationMember } from "../users/member";
import type { SessionUser } from "../users/session-user";
import type { ConnectedAppData } from "./connected-app.data";

export type NeedsAttentionLevel = "info" | "warning" | "error";

export type NeedsAttentionI18n<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = {
  key: AllKeys<T, CustomKeys>;
  args?: Record<string, string | number>;
};

export type NeedsAttentionAction<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> =
  | { type: "link"; href: string; label: NeedsAttentionI18n<T, CustomKeys> }
  | { type: "update-app"; label: NeedsAttentionI18n<T, CustomKeys> };

export type NeedsAttentionItem<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = {
  /** Stable within this connected app, e.g. "requires-sender-settings". */
  id: string;
  /** Changes when the underlying condition changes. */
  fingerprint: string;
  level: NeedsAttentionLevel;
  title: NeedsAttentionI18n<T, CustomKeys>;
  description: NeedsAttentionI18n<T, CustomKeys>;
  action?: NeedsAttentionAction<T, CustomKeys>;
  order?: number;
};

export interface INeedsAttentionApp {
  getNeedAttentionItems(
    appData: ConnectedAppData,
    member: OrganizationMember | null,
    user: SessionUser,
  ): NeedsAttentionItem[] | Promise<NeedsAttentionItem[]>;
}
