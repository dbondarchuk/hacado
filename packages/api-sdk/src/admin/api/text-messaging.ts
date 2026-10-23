import type {
  SmsMessagingAccess,
  SmsRegistrationInput,
  SmsRegistrationSaveResponse,
  TextMessagingSettingsInput,
} from "@hacado/types";
import { fetchAdminApi } from "./utils";

export const getTextMessagingAccess = async () => {
  const response = await fetchAdminApi("/settings/text-messaging");
  return response.json<SmsMessagingAccess>();
};

export const saveTextMessaging = async (body: TextMessagingSettingsInput) => {
  const response = await fetchAdminApi("/settings/text-messaging", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return response.json<{ success: true }>();
};

export const saveSmsVerification = async (
  body: SmsRegistrationInput & { optInImage?: string },
) => {
  const response = await fetchAdminApi(
    "/settings/text-messaging/verification",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  return response.json<SmsRegistrationSaveResponse>();
};
