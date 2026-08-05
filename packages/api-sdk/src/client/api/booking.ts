import {
  AppointmentRequest,
  CheckDuplicateAppointmentsResponse,
  GetAppointmentOptionsResponse,
  ModifyAppointmentInformation,
  ModifyAppointmentInformationRequest,
  ModifyAppointmentRequest,
} from "@hacado/types";
import { fetchClientApi } from "./utils";

export const getBookingOptions = async () => {
  console.debug("Getting booking options");
  const response = await fetchClientApi("/booking/options", {
    method: "GET",
  });

  const data = await response.json<GetAppointmentOptionsResponse>();
  console.debug("Booking options retrieved successfully", {
    data,
  });

  return data;
};

export const createAppointment = async (
  request: AppointmentRequest,
  files: {
    [field: string]: File;
  },
) => {
  console.debug("Creating appointment");

  const formData = new FormData();
  formData.append("json", JSON.stringify(request));
  Object.entries(files).forEach(([field, file]) => {
    formData.append(`file_${field}`, file);
    formData.append("fileField", field);
  });

  const response = await fetchClientApi("/booking", {
    method: "POST",
    body: formData,
  });

  const data = await response.json<{ success: boolean; id: string }>();
  console.debug("Appointment created successfully", { data });
  return data;
};

export const checkDuplicateAppointments = async (
  request: AppointmentRequest,
) => {
  console.debug("Checking duplicate appointments");

  const response = await fetchClientApi("/booking/duplicate", {
    method: "POST",
    body: JSON.stringify(request),
  });

  const data = await response.json<CheckDuplicateAppointmentsResponse>();
  console.debug("Duplicate appointments checked successfully", { data });
  return data;
};

export const getModifyAppointmentInformation = async (
  request: ModifyAppointmentInformationRequest,
) => {
  console.debug("Getting modify appointment information");

  const response = await fetchClientApi("/booking/modify", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(request),
  });

  const data = await response.json<ModifyAppointmentInformation>();
  console.debug("Modify appointment information retrieved successfully", {
    data,
  });
  return data;
};

export const modifyAppointment = async (
  appointmentId: string,
  request: ModifyAppointmentRequest,
) => {
  console.debug("Modifying appointment");

  const response = await fetchClientApi(`/booking/${appointmentId}/modify`, {
    method: "PUT",
    credentials: "include",
    body: JSON.stringify(request),
  });

  const data = await response.json<{ success: boolean }>();
  console.debug("Appointment modified successfully", { data });
  return data;
};
