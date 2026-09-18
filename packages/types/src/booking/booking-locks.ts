import type { PublicStaffMember } from "./staff-assignment";

export type BookingLocks = {
  lockServiceId?: string | null;
  lockMemberId?: string | null;
};

export function applyBookingLocks<
  TOption extends { _id: string; staff?: { memberId: string }[] | null },
>(
  options: TOption[],
  members: PublicStaffMember[],
  locks?: BookingLocks,
): { options: TOption[]; members: PublicStaffMember[] } {
  const serviceId = locks?.lockServiceId || undefined;
  const memberId = locks?.lockMemberId || undefined;
  if (!serviceId && !memberId) {
    return { options, members };
  }

  let filteredOptions = options;
  if (serviceId) {
    filteredOptions = filteredOptions.filter(
      (option) => option._id === serviceId,
    );
  }
  if (memberId) {
    filteredOptions = filteredOptions.filter((option) =>
      option.staff?.some((assignment) => assignment.memberId === memberId),
    );
  }

  return {
    options: filteredOptions,
    members: memberId
      ? members.filter((member) => member.id === memberId)
      : members,
  };
}

/** Skip the service picker when it is locked to a fixed-duration service. */
export function shouldSkipLockedServiceStep(
  lockServiceId?: string | null,
  selectedOption?: { durationType?: string } | null,
) {
  return !!lockServiceId && selectedOption?.durationType === "fixed";
}

export function shouldSkipLockedMemberStep(lockMemberId?: string | null) {
  return !!lockMemberId;
}
