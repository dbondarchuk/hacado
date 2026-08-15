import { fetchAdminApi } from "./utils";

export const addBookingAvailableOption = async (optionId: string) => {
  console.debug("Adding option to booking availability", { optionId });
  const response = await fetchAdminApi("/booking/options", {
    method: "POST",
    body: JSON.stringify({ optionId }),
  });

  const data = await response.json<{
    success: boolean;
    alreadyPresent?: boolean;
  }>();
  console.debug("Added option to booking availability", { optionId, data });
  return data;
};
