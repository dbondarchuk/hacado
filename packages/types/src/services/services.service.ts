import {
  ApplyCustomerDiscountRequest,
  AppointmentAddon,
  AppointmentAddonUpdateModel,
  AppointmentOption,
  AppointmentOptionUpdateModel,
  Discount,
  DiscountType,
  DiscountUpdateModel,
  FieldType,
} from "../booking";
import { ServiceField, ServiceFieldUpdateModel } from "../configuration";
import { Query, WithTotal } from "../database";
import type { EventSource } from "../events/envelope";
import { DateRange } from "../general";

export type IdName = {
  _id: string;
  name: string;
};

export type FieldsType<T extends boolean | undefined> = T extends true
  ? ServiceField & {
      addons: IdName[];
      options: IdName[];
    }
  : ServiceField;

export type AddonsType<T extends boolean | undefined> = T extends true
  ? AppointmentAddon & {
      options: IdName[];
    }
  : AppointmentAddon;

export interface IServicesService {
  /** Fields */
  getField(id: string): Promise<ServiceField | null>;
  getFields<T extends boolean | undefined = undefined>(
    query: Query & {
      type?: FieldType[];
    },
    includeUsage?: T,
  ): Promise<WithTotal<FieldsType<T>>>;
  getFieldsById(ids: string[]): Promise<ServiceField[]>;
  getFieldsByNames(names: string[]): Promise<ServiceField[]>;
  createField(
    field: ServiceFieldUpdateModel,
    source: EventSource,
  ): Promise<ServiceField>;
  updateField(
    id: string,
    update: ServiceFieldUpdateModel,
    source: EventSource,
  ): Promise<void>;
  deleteField(id: string, source: EventSource): Promise<ServiceField | null>;
  deleteFields(ids: string[], source: EventSource): Promise<void>;
  checkFieldUniqueName(name: string, id?: string): Promise<boolean>;

  /** Addons */
  getAddon(id: string): Promise<AppointmentAddon | null>;
  getAddons<T extends boolean | undefined = undefined>(
    query: Query,
    includeUsage?: T,
  ): Promise<WithTotal<AddonsType<T>>>;
  getAddonsById(ids: string[]): Promise<AppointmentAddon[]>;
  createAddon(
    addon: AppointmentAddonUpdateModel,
    source: EventSource,
  ): Promise<AppointmentAddon>;
  updateAddon(
    id: string,
    update: AppointmentAddonUpdateModel,
    source: EventSource,
  ): Promise<void>;
  deleteAddon(
    id: string,
    source: EventSource,
  ): Promise<AppointmentAddon | null>;
  deleteAddons(ids: string[], source: EventSource): Promise<void>;
  checkAddonUniqueName(name: string, id?: string): Promise<boolean>;

  /** Options */
  getOption(id: string): Promise<AppointmentOption | null>;
  getOptions(
    query: Query & { priorityIds?: string[] },
  ): Promise<WithTotal<AppointmentOption>>;
  createOption(
    addon: AppointmentOptionUpdateModel,
    source: EventSource,
  ): Promise<AppointmentOption>;
  updateOption(
    id: string,
    update: AppointmentOptionUpdateModel,
    source: EventSource,
  ): Promise<void>;
  deleteOption(
    id: string,
    source: EventSource,
  ): Promise<AppointmentOption | null>;
  deleteOptions(ids: string[], source: EventSource): Promise<void>;
  checkOptionUniqueName(name: string, id?: string): Promise<boolean>;

  /** Discounts */

  getDiscount(id: string): Promise<Discount | null>;
  getDiscountByCode(code: string): Promise<Discount | null>;
  getDiscounts(
    query: Query & {
      enabled?: boolean[];
      type?: DiscountType[];
      range?: DateRange;
      priorityIds?: string[];
    },
  ): Promise<
    WithTotal<
      Discount & {
        usedCount: number;
      }
    >
  >;
  createDiscount(
    discount: DiscountUpdateModel,
    source: EventSource,
  ): Promise<Discount>;
  updateDiscount(
    id: string,
    update: DiscountUpdateModel,
    source: EventSource,
  ): Promise<void>;
  deleteDiscount(id: string, source: EventSource): Promise<Discount | null>;
  deleteDiscounts(ids: string[], source: EventSource): Promise<void>;
  checkDiscountUniqueNameAndCode(
    name?: string,
    codes?: string[],
    id?: string,
  ): Promise<{ name: boolean; code: Record<string, boolean> }>;

  applyDiscount(
    request: ApplyCustomerDiscountRequest,
  ): Promise<Discount | null>;

  hasActiveDiscounts(date: Date): Promise<boolean>;
}
