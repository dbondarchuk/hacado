import {
  Appointment,
  CommunicationChannel,
  okStatus,
  Template,
  TemplateListModel,
  TemplateUpdateModel,
  WithTotal,
} from "@hacado/types";
import { FormattedArguments } from "@hacado/utils";
import {
  TemplateSearchParams,
  templateSearchParamsSerializer,
} from "../search-params";
import { fetchAdminApi } from "./utils";

export const getTemplate = async (id: string) => {
  console.debug("Getting template", {
    id,
  });

  const result = await fetchAdminApi(`/templates/${id}`);
  const data = await result.json<Template>();
  console.debug("Template retrieved successfully", {
    id,
  });

  return data;
};

export const getTemplates = async (params: TemplateSearchParams) => {
  console.debug("Getting templates", {
    params,
  });

  const result = await fetchAdminApi(
    `/templates${templateSearchParamsSerializer(params)}`,
  );

  const data = await result.json<WithTotal<TemplateListModel>>();
  console.debug("Templates retrieved successfully", {
    total: data.total,
    items: data.items.length,
  });

  return data;
};

export const createTemplate = async (template: TemplateUpdateModel) => {
  console.debug("Creating template", {
    template,
  });

  const result = await fetchAdminApi("/templates", {
    method: "POST",
    body: JSON.stringify(template),
  });

  const data = await result.json<Template>();
  console.debug("Template created successfully", {
    id: data._id,
  });

  return data;
};

export const updateTemplate = async (
  id: string,
  template: TemplateUpdateModel,
) => {
  console.debug("Updating template", {
    id,
    template,
  });

  const result = await fetchAdminApi(`/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(template),
  });

  const data = await result.json<typeof okStatus>();
  console.debug("Template updated successfully", {
    id,
  });

  return data;
};

export const deleteTemplate = async (id: string) => {
  console.debug("Deleting template", {
    id,
  });

  const result = await fetchAdminApi(`/templates/${id}`, {
    method: "DELETE",
  });

  const data = await result.json<Template>();
  console.debug("Template deleted successfully", {
    id,
    templateName: data.name,
    templateType: data.type,
  });

  return data;
};

export const deleteTemplates = async (ids: string[]) => {
  console.debug("Deleting templates", {
    ids,
  });

  const result = await fetchAdminApi(`/templates/delete`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  const data = await result.json<typeof okStatus>();
  console.debug("Templates deleted successfully", {
    ids,
  });

  return data;
};

export const checkUniqueName = async (name: string, id?: string) => {
  console.debug("Checking template name uniqueness", {
    name,
    id,
  });

  const result = await fetchAdminApi(
    `/templates/check?name=${encodeURIComponent(name)}${id ? `&id=${encodeURIComponent(id)}` : ""}`,
  );

  const data = await result.json<{ isUnique: boolean }>();
  console.debug("Template name uniqueness check completed", {
    name,
    id,
    isUnique: data.isUnique,
  });

  return data.isUnique;
};

export const getTemplateArguments = async (
  args: { appointmentId: string } | { customerId: string },
) => {
  console.debug("Getting template arguments", {
    args,
  });

  const result = await fetchAdminApi(
    `/templates/arguments?${"appointmentId" in args ? `appointmentId=${args.appointmentId}` : `customerId=${args.customerId}`}`,
  );

  const data = await result.json<FormattedArguments<Appointment>>();
  console.debug("Template arguments retrieved successfully", {
    args,
  });

  return data;
};

export const getDemoTemplateArguments = async (options?: {
  noAppointment?: boolean;
  waitlistEntry?: boolean;
}) => {
  console.debug("Getting demo template arguments", {
    options,
  });

  const result = await fetchAdminApi(
    `/templates/arguments/demo?${options?.noAppointment ? "noAppointment=true" : ""}${options?.waitlistEntry ? "waitlistEntry=true" : ""}`,
  );

  const data = await result.json<FormattedArguments<Appointment>>();
  console.debug("Demo template arguments retrieved successfully", {
    options,
  });

  return data;
};

export const getTemplateTemplates = async (type: CommunicationChannel) => {
  console.debug("Getting template templates", {
    type,
  });

  const result = await fetchAdminApi(`/templates/templates/${type}`);
  const data =
    await result.json<
      { id: string; name: string; type: CommunicationChannel }[]
    >();
  console.debug("Template templates retrieved successfully", {
    type,
  });

  return data;
};
