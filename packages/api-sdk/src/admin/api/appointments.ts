"use client";

import {
  Appointment,
  AppointmentEventRequest,
  AppointmentHistoryEntry,
  AppointmentStatus,
  AppointmentWithReferenceDateDistance,
  AssetEntity,
  okStatus,
  Payment,
  WithTotal,
} from "@hacado/types";
import {
  AppointmentHistorySearchParams,
  serializeAppointmentHistorySearchParams,
} from "../search-params";
import {
  AppointmentsSearchParams,
  serializeAppointmentsSearchParams,
} from "../search-params/appointments";
import { fetchAdminApi } from "./utils";

export function getAppointments(
  searchParams: AppointmentsSearchParams & { referenceDate: Date },
): Promise<WithTotal<AppointmentWithReferenceDateDistance>>;
export function getAppointments(
  searchParams: AppointmentsSearchParams,
): Promise<WithTotal<Appointment>>;
export async function getAppointments(
  searchParams: AppointmentsSearchParams,
): Promise<WithTotal<Appointment | AppointmentWithReferenceDateDistance>> {
  console.debug("Getting appointments", {
    searchParams,
  });

  const serializedSearchParams =
    serializeAppointmentsSearchParams(searchParams);

  const result = await fetchAdminApi(`/appointments${serializedSearchParams}`, {
    method: "GET",
  });

  if (!result.ok) {
    throw new Error("Failed to get appointments");
  }

  const data = await result.json<
    WithTotal<Appointment | AppointmentWithReferenceDateDistance>
  >();

  console.debug("Appointments retrieved successfully", {
    total: data.total,
    count: data.items.length,
  });

  return data;
}

export const getAppointment = async (id: string) => {
  console.debug("Getting appointment", {
    appointmentId: id,
  });

  const result = await fetchAdminApi(`/appointments/${id}`, {
    method: "GET",
  });

  const data = await result.json<Appointment>();

  console.debug("Appointment retrieved successfully", {
    appointmentId: data._id,
  });

  return data;
};

export async function changeStatus(
  id: string,
  newStatus: AppointmentStatus,
  requestedByCustomer?: boolean,
) {
  console.debug("Changing appointment status", {
    appointmentId: id,
    newStatus,
  });

  try {
    const result = await fetchAdminApi(`/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status: newStatus,
        ...(requestedByCustomer !== undefined
          ? { requestedByCustomer }
          : {}),
      }),
    });

    return okStatus;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function updateNote(id: string, note?: string) {
  console.debug("Updating appointment note", {
    appointmentId: id,
    note,
  });

  try {
    const result = await fetchAdminApi(`/appointments/${id}/note`, {
      method: "PATCH",
      body: JSON.stringify({ note }),
    });

    return okStatus;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function addFiles(appointmentId: string, files: File[]) {
  console.debug("Adding appointment files", {
    appointmentId,
    fileCount: files.length,
  });

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("file", file);
  });

  try {
    const result = await fetchAdminApi(`/appointments/${appointmentId}/files`, {
      method: "POST",
      body: formData,
    });

    return result.json<AssetEntity>();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function reschedule(
  id: string,
  dateTime: Date,
  duration: number,
  doNotNotifyCustomer?: boolean,
) {
  console.debug("Rescheduling appointment", {
    appointmentId: id,
    newDateTime: dateTime.toISOString(),
    newDuration: duration,
    doNotNotifyCustomer,
  });

  try {
    const result = await fetchAdminApi(`/appointments/${id}/reschedule`, {
      method: "PATCH",
      body: JSON.stringify({
        dateTime,
        duration,
        doNotNotifyCustomer,
      }),
    });

    return okStatus;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const createAppointment = async (
  appointment: AppointmentEventRequest,
  files: Record<string, File> | undefined,
  confirmed: boolean = false,
) => {
  console.debug("Creating appointment", {
    optionId: appointment.optionId,
    dateTime: appointment.dateTime.toISOString(),
    duration: appointment.totalDuration,
    filesCount: files ? Object.keys(files).length : 0,
    confirmed,
    fieldsCount: Object.keys(appointment.fields).length,
  });

  try {
    const formData = new FormData();
    formData.append("appointment", JSON.stringify(appointment));
    Object.entries(files ?? {}).forEach(([key, file]) => {
      formData.append(`file_${key}`, file);
      formData.append("fileField", key);
    });

    formData.append("confirmed", confirmed.toString());

    const result = await fetchAdminApi(`/appointments`, {
      method: "POST",
      body: formData,
    });

    return result.json<Appointment>();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateAppointment = async (
  id: string,
  appointment: AppointmentEventRequest,
  files: Record<string, File> | undefined,
  confirmed: boolean = false,
  doNotNotifyCustomer: boolean = false,
) => {
  console.debug("Updating appointment", {
    appointmentId: id,
    optionId: appointment.optionId,
    dateTime: appointment.dateTime.toISOString(),
    duration: appointment.totalDuration,
    filesCount: files ? Object.keys(files).length : 0,
    confirmed,
    doNotNotifyCustomer,
    fieldsCount: Object.keys(appointment.fields).length,
  });

  try {
    const formData = new FormData();
    formData.append("appointment", JSON.stringify(appointment));
    Object.entries(files ?? {}).forEach(([key, file]) => {
      formData.append(`file_${key}`, file);
      formData.append("fileField", key);
    });
    formData.append("confirmed", confirmed.toString());
    formData.append("doNotNotifyCustomer", doNotNotifyCustomer.toString());

    const result = await fetchAdminApi(`/appointments/${id}`, {
      method: "PUT",
      body: formData,
    });

    return result.json<Appointment>();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAppointmentHistory = async (
  id: string,
  searchParams: AppointmentHistorySearchParams,
) => {
  console.debug("Getting appointment history", {
    searchParams,
  });

  const serializedSearchParams =
    serializeAppointmentHistorySearchParams(searchParams);

  const result = await fetchAdminApi(
    `/appointments/${id}/history${serializedSearchParams}`,
    {
      method: "GET",
    },
  );

  const data = await result.json<WithTotal<AppointmentHistoryEntry>>();

  console.debug("Appointment history retrieved successfully", {
    total: data.total,
    count: data.items.length,
  });

  return data;
};

export const getAppointmentPayments = async (id: string) => {
  console.debug("Getting appointment payments", {
    appointmentId: id,
  });

  const result = await fetchAdminApi(`/appointments/${id}/payments`, {
    method: "GET",
  });

  const data = await result.json<Payment[]>();

  console.debug("Appointment payments retrieved successfully", {
    appointmentId: id,
    count: data.length,
  });

  return data;
};
