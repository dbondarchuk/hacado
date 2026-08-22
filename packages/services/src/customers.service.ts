import {
  Customer,
  CUSTOMER_CREATED_EVENT_TYPE,
  CUSTOMER_DELETED_EVENT_TYPE,
  CUSTOMER_UPDATED_EVENT_TYPE,
  CustomerListModel,
  CustomerSearchField,
  CustomerUpdateModel,
  IEventService,
  Leaves,
  openAppointmentStatusMongoFilter,
  Query,
  WithTotal,
  type CustomerCreatedPayload,
  type CustomerDeletedPayload,
  type CustomerUpdatedPayload,
  type EventSource,
  type ICustomersService,
} from "@hacado/types";
import { buildSearchQuery, escapeRegex } from "@hacado/utils";
import { Filter, ObjectId, Sort } from "mongodb";
import {
  APPOINTMENTS_COLLECTION_NAME,
  CUSTOMERS_COLLECTION_NAME,
} from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

function enrichEventSourceWithCustomerId(
  eventSource: EventSource,
  customerId: string,
): EventSource {
  if (eventSource.actor === "customer") {
    return { ...eventSource, actorId: customerId };
  }

  return eventSource;
}

export class CustomersService extends BaseService implements ICustomersService {
  public constructor(
    organizationId: string,
    private readonly eventService: IEventService,
  ) {
    super("CustomersService", organizationId);
  }

  public async getCustomer(
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<Customer | null> {
    const logger = this.loggerFactory("getCustomer");
    logger.debug({ customerId: id }, "Getting customer by id");

    const db = await getDbConnection();

    const collection = db.collection<Customer>(CUSTOMERS_COLLECTION_NAME);

    const customer = await collection.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!customer) {
      logger.warn({ customerId: id }, "Customer not found");
    } else if (!options?.includeDeleted && customer.isDeleted) {
      logger.warn({ customerId: id }, "Customer is deleted");
      return null;
    } else {
      logger.debug(
        {
          customerId: id,
          name: customer.name,
        },
        "Customer found",
      );
    }

    return customer;
  }

  public async getAllCustomers(): Promise<Customer[]> {
    const logger = this.loggerFactory("getAllCustomers");
    logger.debug("Getting all customers");

    const db = await getDbConnection();

    const collection = db.collection<Customer>(CUSTOMERS_COLLECTION_NAME);
    const customers = await collection
      .find({
        organizationId: this.organizationId,
      })
      .toArray();

    logger.debug({ count: customers.length }, "Got all customers");

    return customers;
  }

  public async getCustomers(
    query: Query & { priorityIds?: string[] },
  ): Promise<WithTotal<CustomerListModel>> {
    const logger = this.loggerFactory("getCustomers");
    logger.debug({ query }, "Getting customers");

    const db = await getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { "lastAppointment.dateTime": -1 };

    const filter: Filter<Customer> = {
      organizationId: this.organizationId,
      isDeleted: { $ne: true },
    };

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<Customer>(
        { $regex },
        "name",
        "phone",
        "email",
        "knownNames",
        "knownEmails",
        "knownPhones",
        "note",
      );

      filter.$or = queries;
    }

    const priorityStages = query.priorityIds
      ? [
          {
            $facet: {
              priority: [
                {
                  $match: {
                    _id: {
                      $in: query.priorityIds,
                    },
                    organizationId: this.organizationId,
                  },
                },
              ],
              other: [
                {
                  $match: {
                    ...filter,
                    _id: {
                      $nin: query.priorityIds,
                    },
                  },
                },
                {
                  $sort: sort,
                },
              ],
            },
          },
          {
            $project: {
              values: {
                $concatArrays: ["$priority", "$other"],
              },
            },
          },
          {
            $unwind: {
              path: "$values",
            },
          },
          {
            $replaceRoot: {
              newRoot: "$values",
            },
          },
        ]
      : [
          {
            $match: filter,
          },
          {
            $sort: sort,
          },
        ];

    const [result] = await db
      .collection<Customer>(CUSTOMERS_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            organizationId: this.organizationId,
          },
        },
        ...priorityStages,
        {
          $lookup: {
            from: APPOINTMENTS_COLLECTION_NAME,
            localField: "_id",
            foreignField: "customerId",
            as: "appointments",
            pipeline: [
              {
                $match: {
                  status: openAppointmentStatusMongoFilter,
                  organizationId: this.organizationId,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            appointmentsCount: {
              $size: "$appointments",
            },
            lastAppointment: {
              //   $getField: {
              //     field: "dateTime",
              //     input: {
              $first: {
                $filter: {
                  input: {
                    $sortArray: {
                      input: "$appointments",
                      sortBy: {
                        dateTime: -1,
                      },
                    },
                  },
                  as: "appt",
                  cond: {
                    $lt: ["$$appt.dateTime", new Date()],
                  },
                  limit: 1,
                },
              },
              // },
              //   },
            },
            nextAppointment: {
              //   $getField: {
              //     field: "dateTime",
              //     input: {
              $first: {
                $filter: {
                  input: {
                    $sortArray: {
                      input: "$appointments",
                      sortBy: {
                        dateTime: 1,
                      },
                    },
                  },
                  as: "appt",
                  cond: {
                    $gte: ["$$appt.dateTime", new Date()],
                  },
                  limit: 1,
                },
              },
              // },
              //   },
            },
          },
        },
        {
          $project: {
            appointments: 0,
          },
        },
        ...priorityStages,
        {
          $facet: {
            paginatedResults:
              query.limit === 0
                ? undefined
                : [
                    ...(typeof query.offset !== "undefined"
                      ? [{ $skip: query.offset }]
                      : []),
                    ...(typeof query.limit !== "undefined"
                      ? [{ $limit: query.limit }]
                      : []),
                  ],
            totalCount: [
              {
                $count: "count",
              },
            ],
          },
        },
      ])
      .toArray();

    const response = {
      total: result.totalCount?.[0]?.count || 0,
      items: result.paginatedResults || [],
    };

    logger.debug(
      {
        query,
        result: { total: response.total, count: response.items.length },
      },
      "Fetched customers",
    );

    return response;
  }

  public async findCustomer(
    email: string,
    phone: string,
  ): Promise<Customer | null> {
    const logger = this.loggerFactory("findCustomer");
    logger.debug({ email, phone }, "Finding customer by email and phone");

    const byEmail = await this.findCustomerBySearchField(
      email?.trim() || "",
      "email",
    );
    if (byEmail) {
      logger.debug(
        { email, customerId: byEmail._id },
        "Customer found by email",
      );
      return byEmail;
    }

    const byPhone = await this.findCustomerBySearchField(
      phone?.trim() || "",
      "phone",
    );
    if (byPhone) {
      logger.debug(
        { phone, customerId: byPhone._id },
        "Customer found by phone",
      );
    } else {
      logger.debug({ email, phone }, "Customer not found by email or phone");
    }
    return byPhone;
  }

  public async findCustomerBySearchField(
    search: string,
    field: CustomerSearchField,
  ): Promise<Customer | null> {
    const logger = this.loggerFactory("findCustomerBySearchField");
    logger.debug({ search, field }, "Finding customer by search field");

    const db = await getDbConnection();

    const collection = db.collection<Customer>(CUSTOMERS_COLLECTION_NAME);
    const $regex = new RegExp(escapeRegex(search), "i");
    const queries = buildSearchQuery<Customer>(
      { $regex },
      field,
      `known${field[0].toUpperCase()}${field.substring(1)}s` as Leaves<Customer>,
    );

    const customer = await collection.findOne({
      $or: queries,
      organizationId: this.organizationId,
      isDeleted: { $ne: true },
    });

    if (customer) {
      logger.debug(
        { search, field, customerId: customer._id },
        "Customer found by search field",
      );
    } else {
      logger.debug({ search, field }, "Customer not found by search field");
    }

    return customer;
  }

  public async findCustomerBySearchFields(
    searches: { search: string; field: CustomerSearchField }[],
  ): Promise<Customer | null> {
    const logger = this.loggerFactory("findCustomerBySearchFields");
    logger.debug({ searches }, "Finding customer by search fields");

    if (searches.length === 0) {
      logger.debug({ searches }, "No search fields provided");
      return null;
    }

    const db = await getDbConnection();

    const collection = db.collection<Customer>(CUSTOMERS_COLLECTION_NAME);
    let $or: Filter<Customer>[] = [];
    for (const { search, field } of searches) {
      const $regex = new RegExp(escapeRegex(search), "i");
      const queries = buildSearchQuery<Customer>(
        { $regex },
        field,
        `known${field[0].toUpperCase()}${field.substring(1)}s` as Leaves<Customer>,
      );
      $or.push({ $or: queries });
    }

    const customer = await collection.findOne({
      $or,
      organizationId: this.organizationId,
      isDeleted: { $ne: true },
    });

    if (customer) {
      logger.debug(
        { searches, customerId: customer._id },
        "Customer found by search fields",
      );
    } else {
      logger.debug({ searches }, "Customer not found by search fields");
    }

    return customer;
  }

  public async createCustomer(
    customer: CustomerUpdateModel,
    source: EventSource,
  ): Promise<Customer> {
    const logger = this.loggerFactory("createCustomer");
    logger.debug(
      {
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
      },
      "Creating new customer",
    );

    const id = new ObjectId().toString();
    const db = await getDbConnection();

    const collection = db.collection<Customer>(CUSTOMERS_COLLECTION_NAME);

    const createdCustomer: Customer = {
      ...customer,
      organizationId: this.organizationId,
      _id: id,
    };

    await collection.insertOne(createdCustomer);

    logger.debug(
      { customerId: id, name: customer.name },
      "Successfully created customer, executing hooks",
    );

    // Execute customer hooks
    await this.eventService.emit(
      CUSTOMER_CREATED_EVENT_TYPE,
      {
        customer: createdCustomer,
      } satisfies CustomerCreatedPayload,
      enrichEventSourceWithCustomerId(source, id),
    );

    return createdCustomer;
  }

  public async updateCustomer(
    id: string,
    update: CustomerUpdateModel,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("updateCustomer");
    logger.debug(
      {
        customerId: id,
        update: { name: update.name, email: update.email, phone: update.phone },
      },
      "Updating customer",
    );

    const db = await getDbConnection();

    const collection = db.collection<Customer>(CUSTOMERS_COLLECTION_NAME);

    const { _id: _, ...updateObj } = update as Customer; // Remove fields in case it slips here

    await collection.updateOne(
      {
        _id: id,
        organizationId: this.organizationId,
      },
      {
        $set: updateObj,
      },
    );

    // Get the updated customer for hooks
    const updatedCustomer = await collection.findOne({
      _id: id,
      organizationId: this.organizationId,
      isDeleted: { $ne: true },
    });
    if (!updatedCustomer) {
      logger.warn({ customerId: id }, "Customer not found after update");
      return;
    }

    logger.debug(
      { customerId: id },
      "Successfully updated customer, executing hooks",
    );

    // Execute customer hooks
    await this.eventService.emit(
      CUSTOMER_UPDATED_EVENT_TYPE,
      {
        customer: updatedCustomer,
        update,
      } satisfies CustomerUpdatedPayload,
      enrichEventSourceWithCustomerId(source, id),
    );
  }

  public async getOrUpsertCustomer(
    {
      name,
      email,
      phone,
    }: {
      name?: string;
      email: string;
      phone: string;
    },
    source: EventSource,
  ): Promise<Customer> {
    const logger = this.loggerFactory("getOrUpsertCustomer");

    logger.debug(
      { customerName: name, customerEmail: email },
      "Getting or creating/updating customer",
    );

    const existingCustomer = await this.findCustomer(
      email.trim(),
      phone.trim(),
    );

    if (existingCustomer) {
      logger.debug(
        {
          customerId: existingCustomer._id,
          customerName: existingCustomer.name,
        },
        "Found existing customer",
      );

      await this.updateCustomerIfNeeded(
        existingCustomer,
        {
          name: name?.trim() || existingCustomer.name,
          email,
          phone,
        },
        source,
      );

      return existingCustomer;
    }

    const fallbackName =
      (email.includes("@") ? email.split("@")[0] : "") || phone || "Customer";
    const resolvedName =
      name?.trim() && name.trim().length >= 2
        ? name.trim()
        : fallbackName.trim().length >= 2
          ? fallbackName.trim()
          : "Customer";

    logger.debug(
      { customerName: resolvedName, customerEmail: email },
      "Creating new customer",
    );

    const customer: CustomerUpdateModel = {
      email: email.trim(),
      name: resolvedName,
      phone: phone.trim(),
      knownEmails: [],
      knownNames: [],
      knownPhones: [],
      requireDeposit: "inherit",
    };

    const newCustomer = await this.createCustomer(customer, source);

    logger.debug(
      { customerId: newCustomer._id, customerName: newCustomer.name },
      "New customer created",
    );

    return newCustomer;
  }

  private async updateCustomerIfNeeded(
    customer: Customer,
    updatedFields: { name: string; email: string; phone: string },
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("updateCustomerIfNeeded");

    logger.debug(
      { customerId: customer._id, customerName: customer.name, updatedFields },
      "Checking if customer update is needed",
    );

    let needsUpdate = false;
    const name = updatedFields.name.trim();
    if (
      name.length >= 2 &&
      customer.name !== name &&
      !customer.knownNames.includes(name)
    ) {
      customer.knownNames.push(name);
      needsUpdate = true;
    }

    const email = updatedFields.email.trim();
    if (customer.email !== email && !customer.knownEmails.includes(email)) {
      customer.knownEmails.push(email);
      needsUpdate = true;
    }

    const phone = updatedFields.phone.trim();
    if (customer.phone !== phone && !customer.knownPhones.includes(phone)) {
      customer.knownPhones.push(phone);
      needsUpdate = true;
    }

    if (needsUpdate) {
      logger.debug(
        { customerId: customer._id, updatedFields: { name, email, phone } },
        "Updating customer with new information",
      );
      await this.updateCustomer(customer._id, customer, source);
    } else {
      logger.debug({ customerId: customer._id }, "No customer update needed");
    }
  }

  public async deleteCustomer(
    id: string,
    source: EventSource,
  ): Promise<Customer | null> {
    const logger = this.loggerFactory("deleteCustomer");
    logger.debug({ customerId: id }, "Deleting customer");

    const db = await getDbConnection();

    const collection = db.collection<Customer>(CUSTOMERS_COLLECTION_NAME);

    const customer = await collection.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!customer) {
      logger.warn({ customerId: id }, "Customer not found for deletion");
      return null;
    }

    if (customer.isDeleted) {
      logger.warn({ customerId: id }, "Customer already deleted");
      return null;
    }

    await collection.updateOne(
      {
        _id: id,
        organizationId: this.organizationId,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          knownEmails: [],
          knownPhones: [],
          knownNames: [],
        },
        $unset: {
          avatar: "",
          dateOfBirth: "",
          requireDeposit: "",
          depositPercentage: "",
          dontAllowBookings: "",
          email: "",
          phone: "",
        },
      },
    );

    logger.debug(
      { customerId: id, name: customer.name },
      "Successfully deleted customer, executing hooks",
    );

    // Execute customer hooks
    await this.eventService.emit(
      CUSTOMER_DELETED_EVENT_TYPE,
      {
        customers: [customer],
      } satisfies CustomerDeletedPayload,
      source,
    );

    return customer;
  }

  public async deleteCustomers(
    ids: string[],
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("deleteCustomers");
    logger.debug({ customerIds: ids }, "Deleting multiple customers");

    const db = await getDbConnection();

    const collection = db.collection<Customer>(CUSTOMERS_COLLECTION_NAME);
    const customersToDelete = await collection
      .find({
        _id: {
          $in: ids,
        },
        isDeleted: { $ne: true },
        organizationId: this.organizationId,
      })
      .toArray();

    const idsToDelete = customersToDelete.map((customer) => customer._id);
    logger.debug({ customerIds: idsToDelete }, "Customers to delete");

    await collection.updateMany(
      {
        _id: {
          $in: idsToDelete,
        },
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          knownEmails: [],
          knownPhones: [],
          knownNames: [],
          // name: "Deleted Customer",
        },
        $unset: {
          avatar: "",
          dateOfBirth: "",
          requireDeposit: "",
          depositPercentage: "",
          dontAllowBookings: "",
          email: "",
          phone: "",
        },
      },
    );

    logger.debug(
      { customerIds: ids, count: ids.length },
      "Successfully deleted multiple customers, executing hooks",
    );

    // Execute customer hooks
    await this.eventService.emit(
      CUSTOMER_DELETED_EVENT_TYPE,
      {
        customers: customersToDelete,
      } satisfies CustomerDeletedPayload,
      source,
    );
  }

  public async mergeCustomers(
    targetId: string,
    valueIds: string[],
  ): Promise<void> {
    const logger = this.loggerFactory("mergeCustomers");
    logger.debug({ targetId, valueIds }, "Merging customers");

    const db = await getDbConnection();
    const collection = db.collection<Customer>(CUSTOMERS_COLLECTION_NAME);

    const target = await collection.findOne({
      _id: targetId,
      organizationId: this.organizationId,
    });

    if (!target) {
      logger.error({ targetId }, "Target customer not found for merge");
      throw new Error(`Can't find target customer with id ${targetId}`);
    }

    if (!valueIds?.length) {
      logger.error({ targetId, valueIds }, "Value IDs list is empty for merge");
      throw new Error("IDs list should not be empty");
    }

    const ids = valueIds.filter((id) => id !== targetId);

    const customers = await collection
      .find({
        _id: {
          $in: ids,
        },
        organizationId: this.organizationId,
      })
      .toArray();

    if (customers.length !== ids.length) {
      logger.error(
        {
          targetId,
          valueIds,
          foundCount: customers.length,
          expectedCount: ids.length,
        },
        "Could not find all customers for merge",
      );
      throw new Error(`Could not find all customers for merge`);
    }

    const nameSet = new Set([target.name, ...target.knownNames]);
    const emailSet = new Set([target.email, ...target.knownEmails]);
    const phoneSet = new Set([target.phone, ...target.knownPhones]);

    const notes = new Set([target.note]);

    let avatar = target.avatar;
    let dateOfBirth = target.dateOfBirth;

    logger.debug({ targetId, ids }, "Building merge data");

    for (const customer of customers) {
      nameSet.add(customer.name);
      customer.knownNames.forEach((name) => nameSet.add(name));
      phoneSet.add(customer.phone);
      customer.knownPhones.forEach((phone) => phoneSet.add(phone));
      emailSet.add(customer.email);
      customer.knownEmails.forEach((email) => emailSet.add(email));

      notes.add(customer.note);
      if (!avatar && customer.avatar) avatar = customer.avatar;
      if (!dateOfBirth && customer.dateOfBirth)
        dateOfBirth = customer.dateOfBirth;
    }

    const [name, ...knownNames] = Array.from(nameSet);
    const [email, ...knownEmails] = Array.from(emailSet);
    const [phone, ...knownPhones] = Array.from(phoneSet);

    const note = Array.from(notes)
      .filter((n) => !!n)
      .join("\n\n-----\n\n");

    const update: Partial<CustomerUpdateModel> = {
      name,
      email,
      phone,
      knownEmails,
      knownNames,
      knownPhones,
      note,
      avatar,
      dateOfBirth,
    };

    logger.debug({ targetId, ids }, "Updating target customer");

    await collection.updateOne(
      {
        _id: targetId,
        organizationId: this.organizationId,
      },
      {
        $set: update,
      },
    );

    logger.debug({ targetId, ids }, "Updating collections");

    const collections = await db.collections();

    for (const collection of collections) {
      logger.debug(
        { collectionName: collection.collectionName },
        "Updating collection",
      );
      const { modifiedCount } = await collection.updateMany(
        {
          customerId: {
            $in: ids,
          },
        },
        {
          $set: {
            customerId: targetId,
          },
        },
      );

      logger.debug(
        { collectionName: collection.collectionName, modifiedCount },
        "Updated collection",
      );
    }

    logger.debug({ targetId, ids }, "Deleting merged customers");

    await collection.deleteMany({
      _id: {
        $in: ids,
      },
    });

    logger.debug(
      { targetId, valueIds, mergedCount: ids.length },
      "Successfully merged customers",
    );
  }

  public async checkUniqueEmailAndPhone(
    emails: string[],
    phones: string[],
    id?: string,
  ): Promise<{ email: boolean; phone: boolean }> {
    const logger = this.loggerFactory("checkUniqueEmailAndPhone");
    logger.debug(
      { emails, phones, customerId: id },
      "Checking unique email and phone",
    );

    const db = await getDbConnection();
    const customers = db.collection<Customer>(CUSTOMERS_COLLECTION_NAME);

    const emailFilter: Filter<Customer> = {
      organizationId: this.organizationId,
      $or: [
        {
          email: { $in: emails },
        },

        {
          knownEmails: {
            $in: emails,
          },
        },
      ],
    };

    const phoneFilter: Filter<Customer> = {
      organizationId: this.organizationId,
      $or: [
        {
          phone: { $in: phones },
        },

        {
          knownPhones: {
            $in: phones,
          },
        },
      ],
    };

    if (id) {
      emailFilter._id = {
        $ne: id,
      };
      phoneFilter._id = {
        $ne: id,
      };
    }

    const [emailResult, phoneResult] = await Promise.all([
      customers.find(emailFilter).hasNext(),
      customers.find(phoneFilter).hasNext(),
    ]);

    const result = { email: !emailResult, phone: !phoneResult };
    logger.debug(
      { emails, phones, customerId: id, result },
      "Email and phone uniqueness check completed",
    );

    return result;
  }
}
