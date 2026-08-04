import * as z from "zod";
import { zObjectId } from "../utils";

/** Embedded staff assignment + optional per-member price/duration overrides. */
export const staffAssignmentSchema = z.object({
  memberId: zObjectId("validation.staff.memberId.required"),
  priceOverride: z.coerce
    .number<number>()
    .min(0, "validation.staff.priceOverride.min")
    .optional(),
  durationOverride: z.coerce
    .number<number>()
    .int("validation.staff.durationOverride.int")
    .min(1, "validation.staff.durationOverride.min")
    .optional(),
});

export type StaffAssignment = z.infer<typeof staffAssignmentSchema>;

export const staffAssignmentsSchema = z.array(staffAssignmentSchema).optional();

export function effectiveStaffPrice(
  basePrice: number | undefined | null,
  assignment: StaffAssignment | undefined,
): number | undefined {
  if (assignment?.priceOverride != null) return assignment.priceOverride;
  return basePrice ?? undefined;
}

export function effectiveStaffDuration(
  baseDuration: number | undefined | null,
  assignment: StaffAssignment | undefined,
): number | undefined {
  if (assignment?.durationOverride != null) return assignment.durationOverride;
  return baseDuration ?? undefined;
}

export function minEffectivePrice(
  basePrice: number | undefined | null,
  staff: StaffAssignment[] | undefined,
): number | undefined {
  if (!staff?.length) return basePrice ?? undefined;
  const prices = staff
    .map((s) => effectiveStaffPrice(basePrice, s))
    .filter((p): p is number => p != null);
  if (!prices.length) return basePrice ?? undefined;
  return Math.min(...prices);
}

export function minEffectiveDuration(
  baseDuration: number | undefined | null,
  staff: StaffAssignment[] | undefined,
): number | undefined {
  if (!staff?.length) return baseDuration ?? undefined;
  const durations = staff
    .map((s) => effectiveStaffDuration(baseDuration, s))
    .filter((d): d is number => d != null);
  if (!durations.length) return baseDuration ?? undefined;
  return Math.min(...durations);
}

/** Public-safe staff member info exposed to the customer-facing booking UI. */
export type PublicStaffMember = {
  id: string;
  name: string;
  bio?: string | null;
  image?: string | null;
};

/** A staff member combined with their effective price/duration for a given service. */
export type ActiveStaffOption = {
  member: PublicStaffMember;
  assignment: StaffAssignment;
  effectivePrice?: number;
  effectiveDuration?: number;
};

/**
 * Resolves the active (currently employed) staff assigned to a service, combining the
 * embedded staff assignments with the public member directory and computing the
 * effective price/duration each staff member would charge for the service.
 */
export function getActiveStaffForAssignments(
  staff: StaffAssignment[] | undefined,
  members: PublicStaffMember[] | undefined,
  basePrice: number | undefined | null,
  baseDuration: number | undefined | null,
): ActiveStaffOption[] {
  if (!staff?.length || !members?.length) return [];
  const membersById = new Map(members.map((m) => [m.id, m]));

  return staff
    .map((assignment): ActiveStaffOption | undefined => {
      const member = membersById.get(assignment.memberId);
      if (!member) return undefined;
      return {
        member,
        assignment,
        effectivePrice: effectiveStaffPrice(basePrice, assignment),
        effectiveDuration: effectiveStaffDuration(baseDuration, assignment),
      };
    })
    .filter((option): option is ActiveStaffOption => !!option);
}

/**
 * Union of active staff assigned across multiple services (e.g. every service offered
 * by the organization), deduplicated by member id. Used for the "specialist-first"
 * flow entry point, before a specific service has been chosen.
 */
export function getActiveStaffAcrossAssignments(
  staffLists: (StaffAssignment[] | undefined)[],
  members: PublicStaffMember[] | undefined,
): PublicStaffMember[] {
  if (!members?.length) return [];
  const membersById = new Map(members.map((m) => [m.id, m]));
  const seen = new Set<string>();
  const result: PublicStaffMember[] = [];

  for (const staff of staffLists) {
    for (const assignment of staff || []) {
      if (seen.has(assignment.memberId)) continue;
      const member = membersById.get(assignment.memberId);
      if (!member) continue;
      seen.add(assignment.memberId);
      result.push(member);
    }
  }

  return result;
}
