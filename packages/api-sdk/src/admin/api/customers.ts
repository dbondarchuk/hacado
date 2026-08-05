import {
  Customer,
  CustomerListModel,
  CustomerUpdateModel,
  okStatus,
  WithTotal,
} from "@hacado/types";
import {
  CustomersSearchParams,
  customersSearchParamsSerializer,
} from "../search-params/customers";
import { fetchAdminApi } from "./utils";

export const getCustomer = async (id: string) => {
  console.debug("Getting customer", {
    id,
  });

  const response = await fetchAdminApi(`/customers/${id}`, {
    method: "GET",
  });

  const data = await response.json<Customer>();

  console.debug("Customer retrieved successfully", {
    data,
  });

  return data;
};

export const getCustomers = async (params: CustomersSearchParams) => {
  console.debug("Getting customers", {
    params,
  });

  const response = await fetchAdminApi(
    `/customers${customersSearchParamsSerializer(params)}`,
    {
      method: "GET",
    },
  );
  const data = await response.json<WithTotal<CustomerListModel>>();

  console.debug("Customers retrieved successfully", {
    data,
  });

  return data;
};

export const createCustomer = async (customer: CustomerUpdateModel) => {
  console.debug("Creating customer", {
    customer,
  });

  const response = await fetchAdminApi("/customers", {
    method: "POST",
    body: JSON.stringify(customer),
  });

  const data = await response.json<Customer>();

  console.debug("Customer created successfully", {
    data,
  });

  return data;
};

export const updateCustomer = async (
  id: string,
  customer: CustomerUpdateModel,
) => {
  console.debug("Updating customer", {
    id,
    customer,
  });

  const response = await fetchAdminApi(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(customer),
  });

  const data = await response.json<typeof okStatus>();

  console.debug("Customer updated successfully");
  return data;
};

export const deleteCustomer = async (id: string) => {
  console.debug("Deleting customer", {
    id,
  });

  const response = await fetchAdminApi(`/customers/${id}`, {
    method: "DELETE",
  });

  const data = await response.json<Customer>();
  console.debug("Customer deleted successfully", {
    data,
  });

  return data;
};

export const deleteCustomers = async (ids: string[]) => {
  console.debug("Deleting customers", {
    ids,
  });

  const response = await fetchAdminApi("/customers/delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Customers deleted successfully");

  return data;
};

export const mergeCustomers = async (targetId: string, ids: string[]) => {
  console.debug("Merging customers", {
    targetId,
    ids,
  });

  const response = await fetchAdminApi("/customers/merge", {
    method: "POST",
    body: JSON.stringify({ targetId, ids }),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Customers merged successfully");

  return data;
};

export const checkCustomerUniqueEmailAndPhone = async (
  emails: string[],
  phones: string[],
  id?: string,
) => {
  console.debug("Checking customer email and phone uniqueness", {
    emails,
    phones,
    id,
  });

  const searchParams = new URLSearchParams();
  emails.forEach((email) => searchParams.append("emails", email));
  phones.forEach((phone) => searchParams.append("phones", phone));
  if (id) {
    searchParams.set("id", id);
  }

  const response = await fetchAdminApi(
    `/customers/check?${searchParams.toString()}`,
    {
      method: "GET",
    },
  );

  const data = await response.json<{ email: boolean; phone: boolean }>();
  console.debug("Customer email and phone uniqueness check completed", {
    data,
  });

  return data;
};
