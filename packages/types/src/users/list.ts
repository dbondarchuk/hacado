import type { OrganizationMember } from "./member";

export type TeamMemberListModel = Omit<OrganizationMember, "calendarSources">;
