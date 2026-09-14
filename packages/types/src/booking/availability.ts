export type Availability = Date[];

/** Availability slots keyed by organization member id. */
export type AvailabilityByMember = Record<string, Availability>;
