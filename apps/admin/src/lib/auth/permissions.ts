import {
  teamPermissionStatements,
  teamRolePermissions,
  type UserRole,
} from "@hacado/types";
import { createAccessControl } from "better-auth/plugins/access";

/**
 * Better Auth access-control built from shared `@hacado/types` role permissions.
 * Permission *checks* live in `@hacado/utils` (`hasPermission`, etc.).
 */
export const teamAc = createAccessControl(
  teamPermissionStatements as unknown as {
    readonly [K in keyof typeof teamPermissionStatements]: readonly string[];
  },
);

function toBetterAuthRoleStatements(
  permissions: (typeof teamRolePermissions)[UserRole],
) {
  return Object.fromEntries(
    Object.entries(permissions).map(([resource, actions]) => [
      resource,
      [...(actions as readonly string[])],
    ]),
  ) as Parameters<typeof teamAc.newRole>[0];
}

export const teamOrganizationRoles = {
  owner: teamAc.newRole(toBetterAuthRoleStatements(teamRolePermissions.owner)),
  admin: teamAc.newRole(toBetterAuthRoleStatements(teamRolePermissions.admin)),
  coordinator: teamAc.newRole(
    toBetterAuthRoleStatements(teamRolePermissions.coordinator),
  ),
  staff: teamAc.newRole(toBetterAuthRoleStatements(teamRolePermissions.staff)),
} as const;

export type TeamRoleKey = keyof typeof teamOrganizationRoles;
