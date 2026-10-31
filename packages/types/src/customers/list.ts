import { Appointment } from "../booking/appointment";
import { Customer } from "./customer";

export type CustomerListModel = Pick<
  Customer,
  "_id" | "avatar" | "name" | "phone" | "email" | "isDeleted" | "deletedAt"
> & {
  appointmentsCount: number;
  lastAppointment?: Appointment;
  nextAppointment?: Appointment;
  /** Latest consent is on and the number is not opted out. */
  smsConsent?: boolean;
};

export type CustomerSmsConsentStatus = {
  consented: boolean;
  optedOut: boolean;
};

export type CustomerSearchField = "name" | "email" | "phone";
