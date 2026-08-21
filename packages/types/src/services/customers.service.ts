import {
  Customer,
  CustomerListModel,
  CustomerSearchField,
  CustomerUpdateModel,
} from "../customers";
import { Query, WithTotal } from "../database";
import type { EventSource } from "../events/envelope";

export interface ICustomersService {
  getCustomer(
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<Customer | null>;
  getCustomers(
    query: Query & { priorityIds?: string[] },
  ): Promise<WithTotal<CustomerListModel>>;

  getAllCustomers(): Promise<Customer[]>;

  findCustomer(email: string, phone: string): Promise<Customer | null>;

  findCustomerBySearchField(
    search: string,
    field: CustomerSearchField,
  ): Promise<Customer | null>;

  findCustomerBySearchFields(
    searches: { search: string; field: CustomerSearchField }[],
  ): Promise<Customer | null>;

  createCustomer(
    customer: CustomerUpdateModel,
    source: EventSource,
  ): Promise<Customer>;
  updateCustomer(
    id: string,
    update: CustomerUpdateModel,
    source: EventSource,
  ): Promise<void>;

  getOrUpsertCustomer(
    fields: {
      name?: string;
      email: string;
      phone: string;
    },
    source: EventSource,
  ): Promise<Customer>;

  deleteCustomer(id: string, source: EventSource): Promise<Customer | null>;
  deleteCustomers(ids: string[], source: EventSource): Promise<void>;

  mergeCustomers(targetId: string, ids: string[]): Promise<void>;

  checkUniqueEmailAndPhone(
    emails: string[],
    phones: string[],
    id?: string,
  ): Promise<{ email: boolean; phone: boolean }>;
}
