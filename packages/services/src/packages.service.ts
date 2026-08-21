import {
  APPOINTMENT_PACKAGE_CREATED_EVENT_TYPE,
  APPOINTMENT_PACKAGE_DELETED_EVENT_TYPE,
  APPOINTMENT_PACKAGE_UPDATED_EVENT_TYPE,
  AppointmentEntity,
  AppointmentPackage,
  AppointmentPackageListModel,
  AppointmentPackageStatus,
  AppointmentPackageUpdateModel,
  AppointmentPackageUsage,
  canUsePackageForAppointment,
  CUSTOMER_PACKAGE_ADJUSTED_EVENT_TYPE,
  CUSTOMER_PACKAGE_CANCELLED_EVENT_TYPE,
  CUSTOMER_PACKAGE_EXHAUSTED_EVENT_TYPE,
  CUSTOMER_PACKAGE_EXPIRED_EVENT_TYPE,
  CUSTOMER_PACKAGE_ISSUED_EVENT_TYPE,
  CUSTOMER_PACKAGE_REDEEMED_EVENT_TYPE,
  CUSTOMER_PACKAGE_RESTORED_EVENT_TYPE,
  CustomerPackage,
  CustomerPackageListModel,
  IEventService,
  IPackagesService,
  IPaymentsService,
  IServicesService,
  IssueCustomerPackageInput,
  PackageAdjustRequest,
  PackageError,
  Query,
  RedeemPackageInput,
  resolveCustomerPackageStatus,
  sumRemainingCredits,
  WithTotal,
  type AppointmentPackageCreatedPayload,
  type AppointmentPackageDeletedPayload,
  type AppointmentPackageUpdatedPayload,
  type CustomerPackageAdjustedPayload,
  type CustomerPackageCancelledPayload,
  type CustomerPackageExhaustedPayload,
  type CustomerPackageExpiredPayload,
  type CustomerPackageIssuedPayload,
  type CustomerPackageRedeemedPayload,
  type CustomerPackageRestoredPayload,
  type EventSource,
} from "@hacado/types";
import { buildSearchQuery, escapeRegex } from "@hacado/utils";
import { DateTime } from "luxon";
import {
  ClientSession,
  Document,
  Filter,
  MongoServerError,
  ObjectId,
  Sort,
} from "mongodb";
import {
  APPOINTMENT_PACKAGES_COLLECTION_NAME,
  APPOINTMENTS_COLLECTION_NAME,
  CUSTOMER_PACKAGES_COLLECTION_NAME,
  CUSTOMERS_COLLECTION_NAME,
} from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

export class PackagesService extends BaseService implements IPackagesService {
  public constructor(
    organizationId: string,
    private readonly servicesService: IServicesService,
    private readonly paymentsService: IPaymentsService,
    private readonly eventService: IEventService,
  ) {
    super("PackagesService", organizationId);
  }

  private toCustomerPackageListModel(
    pkg: CustomerPackage,
  ): CustomerPackageListModel {
    return {
      ...pkg,
      usedCredits: Math.max(0, pkg.totalCredits - pkg.remainingCredits),
    };
  }

  private async snapshotItems(data: AppointmentPackageUpdateModel) {
    const items = await Promise.all(
      data.items.map(async (item) => {
        const option = await this.servicesService.getOption(item.optionId);
        if (!option) {
          throw new PackageError(
            "option_not_included",
            "Service option not found",
          );
        }
        return {
          _id: item._id ?? new ObjectId().toString(),
          optionId: item.optionId,
          credits: item.credits,
          creditsPerRedemption: item.creditsPerRedemption ?? 1,
          optionName: option.name,
        };
      }),
    );
    return items;
  }

  public async createPackage(
    data: AppointmentPackageUpdateModel,
    source: EventSource,
  ): Promise<AppointmentPackage> {
    const items = await this.snapshotItems(data);
    const now = new Date();
    const doc: AppointmentPackage = {
      ...data,
      items: items.map(({ optionName: _n, ...item }) => item),
      eligibleMemberIds: data.eligibleMemberIds?.length
        ? data.eligibleMemberIds
        : undefined,
      isPublic: true,
      isAutoConfirm: data.isAutoConfirm ?? "inherit",
      _id: new ObjectId().toString(),
      organizationId: this.organizationId,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDbConnection();
    await db
      .collection<AppointmentPackage>(APPOINTMENT_PACKAGES_COLLECTION_NAME)
      .insertOne(doc);

    await this.eventService.emit(
      APPOINTMENT_PACKAGE_CREATED_EVENT_TYPE,
      { package: doc } satisfies AppointmentPackageCreatedPayload,
      source,
    );
    return doc;
  }

  public async updatePackage(
    id: string,
    data: AppointmentPackageUpdateModel,
    source: EventSource,
  ): Promise<AppointmentPackage | null> {
    const existing = await this.getPackage(id);
    if (!existing) return null;

    const items = await this.snapshotItems({
      ...data,
      items: data.items.map((item, index) => ({
        ...item,
        _id:
          item._id ?? existing.items[index]?._id ?? new ObjectId().toString(),
      })),
    });

    const db = await getDbConnection();
    const updated: AppointmentPackage = {
      ...existing,
      ...data,
      items: items.map(({ optionName: _n, ...item }) => item),
      eligibleMemberIds: data.eligibleMemberIds?.length
        ? data.eligibleMemberIds
        : undefined,
      updatedAt: new Date(),
    };

    await db
      .collection<AppointmentPackage>(APPOINTMENT_PACKAGES_COLLECTION_NAME)
      .replaceOne({ _id: id, organizationId: this.organizationId }, updated);

    await this.eventService.emit(
      APPOINTMENT_PACKAGE_UPDATED_EVENT_TYPE,
      {
        package: updated,
        previous: existing,
      } satisfies AppointmentPackageUpdatedPayload,
      source,
    );
    return updated;
  }

  public async setPackageStatus(
    id: string,
    status: AppointmentPackageStatus,
    source: EventSource,
  ): Promise<AppointmentPackage | null> {
    const existing = await this.getPackage(id);
    if (!existing) return null;
    const db = await getDbConnection();
    await db
      .collection<AppointmentPackage>(APPOINTMENT_PACKAGES_COLLECTION_NAME)
      .updateOne(
        { _id: id, organizationId: this.organizationId },
        { $set: { status, updatedAt: new Date() } },
      );
    const updated = { ...existing, status, updatedAt: new Date() };
    await this.eventService.emit(
      APPOINTMENT_PACKAGE_UPDATED_EVENT_TYPE,
      {
        package: updated,
        previous: existing,
      } satisfies AppointmentPackageUpdatedPayload,
      source,
    );
    return updated;
  }

  public async deletePackage(
    id: string,
    source: EventSource,
  ): Promise<boolean> {
    const existing = await this.getPackage(id);
    if (!existing) return false;

    const db = await getDbConnection();
    const purchases = await db
      .collection(CUSTOMER_PACKAGES_COLLECTION_NAME)
      .countDocuments({ organizationId: this.organizationId, packageId: id });
    if (purchases > 0) {
      throw new PackageError("has_purchases");
    }

    await db
      .collection<AppointmentPackage>(APPOINTMENT_PACKAGES_COLLECTION_NAME)
      .deleteOne({ _id: id, organizationId: this.organizationId });

    await this.eventService.emit(
      APPOINTMENT_PACKAGE_DELETED_EVENT_TYPE,
      { packageIds: [id] } satisfies AppointmentPackageDeletedPayload,
      source,
    );
    return true;
  }

  public async getPackage(id: string): Promise<AppointmentPackage | null> {
    const db = await getDbConnection();
    return db
      .collection<AppointmentPackage>(APPOINTMENT_PACKAGES_COLLECTION_NAME)
      .findOne({ _id: id, organizationId: this.organizationId });
  }

  public async getPackages(
    query: Query & {
      status?: AppointmentPackageStatus[];
      isPublic?: boolean;
      priorityIds?: string[];
    },
  ): Promise<WithTotal<AppointmentPackageListModel>> {
    const db = await getDbConnection();
    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { updatedAt: -1 };

    const filter: Filter<AppointmentPackage> = {
      organizationId: this.organizationId,
    };
    if (query.status?.length) {
      filter.status = { $in: query.status };
    }
    if (query.isPublic !== undefined) {
      filter.isPublic = query.isPublic;
    }
    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      filter.$or = buildSearchQuery<AppointmentPackage>(
        { $regex },
        "name",
        "description",
      );
    }

    const soldCountStages: Document[] = [
      {
        $lookup: {
          from: CUSTOMER_PACKAGES_COLLECTION_NAME,
          let: { packageId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$packageId", "$$packageId"] },
                    { $eq: ["$organizationId", this.organizationId] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "_sold",
        },
      },
      {
        $set: {
          soldCount: { $ifNull: [{ $arrayElemAt: ["$_sold.count", 0] }, 0] },
        },
      },
      { $unset: ["_sold"] },
    ];

    const priorityStages: Document[] = query.priorityIds?.length
      ? [
          {
            $facet: {
              priority: [
                {
                  $match: {
                    _id: { $in: query.priorityIds },
                    organizationId: this.organizationId,
                  },
                },
              ],
              other: [
                {
                  $match: {
                    ...filter,
                    _id: { $nin: query.priorityIds },
                  },
                },
                { $sort: sort },
              ],
            },
          },
          {
            $project: {
              values: { $concatArrays: ["$priority", "$other"] },
            },
          },
          { $unwind: { path: "$values" } },
          { $replaceRoot: { newRoot: "$values" } },
        ]
      : [{ $match: filter }, { $sort: sort }];

    const [result] = await db
      .collection<AppointmentPackage>(APPOINTMENT_PACKAGES_COLLECTION_NAME)
      .aggregate<{
        paginatedResults: AppointmentPackageListModel[];
        totalCount: { count: number }[];
      }>([
        ...priorityStages,
        ...soldCountStages,
        {
          $facet: {
            paginatedResults:
              query.limit === 0
                ? []
                : [
                    ...(typeof query.offset !== "undefined"
                      ? [{ $skip: query.offset }]
                      : []),
                    ...(typeof query.limit !== "undefined"
                      ? [{ $limit: query.limit }]
                      : []),
                  ],
            totalCount: [{ $count: "count" }],
          },
        },
      ])
      .toArray();

    return {
      total: result?.totalCount?.[0]?.count || 0,
      items: result?.paginatedResults || [],
    };
  }

  public async getPublicPackages(): Promise<AppointmentPackage[]> {
    const db = await getDbConnection();
    return db
      .collection<AppointmentPackage>(APPOINTMENT_PACKAGES_COLLECTION_NAME)
      .find({
        organizationId: this.organizationId,
        status: "active",
      })
      .sort({ name: 1 })
      .toArray();
  }

  public async hasActiveCustomerPackages(): Promise<boolean> {
    const db = await getDbConnection();
    const found = await db
      .collection<CustomerPackage>(CUSTOMER_PACKAGES_COLLECTION_NAME)
      .findOne(
        {
          organizationId: this.organizationId,
          status: "active",
          remainingCredits: { $gt: 0 },
        },
        { projection: { _id: 1 } },
      );
    return !!found;
  }

  public async issue(
    input: IssueCustomerPackageInput,
  ): Promise<CustomerPackage> {
    if (input.paymentIntentId) {
      const existing = await this.findByPaymentIntent(input.paymentIntentId);
      if (existing) return existing;
    }

    const definition = await this.getPackage(input.packageId);
    if (!definition) throw new PackageError("package_not_found");
    if (definition.status !== "active") {
      throw new PackageError("package_inactive");
    }

    if (definition.maxPurchasesPerCustomer) {
      const db = await getDbConnection();
      const count = await db
        .collection(CUSTOMER_PACKAGES_COLLECTION_NAME)
        .countDocuments(
          {
            organizationId: this.organizationId,
            customerId: input.customerId,
            packageId: definition._id,
            status: { $ne: "cancelled" },
          },
          { session: input.session },
        );
      if (count >= definition.maxPurchasesPerCustomer) {
        throw new PackageError("purchase_limit_reached");
      }
    }

    const items = await this.snapshotItems(definition);
    const remainingByItem = Object.fromEntries(
      items.map((item) => [item._id, item.credits]),
    );
    const totalCredits = sumRemainingCredits(remainingByItem);
    const now = new Date();
    const expiresAt = definition.validityMonths
      ? DateTime.fromJSDate(now)
          .plus({ months: definition.validityMonths })
          .toJSDate()
      : undefined;

    const customerPackage: CustomerPackage = {
      _id: new ObjectId().toString(),
      organizationId: this.organizationId,
      customerId: input.customerId,
      packageId: definition._id,
      name: definition.name,
      description: definition.description,
      price: input.price ?? definition.price,
      items,
      eligibleMemberIds: definition.eligibleMemberIds,
      purchasedAt: now,
      expiresAt,
      status: "active",
      paymentId: input.paymentId,
      paymentIntentId: input.paymentIntentId,
      channel: input.channel,
      remainingByItem,
      totalCredits,
      remainingCredits: totalCredits,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDbConnection();
    try {
      await db
        .collection<CustomerPackage>(CUSTOMER_PACKAGES_COLLECTION_NAME)
        .insertOne(customerPackage, { session: input.session });
    } catch (error) {
      if (
        error instanceof MongoServerError &&
        error.code === 11000 &&
        input.paymentIntentId
      ) {
        const existing = await this.findByPaymentIntent(input.paymentIntentId);
        if (existing) return existing;
      }
      throw error;
    }

    await this.eventService.emit(
      CUSTOMER_PACKAGE_ISSUED_EVENT_TYPE,
      { customerPackage } satisfies CustomerPackageIssuedPayload,
      input.source,
    );

    return customerPackage;
  }

  public async issueFromPayment(input: {
    paymentIntentId: string;
    packageId: string;
    customerId: string;
    channel: IssueCustomerPackageInput["channel"];
    source: EventSource;
    paymentId?: string;
    session?: ClientSession;
  }): Promise<CustomerPackage> {
    const existing = await this.findByPaymentIntent(input.paymentIntentId);
    if (existing) return existing;

    const intent = await this.paymentsService.getIntent(input.paymentIntentId);
    if (!intent || intent.status !== "paid") {
      throw new PackageError("payment_required");
    }

    return this.issue({
      packageId: input.packageId,
      customerId: input.customerId,
      channel: input.channel,
      source: input.source,
      paymentId: input.paymentId,
      paymentIntentId: input.paymentIntentId,
      session: input.session,
    });
  }

  public async redeem(
    input: RedeemPackageInput,
  ): Promise<AppointmentPackageUsage> {
    const existingUsage = await this.getAppointmentPackageUsage(
      input.appointmentId,
      input.session,
    );
    if (existingUsage && !existingUsage.restored) {
      return existingUsage;
    }

    const customerPackage = await this.getCustomerPackageDoc(
      input.customerPackageId,
      input.session,
    );
    if (!customerPackage) {
      throw new PackageError("customer_package_not_found");
    }

    const eligibility = canUsePackageForAppointment({
      customerPackage,
      optionId: input.optionId,
      memberId: input.memberId,
      appointmentDate: input.appointmentDate,
      optionStaffMemberIds: input.optionStaffMemberIds,
    });
    if (!eligibility.ok) {
      throw new PackageError(eligibility.code);
    }

    const remainingPath = `remainingByItem.${eligibility.item._id}`;
    const db = await getDbConnection();
    const updated = await db
      .collection<CustomerPackage>(CUSTOMER_PACKAGES_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: customerPackage._id,
          organizationId: this.organizationId,
          [remainingPath]: { $gte: eligibility.credits },
        } as Filter<CustomerPackage>,
        {
          $inc: {
            [remainingPath]: -eligibility.credits,
            remainingCredits: -eligibility.credits,
          },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after", session: input.session },
      );

    if (!updated) {
      throw new PackageError("insufficient_credits");
    }

    const nextStatus = resolveCustomerPackageStatus(updated);
    if (nextStatus !== updated.status) {
      await db
        .collection<CustomerPackage>(CUSTOMER_PACKAGES_COLLECTION_NAME)
        .updateOne(
          { _id: updated._id, organizationId: this.organizationId },
          { $set: { status: nextStatus, updatedAt: new Date() } },
          { session: input.session },
        );
      updated.status = nextStatus;
    }

    const usage: AppointmentPackageUsage = {
      customerPackageId: updated._id,
      name: updated.name,
      itemId: eligibility.item._id,
      credits: eligibility.credits,
    };

    await this.eventService.emit(
      CUSTOMER_PACKAGE_REDEEMED_EVENT_TYPE,
      {
        customerPackage: updated,
        usage,
        appointmentId: input.appointmentId,
      } satisfies CustomerPackageRedeemedPayload,
      input.source,
    );

    if (nextStatus === "exhausted") {
      await this.eventService.emit(
        CUSTOMER_PACKAGE_EXHAUSTED_EVENT_TYPE,
        {
          customerPackage: updated,
        } satisfies CustomerPackageExhaustedPayload,
        input.source,
      );
    }

    return usage;
  }

  public async restoreForAppointment(input: {
    appointmentId: string;
    source: EventSource;
    session?: ClientSession;
  }): Promise<void> {
    const usage = await this.getAppointmentPackageUsage(
      input.appointmentId,
      input.session,
    );
    if (!usage || usage.restored) return;

    const remainingPath = `remainingByItem.${usage.itemId}`;
    const db = await getDbConnection();
    const updated = await db
      .collection<CustomerPackage>(CUSTOMER_PACKAGES_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: usage.customerPackageId,
          organizationId: this.organizationId,
        },
        {
          $inc: {
            [remainingPath]: usage.credits,
            remainingCredits: usage.credits,
          },
          $set: { updatedAt: new Date(), status: "active" },
        },
        { returnDocument: "after", session: input.session },
      );

    if (!updated) return;

    const nextStatus = resolveCustomerPackageStatus(updated);
    if (nextStatus !== updated.status) {
      await db
        .collection<CustomerPackage>(CUSTOMER_PACKAGES_COLLECTION_NAME)
        .updateOne(
          { _id: updated._id, organizationId: this.organizationId },
          { $set: { status: nextStatus } },
          { session: input.session },
        );
      updated.status = nextStatus;
    }

    await db
      .collection<AppointmentEntity>(APPOINTMENTS_COLLECTION_NAME)
      .updateOne(
        { _id: input.appointmentId, organizationId: this.organizationId },
        { $set: { "packageUsage.restored": true } },
        { session: input.session },
      );

    await this.eventService.emit(
      CUSTOMER_PACKAGE_RESTORED_EVENT_TYPE,
      {
        customerPackage: updated,
        appointmentId: input.appointmentId,
        credits: usage.credits,
      } satisfies CustomerPackageRestoredPayload,
      input.source,
    );
  }

  public async adjust(
    customerPackageId: string,
    request: PackageAdjustRequest,
    source: EventSource,
  ): Promise<CustomerPackage> {
    const existing = await this.getCustomerPackageDoc(customerPackageId);
    if (!existing) throw new PackageError("customer_package_not_found");

    const previousStatus = resolveCustomerPackageStatus(existing);
    const db = await getDbConnection();
    const now = new Date();
    const $set: Record<string, unknown> = { updatedAt: now };
    const $inc: Record<string, number> = {};

    if (request.cancel) {
      $set.status = "cancelled";
    } else if (request.reactivate) {
      $set.status = resolveCustomerPackageStatus({
        status: "active",
        remainingCredits: existing.remainingCredits,
        expiresAt: existing.expiresAt,
      });
    } else {
      if (request.expiresAt !== undefined) {
        $set.expiresAt = request.expiresAt ?? null;
      }
      if (request.delta && request.itemId) {
        $inc[`remainingByItem.${request.itemId}`] = request.delta;
        $inc.remainingCredits = request.delta;
      }
    }

    const update: Record<string, unknown> = { $set };
    if (Object.keys($inc).length) update.$inc = $inc;

    const updated = await db
      .collection<CustomerPackage>(CUSTOMER_PACKAGES_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: customerPackageId, organizationId: this.organizationId },
        update,
        { returnDocument: "after" },
      );

    if (!updated) throw new PackageError("customer_package_not_found");

    if (!request.cancel && !request.reactivate) {
      const nextStatus = resolveCustomerPackageStatus(updated);
      if (nextStatus !== updated.status) {
        await db
          .collection<CustomerPackage>(CUSTOMER_PACKAGES_COLLECTION_NAME)
          .updateOne(
            { _id: updated._id, organizationId: this.organizationId },
            { $set: { status: nextStatus } },
          );
        updated.status = nextStatus;
      }
    }

    await this.eventService.emit(
      CUSTOMER_PACKAGE_ADJUSTED_EVENT_TYPE,
      {
        customerPackage: updated,
        request,
      } satisfies CustomerPackageAdjustedPayload,
      source,
    );

    if (request.cancel && previousStatus === "active") {
      await this.eventService.emit(
        CUSTOMER_PACKAGE_CANCELLED_EVENT_TYPE,
        {
          customerPackage: updated,
        } satisfies CustomerPackageCancelledPayload,
        source,
      );
    } else if (
      !request.cancel &&
      !request.reactivate &&
      previousStatus === "active" &&
      resolveCustomerPackageStatus(updated) === "exhausted"
    ) {
      await this.eventService.emit(
        CUSTOMER_PACKAGE_EXHAUSTED_EVENT_TYPE,
        {
          customerPackage: updated,
        } satisfies CustomerPackageExhaustedPayload,
        source,
      );
    }

    return updated;
  }

  public async expireIfDue(
    customerPackageId: string,
    source: EventSource,
  ): Promise<CustomerPackage | null> {
    const existing = await this.getCustomerPackageDoc(customerPackageId);
    if (!existing) return null;
    if (
      existing.status === "cancelled" ||
      existing.status === "exhausted" ||
      existing.status === "expired"
    ) {
      return null;
    }
    if (resolveCustomerPackageStatus(existing) !== "expired") {
      return null;
    }

    const db = await getDbConnection();
    const updated = await db
      .collection<CustomerPackage>(CUSTOMER_PACKAGES_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: customerPackageId, organizationId: this.organizationId },
        { $set: { status: "expired", updatedAt: new Date() } },
        { returnDocument: "after" },
      );

    if (!updated) return null;

    await this.eventService.emit(
      CUSTOMER_PACKAGE_EXPIRED_EVENT_TYPE,
      {
        customerPackage: updated,
      } satisfies CustomerPackageExpiredPayload,
      source,
    );

    return updated;
  }

  public async getCustomerPackage(
    id: string,
  ): Promise<CustomerPackageListModel | null> {
    const doc = await this.getCustomerPackageDoc(id);
    return doc ? this.toCustomerPackageListModel(doc) : null;
  }

  public async getCustomerPackages(
    query: Query & {
      customerId?: string | string[];
      status?: CustomerPackage["status"][];
      packageId?: string | string[];
    },
  ): Promise<WithTotal<CustomerPackageListModel>> {
    const db = await getDbConnection();
    const filter: Filter<CustomerPackage> = {
      organizationId: this.organizationId,
    };
    const customerIds = (
      Array.isArray(query.customerId)
        ? query.customerId
        : query.customerId
          ? [query.customerId]
          : []
    ).filter(Boolean);
    if (customerIds.length) {
      filter.customerId = { $in: customerIds };
    }
    if (query.status?.length) {
      filter.status = { $in: query.status };
    }
    const packageIds = (
      Array.isArray(query.packageId)
        ? query.packageId
        : query.packageId
          ? [query.packageId]
          : []
    ).filter(Boolean);
    if (packageIds.length) {
      filter.packageId = { $in: packageIds };
    }
    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      filter.$or = buildSearchQuery<CustomerPackage>({ $regex }, "name");
    }
    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { purchasedAt: -1 };

    const [result] = await db
      .collection<CustomerPackage>(CUSTOMER_PACKAGES_COLLECTION_NAME)
      .aggregate<{
        paginatedResults: CustomerPackage[];
        totalCount: { count: number }[];
      }>([
        {
          $lookup: {
            from: CUSTOMERS_COLLECTION_NAME,
            localField: "customerId",
            foreignField: "_id",
            as: "customer",
          },
        },
        { $match: filter },
        { $sort: sort },
        {
          $set: {
            usedCredits: {
              $max: [0, { $subtract: ["$totalCredits", "$remainingCredits"] }],
            },
          },
        },
        {
          $facet: {
            paginatedResults:
              query.limit === 0
                ? []
                : [
                    ...(typeof query.offset !== "undefined"
                      ? [{ $skip: query.offset }]
                      : []),
                    ...(typeof query.limit !== "undefined"
                      ? [{ $limit: query.limit }]
                      : []),
                  ],
            totalCount: [{ $count: "count" }],
          },
        },
      ])
      .toArray();

    return {
      total: result?.totalCount?.[0]?.count || 0,
      items: (result?.paginatedResults || []).map((item) =>
        this.toCustomerPackageListModel(item),
      ),
    };
  }

  public async findEligible(input: {
    customerId: string;
    optionId: string;
    memberId: string;
    appointmentDate: Date;
    optionStaffMemberIds: string[];
  }): Promise<CustomerPackage[]> {
    const db = await getDbConnection();

    const items = await db
      .collection<CustomerPackage>(CUSTOMER_PACKAGES_COLLECTION_NAME)
      .find({
        organizationId: this.organizationId,
        customerId: input.customerId,
        status: "active",
      })
      .toArray();

    return items.filter((pkg) => {
      const result = canUsePackageForAppointment({
        customerPackage: pkg,
        optionId: input.optionId,
        memberId: input.memberId,
        appointmentDate: input.appointmentDate,
        optionStaffMemberIds: input.optionStaffMemberIds,
      });
      return result.ok;
    });
  }

  public async canUsePackageForAppointment(input: {
    customerPackageId: string;
    optionId: string;
    memberId: string;
    appointmentDate: Date;
    optionStaffMemberIds: string[];
  }) {
    const customerPackage = await this.getCustomerPackageDoc(
      input.customerPackageId,
    );
    if (!customerPackage) {
      return {
        ok: false as const,
        code: "customer_package_not_found" as const,
      };
    }
    return canUsePackageForAppointment({
      customerPackage,
      optionId: input.optionId,
      memberId: input.memberId,
      appointmentDate: input.appointmentDate,
      optionStaffMemberIds: input.optionStaffMemberIds,
    });
  }

  private async findByPaymentIntent(paymentIntentId: string) {
    const db = await getDbConnection();
    return db
      .collection<CustomerPackage>(CUSTOMER_PACKAGES_COLLECTION_NAME)
      .findOne({
        organizationId: this.organizationId,
        paymentIntentId,
      });
  }

  private async getCustomerPackageDoc(
    id: string,
    session?: ClientSession,
  ): Promise<CustomerPackage | null> {
    const db = await getDbConnection();
    return db
      .collection<CustomerPackage>(CUSTOMER_PACKAGES_COLLECTION_NAME)
      .findOne({ _id: id, organizationId: this.organizationId }, { session });
  }

  private async getAppointmentPackageUsage(
    appointmentId: string,
    session?: ClientSession,
  ): Promise<AppointmentPackageUsage | null> {
    const db = await getDbConnection();
    const appointment = await db
      .collection<AppointmentEntity>(APPOINTMENTS_COLLECTION_NAME)
      .findOne(
        { _id: appointmentId, organizationId: this.organizationId },
        { projection: { packageUsage: 1 }, session },
      );
    return appointment?.packageUsage ?? null;
  }
}
