import { ClientApiError } from "./api/utils";

export type BookingSubmitErrorMessages = {
  submitTitle: string;
  submitDescription: string;
  timeNotAvailableDescription: string;
  limitReachedTitle: string;
  limitReachedDescription: string;
};

export type BookingSubmitErrorKind =
  | "time_not_available"
  | "limit_reached"
  | "unknown";

export type BookingSubmitErrorResult =
  | { handled: true; kind: Exclude<BookingSubmitErrorKind, "unknown"> }
  | { handled: false; kind: "unknown" };

export async function getBookingSubmitErrorKind(
  e: unknown,
): Promise<BookingSubmitErrorKind> {
  if (!(e instanceof ClientApiError)) {
    return "unknown";
  }

  try {
    if (e.status === 400) {
      const error = await e.response.json();
      if (error.error === "time_not_available") {
        return "time_not_available";
      }

      return "unknown";
    }

    if (e.status === 402) {
      const error = await e.response.json();
      if (
        error.code === "limit_reached" ||
        error.code === "appointment_limit_reached"
      ) {
        return "limit_reached";
      }
    }
  } catch {
    return "unknown";
  }

  return "unknown";
}

export async function handleBookingSubmitError(
  e: unknown,
  messages: BookingSubmitErrorMessages,
  showError: (title: string, description: string) => void,
): Promise<BookingSubmitErrorResult> {
  const kind = await getBookingSubmitErrorKind(e);

  switch (kind) {
    case "time_not_available":
      showError(messages.submitTitle, messages.timeNotAvailableDescription);
      return { handled: true, kind };
    case "limit_reached":
      showError(messages.limitReachedTitle, messages.limitReachedDescription);
      return { handled: true, kind };
    default:
      return { handled: false, kind: "unknown" };
  }
}
