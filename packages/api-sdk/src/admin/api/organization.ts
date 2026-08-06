import { okStatus } from "@hacado/types";
import { OrganizationDomainInput } from "../schemas";
import { fetchAdminApi } from "./utils";

export const setCustomDomain = async (payload: OrganizationDomainInput) => {
  const response = await fetchAdminApi("/organization/domain", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.json<typeof okStatus>();
};

export const deleteCustomDomain = async () => {
  const response = await fetchAdminApi("/organization/domain", {
    method: "DELETE",
  });

  return response.json<typeof okStatus>();
};
