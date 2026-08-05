import { Appointment, FieldType, ServiceField } from "@hacado/types";

export const getPhoneField = (
  appointment: Appointment,
  serviceFields: ServiceField[],
): string | undefined => {
  const phoneFields =
    serviceFields
      ?.filter((x) => (x.type as FieldType) === "phone")
      .map((x) => x.name) || [];

  const fields = new Set(
    ["phone", ...(phoneFields || [])].map((x) => x.toLowerCase()),
  );

  const [_, phone] =
    Object.entries(appointment.fields as Record<string, string>).find(
      ([field]) => fields.has(field.toLowerCase()),
    ) || [];

  if (!phone) {
    return;
  }

  return phone;
};
