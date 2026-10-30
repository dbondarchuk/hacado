import { appsApi } from "@hacado/api-sdk/client/apps";
import { bookingApi } from "@hacado/api-sdk/client/booking";
import { customerAuthApi } from "@hacado/api-sdk/client/customer-auth";
import { ClientApiError } from "@hacado/api-sdk/client/utils";

import type {
  ModifyAppointmentRequest,
  ModifyAppointmentType,
} from "@hacado/types/booking";

import type {
  AppointmentListResponse,
  AppointmentResponse,
  AppointmentSummaryResponse,
  CheckSessionResponse,
  CustomerMeResponse,
  CustomerWaitlistEntriesResponse,
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
  const data = await customerAuthApi.checkSession();

  return {
    valid: true,
    name: data.name,
    email: data.email,
    phone: data.phone,
    smsConsent: data.smsConsent === true,
  };
};

export const getAuthOptionsAction = async () => {
  return customerAuthApi.getAuthOptions();
};

export const requestOtpAction = async (payload: {
  email?: string;

  phone?: string;
}) => {
  return customerAuthApi.requestOtp(payload);
};

export const verifyOtpAction = async (payload: {
  email?: string;

  phone?: string;

  otp: string;
}) => {
  return customerAuthApi.verifyOtp(payload);
};

export const logoutAction = async () => {
  await customerAuthApi.logout();
};

export const getAppointmentsAction = async (
  appId: string,
): Promise<GetAppointmentsResponse> =>
  cabinetCall(() =>
    appsApi.callAppApi<GetAppointmentsResponse>({
      appId,

      path: "cabinet/appointments",

      method: "GET",
    }),
  );

export const getAppointmentsSummaryAction = async (
  appId: string,
): Promise<AppointmentSummaryResponse> =>
  cabinetCall(() =>
    appsApi.callAppApi<AppointmentSummaryResponse>({
      appId,

      path: "cabinet/appointments/summary",

      method: "GET",
    }),
  );

export const getUpcomingAppointmentsAction = async (
  appId: string,
): Promise<AppointmentListResponse> =>
  cabinetCall(() =>
    appsApi.callAppApi<AppointmentListResponse>({
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
    appsApi.callAppApi<AppointmentListResponse>({
      appId,

      path: `cabinet/appointments/past?page=${page}&limit=${limit}`,

      method: "GET",
    }),
  );

export const getCustomerMeAction = async (
  appId: string,
): Promise<CustomerMeResponse> =>
  cabinetCall(() =>
    appsApi.callAppApi<CustomerMeResponse>({
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
    appsApi.callAppApi<AppointmentResponse>({
      appId,

      path: `cabinet/appointments/${appointmentId}`,

      method: "GET",
    }),
  );

export const getModifyInformationAction = async (args: {
  type: ModifyAppointmentType;

  appointmentId: string;
}): Promise<ModifyInformation> => {
  return bookingApi.getModifyAppointmentInformation({
    lookup: "appointmentId",

    type: args.type,

    appointmentId: args.appointmentId,
  });
};

export const getMyPackagesAction = async () => {
  return cabinetCall(() => customerAuthApi.getMyPackages());
};

export const getCustomerWaitlistEntriesAction = async (
  waitlistAppId: string,
): Promise<CustomerWaitlistEntriesResponse> =>
  cabinetCall(() =>
    appsApi.callAppApi<CustomerWaitlistEntriesResponse>({
      appId: waitlistAppId,
      path: "customer-waitlist-entries",
      method: "GET",
    }),
  );

export const dismissCustomerWaitlistEntryAction = async (
  waitlistAppId: string,
  payload: { id?: string; all?: boolean },
): Promise<void> => {
  await cabinetCall(() =>
    appsApi.callAppApi({
      appId: waitlistAppId,
      path: "dismiss-customer-waitlist-entry",
      method: "POST",
      body: payload,
    }),
  );
};

export const submitModifyAction = async (
  appointmentId: string,

  payload: ModifyAppointmentRequest,
): Promise<void> => {
  await bookingApi.modifyAppointment(appointmentId, payload);
};
