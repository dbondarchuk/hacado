import type { SmsVerificationStatusPayload } from "@hacado/types/events";
import {
  SMS_VERIFICATION_CREATED_EVENT_TYPE,
  SMS_VERIFICATION_FAILED_EVENT_TYPE,
  SMS_VERIFICATION_PENDING_EVENT_TYPE,
  SMS_VERIFICATION_SUCCEEDED_EVENT_TYPE,
} from "@hacado/types/events";
import type { SmsRegistrationStatus } from "@hacado/types/text-message/registration";

export async function emitSmsVerificationStatusChange(input: {
  previousStatus?: SmsRegistrationStatus | null;
  nextStatus: SmsRegistrationStatus;
  firstSubmission: boolean;
  phoneNumber?: string;
  reason?: string;
  emit: (type: string, payload: SmsVerificationStatusPayload) => Promise<void>;
}) {
  const payload: SmsVerificationStatusPayload = {
    phoneNumber: input.phoneNumber,
    reason: input.reason,
  };

  if (input.firstSubmission && input.nextStatus === "pending") {
    await input.emit(SMS_VERIFICATION_CREATED_EVENT_TYPE, payload);
  }
  if (input.nextStatus === "pending" && input.previousStatus !== "pending") {
    await input.emit(SMS_VERIFICATION_PENDING_EVENT_TYPE, payload);
  }
  if (input.nextStatus === "rejected" && input.previousStatus !== "rejected") {
    await input.emit(SMS_VERIFICATION_FAILED_EVENT_TYPE, payload);
  }
  if (input.nextStatus === "verified" && input.previousStatus !== "verified") {
    await input.emit(SMS_VERIFICATION_SUCCEEDED_EVENT_TYPE, payload);
  }
}
