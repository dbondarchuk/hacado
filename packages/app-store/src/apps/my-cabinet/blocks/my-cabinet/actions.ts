import { clientApi, ClientApiError } from "@hacado/api-sdk";

import type {
  ModifyAppointmentRequest,
  ModifyAppointmentType,
} from "@hacado/types";

import type {
  AppointmentListResponse,
  AppointmentResponse,
  AppointmentSummaryResponse,
  CheckSessionResponse,
  CustomerMeResponse,
  GetAppointmentsResponse,
  ModifyInformation,
} from "./types";

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
  }
}

async function cabinetCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ClientApiError && error.status === 401) {
      throw new SessionExpiredError();
    }

    throw error;
  }
}

export const checkSessionAction = async (): Promise<CheckSessionResponse> => {
  const data = await clientApi.customerAuth.checkSession();

  return { valid: true, name: data.name, email: data.email, phone: data.phone };
};

export const getAuthOptionsAction = async () => {
  return clientApi.customerAuth.getAuthOptions();
};

export const requestOtpAction = async (payload: {
  email?: string;

  phone?: string;
}) => {
  return clientApi.customerAuth.requestOtp(payload);
};

export const verifyOtpAction = async (payload: {
  email?: string;

  phone?: string;

  otp: string;
}) => {
  return clientApi.customerAuth.verifyOtp(payload);
};

export const logoutAction = async () => {
  await clientApi.customerAuth.logout();
};

export const getAppointmentsAction = async (
  appId: string,
): Promise<GetAppointmentsResponse> =>
  cabinetCall(() =>
    clientApi.apps.callAppApi<GetAppointmentsResponse>({
      appId,

      path: "cabinet/appointments",

      method: "GET",
    }),
  );

export const getAppointmentsSummaryAction = async (
  appId: string,
): Promise<AppointmentSummaryResponse> =>
  cabinetCall(() =>
    clientApi.apps.callAppApi<AppointmentSummaryResponse>({
      appId,

      path: "cabinet/appointments/summary",

      method: "GET",
    }),
  );

export const getUpcomingAppointmentsAction = async (
  appId: string,
): Promise<AppointmentListResponse> =>
  cabinetCall(() =>
    clientApi.apps.callAppApi<AppointmentListResponse>({
      appId,

      path: "cabinet/appointments/upcoming",

      method: "GET",
    }),
  );

export const getPastAppointmentsAction = async (
  appId: string,

  page: number,

  limit = 10,
): Promise<AppointmentListResponse> =>
  cabinetCall(() =>
    clientApi.apps.callAppApi<AppointmentListResponse>({
      appId,

      path: `cabinet/appointments/past?page=${page}&limit=${limit}`,

      method: "GET",
    }),
  );

export const getCustomerMeAction = async (
  appId: string,
): Promise<CustomerMeResponse> =>
  cabinetCall(() =>
    clientApi.apps.callAppApi<CustomerMeResponse>({
      appId,

      path: "cabinet/me",

      method: "GET",
    }),
  );

export const getAppointmentByIdAction = async (
  appId: string,

  appointmentId: string,
): Promise<AppointmentResponse> =>
  cabinetCall(() =>
    clientApi.apps.callAppApi<AppointmentResponse>({
      appId,

      path: `cabinet/appointments/${appointmentId}`,

      method: "GET",
    }),
  );

export const getModifyInformationAction = async (args: {
  type: ModifyAppointmentType;

  appointmentId: string;
}): Promise<ModifyInformation> => {
  return clientApi.booking.getModifyAppointmentInformation({
    lookup: "appointmentId",

    type: args.type,

    appointmentId: args.appointmentId,
  });
};

export const submitModifyAction = async (
  appointmentId: string,

  payload: ModifyAppointmentRequest,
): Promise<void> => {
  await clientApi.booking.modifyAppointment(appointmentId, payload);
};
