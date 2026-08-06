import { fetchAdminApi } from "./utils";

export const getBillingPortalUrl = async () => {
  const response = await fetchAdminApi("/billing/portal");
  const data = await response.json<{ url: string }>();
  return data.url;
};
