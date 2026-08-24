import { teamAc, teamOrganizationRoles } from "@/lib/auth/permissions";
import { polarClient } from "@polar-sh/better-auth/client";
import {
  emailOTPClient,
  inferAdditionalFields,
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    organizationClient({
      ac: teamAc,
      roles: teamOrganizationRoles,
    }),
    polarClient(),
    lastLoginMethodClient(),
    emailOTPClient(),
  ],
});
