import type { SmsOptInPreviewProps } from "@hacado/page-builder/opt-in-preview-types";
import type { IServicesContainer } from "@hacado/types";

export async function loadSmsOptInPreview(
  services: IServicesContainer,
): Promise<SmsOptInPreviewProps> {
  const booking = await services.bookingService.getAppointmentOptions();
  const option = booking.options[0];
  if (!option) return { service: null, formFields: [] };

  const formFields = (option.fields ?? []).flatMap((ref) => {
    const field = booking.fieldsSchema[ref.id];
    if (!field) return [];

    return [
      {
        name: field.name,
        type: field.type,
        required: !!field.required || !!ref.required,
        data: field.data,
      },
    ];
  });

  return {
    service: { _id: option._id, name: option.name },
    formFields,
  };
}
