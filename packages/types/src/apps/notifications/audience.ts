import type { RequiredPermission } from "../../users/permissions";

/**
 * Who may receive a dashboard or push notification.
 * All specified fields are AND-ed. Omitted audience = org-wide (legacy).
 */
export type NotificationAudience = {
  /** Recipient must pass all of these permission checks. */
  requiredPermissions?: RequiredPermission[];
  /**
   * Recipient must pass canUpdateAppointment(user, appointmentMemberId).
   * Staff → only if assigned; roles with updateAll → all.
   */
  appointmentMemberId?: string;
  /** If set, recipient.memberId must be in this list. */
  memberIds?: string[];
};
