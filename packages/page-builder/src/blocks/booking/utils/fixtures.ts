import {
  AvailabilityByMember,
  GetAppointmentOptionsResponse,
} from "@hacado/types";
import { DateTime } from "luxon";

/** Generates bookable demo slots for the next ~2 weeks (skips Sundays), as UTC wall-clock instants matching API availability encoding. */
export function demoAvailabilityByMember(
  memberIds: string[],
): AvailabilityByMember {
  const slots: Date[] = [];
  const start = DateTime.utc().startOf("day").plus({ days: 1 });

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const day = start.plus({ days: dayOffset });
    if (day.weekday === 7) continue;

    for (const hour of [9, 10, 11, 13, 14, 15, 16]) {
      slots.push(
        DateTime.utc(day.year, day.month, day.day, hour, 0, 0).toJSDate(),
      );
    }
  }

  return Object.fromEntries(
    memberIds.map((id) => [id, slots.map((slot) => new Date(slot.getTime()))]),
  );
}

export const demoBookingOptionsResponse: GetAppointmentOptionsResponse = {
  options: [
    {
      _id: "option-1",
      name: "Standard Consultation [Demo]",
      description: "A time-based consultation session.",
      durationMin: 30,
      durationMax: 60,
      durationStep: 15,
      pricePerHour: 20,
      isAutoConfirm: "inherit",
      isOnline: false,
      durationType: "flexible",
      staff: [
        { memberId: "member-1" },
        { memberId: "member-2", priceOverride: 25 },
      ],
      addons: [
        {
          _id: "addon-1",
          name: "Extra 15 Minutes",
          description: "Extend your session by 15 minutes.",
          price: 20,
          updatedAt: new Date(),
          organizationId: "organization",
        },
        {
          _id: "addon-2",
          name: "Priority Booking",
          description: "Get priority scheduling for your appointment.",
          price: 10,
          updatedAt: new Date(),
          organizationId: "organization",
        },
        {
          _id: "addon-3",
          name: "Session Recording",
          description: "Receive a recording of your session.",
          price: 15,
          updatedAt: new Date(),
          organizationId: "organization",
        },
      ],
      requireDeposit: "inherit",
      updatedAt: new Date(),
      organizationId: "organization",
      tips: { mode: "off", presets: [] },
    },
    {
      _id: "option-2",
      name: "Premium Consultation [Demo]",
      description: "A 60-minute in-depth consultation.",
      duration: 60,
      price: 90,
      durationType: "fixed",
      isAutoConfirm: "inherit",
      isOnline: false,
      staff: [
        { memberId: "member-1" },
        { memberId: "member-2", priceOverride: 100 },
      ],
      addons: [
        {
          _id: "addon-1",
          name: "Extra 15 Minutes",
          description: "Extend your session by 15 minutes.",
          price: 20,
          updatedAt: new Date(),
          organizationId: "organization",
        },
        {
          _id: "addon-2",
          name: "Priority Booking",
          description: "Get priority scheduling for your appointment.",
          price: 10,
          updatedAt: new Date(),
          organizationId: "organization",
        },
        {
          _id: "addon-3",
          name: "Session Recording",
          description: "Receive a recording of your session.",
          price: 15,
          updatedAt: new Date(),
          organizationId: "organization",
        },
      ],
      organizationId: "organization",
      requireDeposit: "inherit",
      updatedAt: new Date(),
      tips: { mode: "off", presets: [] },
    },
    {
      _id: "option-3",
      name: "Follow-up Session [Demo]",
      description: "A 20-minute follow-up appointment.",
      duration: 20,
      price: 30,
      durationType: "fixed",
      isAutoConfirm: "inherit",
      isOnline: false,
      staff: [{ memberId: "member-1" }],
      addons: [
        {
          _id: "addon-1",
          name: "Extra 15 Minutes",
          description: "Extend your session by 15 minutes.",
          price: 20,
          updatedAt: new Date(),
          organizationId: "organization",
        },
        {
          _id: "addon-2",
          name: "Priority Booking",
          description: "Get priority scheduling for your appointment.",
          price: 10,
          updatedAt: new Date(),
          organizationId: "organization",
        },
        {
          _id: "addon-3",
          name: "Session Recording",
          description: "Receive a recording of your session.",
          price: 15,
          updatedAt: new Date(),
          organizationId: "organization",
        },
      ],
      requireDeposit: "inherit",
      updatedAt: new Date(),
      organizationId: "organization",
      tips: { mode: "off", presets: [] },
    },
  ],
  fieldsSchema: {},
  showPromoCode: true,
  smsText: { notifications: true, reminders: true, other: false },
  members: [
    {
      id: "member-1",
      name: "Alex Morgan [Demo]",
      jobTitle: "Senior Hair Specialist",
      bio: "Senior specialist with 8 years of experience.",
      image: null,
    },
    {
      id: "member-2",
      name: "Jamie Lee [Demo]",
      bio: "Loves helping clients feel their best.",
      image: null,
    },
  ],
  catalog: [
    { type: "service", id: "option-1", serviceId: "option-1" },
    { type: "service", id: "option-2", serviceId: "option-2" },
    { type: "service", id: "option-3", serviceId: "option-3" },
  ],
  hasActiveCustomerPackages: false,
};
