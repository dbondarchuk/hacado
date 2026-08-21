import type { UserRole } from "./user";

/**
 * Canonical team permission catalog (resources → actions).
 * Better Auth access-control in admin is built from this; app code checks via `@hacado/utils`.
 */
export const teamPermissionStatements = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  ac: ["create", "read", "update", "delete"],
  appointment: [
    "create",
    "read",
    "readAll",
    "update",
    "updateAll",
    "reassign",
    "approve",
    "cancel",
  ],
  schedule: ["read", "readAll", "update", "updateAll", "manageCalendarSources"],
  service: ["read", "create", "update", "delete"],
  customer: ["create", "read", "update", "delete", "merge"],
  discount: ["read", "create", "update", "delete"],
  giftCard: ["read", "create", "update", "delete", "pay"],
  package: ["read", "create", "update", "delete", "sell", "adjust"],
  page: ["read", "update"],
  communication: ["read", "readAll"],
  app: ["install", "uninstall", "useCompany", "useUser", "installPrivileged"],
  billing: ["read", "manage"],
  /** In-store card payments synced from payment apps (review inbox). */
  syncedPayment: ["read", "manage"],
  team: ["invite", "remove", "updateRole", "read", "update"],
  settings: ["read", "update"],
  /** Organization activity feed and activity page. */
  activity: ["read"],
} as const;

export type TeamPermissionStatements = typeof teamPermissionStatements;
export type TeamPermissionResource = keyof TeamPermissionStatements;
export type TeamPermissionAction<R extends TeamPermissionResource> =
  TeamPermissionStatements[R][number];

/** Single resource/action pair used by nav and app menu gates. */
export type RequiredPermission = {
  [R in TeamPermissionResource]: {
    resource: R;
    action: TeamPermissionAction<R>;
  };
}[TeamPermissionResource];

/** Permissions granted to a single role (subset of the catalog). */
export type TeamRolePermissions = {
  [R in TeamPermissionResource]?: readonly TeamPermissionAction<R>[];
};

const ownerAppPermissions = {
  appointment: [
    "create",
    "read",
    "readAll",
    "update",
    "updateAll",
    "reassign",
    "approve",
    "cancel",
  ],
  schedule: ["read", "readAll", "update", "updateAll", "manageCalendarSources"],
  service: ["read", "create", "update", "delete"],
  customer: ["create", "read", "update", "delete", "merge"],
  discount: ["read", "create", "update", "delete"],
  giftCard: ["read", "create", "update", "delete", "pay"],
  package: ["read", "create", "update", "delete", "sell", "adjust"],
  page: ["read", "update"],
  communication: ["read", "readAll"],
  app: ["install", "uninstall", "useCompany", "useUser", "installPrivileged"],
  billing: ["read", "manage"],
  syncedPayment: ["read", "manage"],
  team: ["invite", "remove", "updateRole", "read", "update"],
  settings: ["read", "update"],
  activity: ["read"],
} as const satisfies TeamRolePermissions;

/**
 * Effective permissions per org role.
 * Includes Better Auth organization-plugin resources used by the admin app.
 */
export const teamRolePermissions = {
  owner: {
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    ac: ["create", "read", "update", "delete"],
    ...ownerAppPermissions,
  },
  admin: {
    organization: ["update"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    ac: ["create", "read", "update", "delete"],
    ...ownerAppPermissions,
  },
  coordinator: {
    appointment: [
      "create",
      "read",
      "readAll",
      "update",
      "updateAll",
      "reassign",
      "approve",
      "cancel",
    ],
    schedule: [
      "read",
      "readAll",
      "update",
      "updateAll",
      "manageCalendarSources",
    ],
    discount: ["read", "create", "update", "delete"],
    giftCard: ["read", "create", "update", "delete", "pay"],
    package: ["read", "sell"],
    page: ["read", "update"],
    communication: ["read", "readAll"],
    app: ["install", "uninstall", "useUser", "installPrivileged"],
    syncedPayment: ["read", "manage"],
    team: ["read"],
    settings: ["read"],
    service: ["read"],
    customer: ["create", "read", "update", "delete", "merge"],
  },
  staff: {
    appointment: ["create", "read", "readAll", "update"],
    schedule: ["read"],
    communication: ["read"],
    app: ["install", "uninstall", "useUser"],
    team: ["read"],
    service: ["read"],
    giftCard: ["read", "pay"],
    package: ["read", "sell"],
    discount: ["read"],
    customer: ["create", "read"],
  },
} as const satisfies Record<UserRole, TeamRolePermissions>;

export type TeamRoleKey = UserRole;
