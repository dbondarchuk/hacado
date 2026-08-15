import * as z from "zod";
import { asOptinalNumberField, zObjectId } from "../utils";

/** Embedded staff assignment + optional per-member price/duration overrides. */
export const staffAssignmentSchema = z.object({
  memberId: zObjectId("validation.staff.memberId.required"),
  priceOverride: asOptinalNumberField(
    z.coerce.number<number>().min(0, "validation.staff.priceOverride.min"),
  ),
  durationOverride: asOptinalNumberField(
    z.coerce
      .number<number>()
      .int("validation.staff.durationOverride.int")
      .min(1, "validation.staff.durationOverride.min"),
  ),
});

export type StaffAssignment = z.infer<typeof staffAssignmentSchema>;

export const staffAssignmentsSchema = z.array(staffAssignmentSchema).optional();

/**
 * Per-member addon override. Empty list = all parent-service staff can offer
 * the addon at base price/duration. Entries customize price/duration or mark
 * a member unavailable for the addon.
 */
export const addonStaffOverrideSchema = staffAssignmentSchema.extend({
  /** When true, this member cannot offer the addon. */
  unavailable: z.boolean().optional(),
});

export type AddonStaffOverride = z.infer<typeof addonStaffOverrideSchema>;

export const addonStaffOverridesSchema = z
  .array(addonStaffOverrideSchema)
  .optional();

/** Strip price/duration overrides when a member is marked unavailable. */
export function normalizeAddonStaffOverrides(
  staff: AddonStaffOverride[] | undefined,
): AddonStaffOverride[] | undefined {
  if (!staff?.length) return staff;
  return staff.map((override) => {
    if (!override.unavailable) return override;
    return {
      memberId: override.memberId,
      unavailable: true,
    };
  });
}

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

export function getAddonStaffOverride(
  staff: AddonStaffOverride[] | undefined,
  memberId: string | undefined | null,
): AddonStaffOverride | undefined {
  if (!staff?.length || !memberId) return undefined;
  return staff.find((s) => s.memberId === memberId);
}

/** False only when an override explicitly marks the member unavailable. */
export function isAddonAvailableForMember(
  staff: AddonStaffOverride[] | undefined,
  memberId: string | undefined | null,
): boolean {
  const override = getAddonStaffOverride(staff, memberId);
  return !override?.unavailable;
}

/** True when the member is on the service staff allowlist. */
export function isMemberAssignedToOption(
  staff: StaffAssignment[] | undefined,
  memberId: string | undefined | null,
): boolean {
  if (!memberId) return true;
  if (!staff?.length) return false;
  return staff.some((s) => s.memberId === memberId);
}

/**
 * True when the member may offer the addon (not explicitly marked unavailable).
 * Empty addon staff overrides = available to parent-service staff.
 */
export function isMemberAssignedToAddon(
  staff: AddonStaffOverride[] | undefined,
  memberId: string | undefined | null,
): boolean {
  return isAddonAvailableForMember(staff, memberId);
}

export function getUnassignedMemberIssues(args: {
  optionStaff: StaffAssignment[] | undefined;
  optionName?: string;
  addons?: { name: string; staff?: AddonStaffOverride[] }[];
  memberId: string | undefined | null;
}): {
  optionUnassigned: boolean;
  unassignedAddonNames: string[];
  needsAcknowledgement: boolean;
} {
  const optionUnassigned = !isMemberAssignedToOption(
    args.optionStaff,
    args.memberId,
  );
  const unassignedAddonNames = (args.addons || [])
    .filter((addon) => !isMemberAssignedToAddon(addon.staff, args.memberId))
    .map((addon) => addon.name);
  return {
    optionUnassigned,
    unassignedAddonNames,
    needsAcknowledgement: optionUnassigned || unassignedAddonNames.length > 0,
  };
}

export function effectiveAddonPrice(
  basePrice: number | undefined | null,
  staff: AddonStaffOverride[] | undefined,
  memberId: string | undefined | null,
): number | undefined {
  const override = getAddonStaffOverride(staff, memberId);
  if (override?.unavailable) return basePrice ?? undefined;
  return effectiveStaffPrice(basePrice, override);
}

export function effectiveAddonDuration(
  baseDuration: number | undefined | null,
  staff: AddonStaffOverride[] | undefined,
  memberId: string | undefined | null,
): number | undefined {
  const override = getAddonStaffOverride(staff, memberId);
  if (override?.unavailable) return baseDuration ?? undefined;
  return effectiveStaffDuration(baseDuration, override);
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
