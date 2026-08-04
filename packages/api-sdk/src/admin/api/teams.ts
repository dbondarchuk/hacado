import {
  DeactivateMemberResult,
  OrganizationMember,
  TeamMemberListModel,
  UserRole,
  WithTotal,
} from "@timelish/types";
import {
  TeamsSearchParams,
  teamsSearchParamsSerializer,
} from "../search-params/teams";
import type { UserUpdate } from "../schemas/user";
import { AdminApiError, fetchAdminApi } from "./utils";

export type TeamInviteRole = Exclude<UserRole, "owner">;

export type TeamActionOk = { ok: true };
export type TeamActionErr = { ok: false; code: string; message?: string };
export type TeamActionResult = TeamActionOk | TeamActionErr;

export type TeamInvitation = {
  id: string;
  email: string;
  role: UserRole;
};

export type TeamUpcomingAppointment = {
  _id: string;
  dateTime: Date;
  customerName?: string;
};

async function readErrorCode(error: unknown): Promise<string | undefined> {
  if (!(error instanceof AdminApiError)) return undefined;
  try {
    const body = (await error.response.clone().json()) as {
      code?: string;
      error?: string;
    };
    return body.code ?? body.error;
  } catch {
    return undefined;
  }
}

export const getMembers = async (params: TeamsSearchParams = {}) => {
  console.debug("Getting team members", { params });
  const response = await fetchAdminApi(
    `/teams/members${teamsSearchParamsSerializer(params)}`,
    { method: "GET" },
  );
  const data = await response.json<WithTotal<TeamMemberListModel>>();
  console.debug("Team members retrieved successfully", { data });
  return data;
};

export const inviteMember = async (input: {
  email: string;
  role: TeamInviteRole;
}): Promise<TeamActionResult> => {
  console.debug("Inviting team member", { input });
  try {
    const response = await fetchAdminApi("/teams/invitations", {
      method: "POST",
      body: JSON.stringify(input),
    });
    await response.json();
    return { ok: true };
  } catch (error) {
    const code = (await readErrorCode(error)) ?? "invite_failed";
    return { ok: false, code };
  }
};

export const listInvitations = async (): Promise<
  | { ok: true; invitations: TeamInvitation[] }
  | { ok: false; code: string; invitations: TeamInvitation[] }
> => {
  console.debug("Listing team invitations");
  try {
    const response = await fetchAdminApi("/teams/invitations", {
      method: "GET",
    });
    const data = await response.json<{ invitations: TeamInvitation[] }>();
    return { ok: true, invitations: data.invitations ?? [] };
  } catch (error) {
    const code = (await readErrorCode(error)) ?? "list_failed";
    return { ok: false, code, invitations: [] };
  }
};

export const cancelInvitation = async (
  invitationId: string,
): Promise<TeamActionResult> => {
  console.debug("Canceling team invitation", { invitationId });
  try {
    const response = await fetchAdminApi(
      `/teams/invitations/${invitationId}`,
      { method: "DELETE" },
    );
    await response.json();
    return { ok: true };
  } catch (error) {
    const code = (await readErrorCode(error)) ?? "cancel_failed";
    return { ok: false, code };
  }
};

export const updateMemberRole = async (input: {
  memberId: string;
  role: TeamInviteRole;
}): Promise<TeamActionResult> => {
  console.debug("Updating team member role", { input });
  try {
    const response = await fetchAdminApi(
      `/teams/members/${input.memberId}/role`,
      {
        method: "PUT",
        body: JSON.stringify({ role: input.role }),
      },
    );
    await response.json();
    return { ok: true };
  } catch (error) {
    const code = (await readErrorCode(error)) ?? "update_failed";
    return { ok: false, code };
  }
};

export const getMemberUpcomingAppointments = async (
  memberId: string,
): Promise<
  | { ok: true; upcoming: TeamUpcomingAppointment[] }
  | { ok: false; code: string; upcoming: TeamUpcomingAppointment[] }
> => {
  console.debug("Checking member upcoming appointments", { memberId });
  try {
    const response = await fetchAdminApi(
      `/teams/members/${memberId}/upcoming-appointments`,
      { method: "GET" },
    );
    const data = await response.json<{ upcoming: TeamUpcomingAppointment[] }>();
    return { ok: true, upcoming: data.upcoming ?? [] };
  } catch (error) {
    const code = (await readErrorCode(error)) ?? "unauthorized";
    return { ok: false, code, upcoming: [] };
  }
};

export const deactivateMember = async (input: {
  memberId: string;
  force?: boolean;
}): Promise<DeactivateMemberResult | TeamActionErr> => {
  console.debug("Deactivating team member", { input });
  try {
    const response = await fetchAdminApi(
      `/teams/members/${input.memberId}/deactivate`,
      {
        method: "POST",
        body: JSON.stringify({ force: input.force }),
      },
    );
    return await response.json<DeactivateMemberResult>();
  } catch (error) {
    const code = (await readErrorCode(error)) ?? "unauthorized";
    return { ok: false, code };
  }
};

export const getInactiveMemberAppointmentWarnings = async (): Promise<{
  ok: boolean;
  warnings: Array<{
    memberId: string;
    memberName: string;
    count: number;
  }>;
}> => {
  console.debug("Getting inactive member appointment warnings");
  try {
    const response = await fetchAdminApi("/teams/inactive-warnings", {
      method: "GET",
    });
    return await response.json();
  } catch {
    return { ok: false, warnings: [] };
  }
};

export const getMemberProfile = async (memberId: string) => {
  console.debug("Getting team member profile", { memberId });
  const response = await fetchAdminApi(`/teams/members/${memberId}/profile`, {
    method: "GET",
  });
  return await response.json<OrganizationMember>();
};

export const updateMemberProfile = async (
  memberId: string,
  profile: Partial<UserUpdate>,
) => {
  console.debug("Updating team member profile", { memberId, profile });
  const response = await fetchAdminApi(`/teams/members/${memberId}/profile`, {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
  return await response.json<OrganizationMember>();
};
