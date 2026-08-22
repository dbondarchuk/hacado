import type { ClientSession } from "mongodb";
import type {
  AppointmentPackage,
  AppointmentPackageListModel,
  AppointmentPackageStatus,
  AppointmentPackageUpdateModel,
  AppointmentPackageUsage,
  CustomerPackage,
  CustomerPackageListModel,
  PackageAdjustRequest,
  PackageEligibilityResult,
  PackagePurchaseChannel,
} from "../booking/appointment-package";
import type { Query } from "../database/query";
import type { WithTotal } from "../database/with-total";
import type { EventSource } from "../events/envelope";

export type IssueCustomerPackageInput = {
  packageId: string;
  customerId: string;
  channel: PackagePurchaseChannel;
  source: EventSource;
  paymentId?: string;
  paymentIntentId?: string;
  price?: number;
  session?: ClientSession;
};

export type RedeemPackageInput = {
  customerPackageId: string;
  appointmentId: string;
  optionId: string;
  memberId: string;
  appointmentDate: Date;
  optionStaffMemberIds: string[];
  source: EventSource;
  session?: ClientSession;
};

export type IPackagesService = {
  createPackage(
    data: AppointmentPackageUpdateModel,
    source: EventSource,
  ): Promise<AppointmentPackage>;
  updatePackage(
    id: string,
    data: AppointmentPackageUpdateModel,
    source: EventSource,
  ): Promise<AppointmentPackage | null>;
  setPackageStatus(
    id: string,
    status: AppointmentPackageStatus,
    source: EventSource,
  ): Promise<AppointmentPackage | null>;
  deletePackage(id: string, source: EventSource): Promise<boolean>;
  getPackage(id: string): Promise<AppointmentPackage | null>;
  getPackages(
    query: Query & {
      status?: AppointmentPackageStatus[];
      isPublic?: boolean;
      priorityIds?: string[];
    },
  ): Promise<WithTotal<AppointmentPackageListModel>>;
  getPublicPackages(): Promise<AppointmentPackage[]>;
  hasActiveCustomerPackages(): Promise<boolean>;
  issue(input: IssueCustomerPackageInput): Promise<CustomerPackage>;
  issueFromPayment(input: {
    paymentIntentId: string;
    packageId: string;
    customerId: string;
    channel: PackagePurchaseChannel;
    source: EventSource;
    paymentId?: string;
    session?: ClientSession;
  }): Promise<CustomerPackage>;
  redeem(input: RedeemPackageInput): Promise<AppointmentPackageUsage>;
  restoreForAppointment(input: {
    appointmentId: string;
    source: EventSource;
    session?: ClientSession;
  }): Promise<void>;
  adjust(
    customerPackageId: string,
    request: PackageAdjustRequest,
    source: EventSource,
  ): Promise<CustomerPackage>;
  /** Persist expired status and emit when due; returns null if not expired / not found. */
  expireIfDue(
    customerPackageId: string,
    source: EventSource,
  ): Promise<CustomerPackage | null>;
  getCustomerPackage(id: string): Promise<CustomerPackageListModel | null>;
  getCustomerPackages(
    query: Query & {
      customerId?: string | string[];
      status?: CustomerPackage["status"][];
      packageId?: string | string[];
    },
  ): Promise<WithTotal<CustomerPackageListModel>>;
  findEligible(input: {
    customerId: string;
    optionId: string;
    memberId: string;
    appointmentDate: Date;
    optionStaffMemberIds: string[];
  }): Promise<CustomerPackage[]>;
  canUsePackageForAppointment(input: {
    customerPackageId: string;
    optionId: string;
    memberId: string;
    appointmentDate: Date;
    optionStaffMemberIds: string[];
  }): Promise<PackageEligibilityResult>;
};
