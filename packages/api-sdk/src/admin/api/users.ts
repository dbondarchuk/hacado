import { OrganizationMember } from "@hacado/types";
import { UserUpdate } from "../schemas/user";
import { fetchAdminApi } from "./utils";

export const getMyUser = async () => {
  console.debug("Getting my user");
  const response = await fetchAdminApi("/users/me", {
    method: "GET",
  });

  const data = await response.json<OrganizationMember>();
  console.debug("My user retrieved successfully", { data });
  return data;
};

export const updateMyUser = async (user: Partial<UserUpdate>) => {
  console.debug("Updating my user", { user });
  const response = await fetchAdminApi("/users/me", {
    method: "PATCH",
    body: JSON.stringify(user),
  });
  const data = await response.json<OrganizationMember>();
  console.debug("My user updated successfully", { data });
  return data;
};
