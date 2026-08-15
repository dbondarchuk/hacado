import {
  BookingStep,
  BookingTrackingEvent,
  Query,
  WithTotal,
} from "@hacado/types";
import { Filter, ObjectId, Sort } from "mongodb";
import { BOOKING_TRACKING_COLLECTION_NAME } from "../collections";
import { getDbConnection } from "../database";
import { BaseService } from "../services/base.service";

export type SaveBookingResultData = Omit<
  BookingTrackingEvent,
  "_id" | "organizationId" | "createdAt" | "updatedAt" | "sessionId" | "steps"
> & {
  steps: Record<BookingStep, string>;
};

export class BookingTrackingRepository extends BaseService {
  public constructor(organizationId: string) {
    super("BookingTrackingRepository", organizationId);
  }

  /**
   * Save a booking tracking result to MongoDB
   */
  public async saveBookingResult(
    sessionId: string,
    data: SaveBookingResultData,
  ): Promise<BookingTrackingEvent> {
    const logger = this.loggerFactory("saveBookingResult");
    logger.debug({ sessionId, status: data.status }, "Saving booking result");

    const db = await getDbConnection();
    const collection = db.collection<BookingTrackingEvent>(
      BOOKING_TRACKING_COLLECTION_NAME,
    );

    const now = new Date();

    // Convert step timestamps from ISO strings to Dates
    const stepsAsDates: Record<BookingStep, Date> = {} as Record<
      BookingStep,
      Date
    >;
    for (const [step, timestamp] of Object.entries(data.steps)) {
      stepsAsDates[step as BookingStep] = new Date(timestamp);
    }

    const bookingResult: BookingTrackingEvent = {
      _id: new ObjectId().toString(),
      sessionId,
      organizationId: this.organizationId,
      startedAt: new Date(data.startedAt),
      lastSeenAt: new Date(data.lastSeenAt),
      abandonedAt: data.abandonedAt ? new Date(data.abandonedAt) : null,
      convertedAt: data.convertedAt ? new Date(data.convertedAt) : null,
      lastStep: data.lastStep,
      steps: stepsAsDates,
      optionId: data.optionId || null,
      duration: data.duration || null,
      isPaymentRequired: data.isPaymentRequired || false,
      paymentAmount: data.paymentAmount || null,
      customerId: data.customerId || null,
      customerEmail: data.customerEmail || null,
      customerName: data.customerName || null,
      status: data.status,
      appointmentId: data.appointmentId || null,
      convertedTo: data.convertedTo || null,
      convertedId: data.convertedId || null,
      convertedAppName: data.convertedAppName || null,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(bookingResult);

    logger.debug(
      { sessionId, bookingResultId: bookingResult._id },
      "Successfully saved booking result",
    );

    return bookingResult;
  }

  /**
   * Query booking tracking events
   */
  public async queryEvents(
    query?: Query & {
      dateRange?: { start?: Date; end?: Date };
      status?: ("abandoned" | "converted")[];
      lastStep?: BookingStep[];
      convertedTo?: string[];
    },
  ): Promise<WithTotal<BookingTrackingEvent>> {
    const logger = this.loggerFactory("queryEvents");
    logger.debug({ query }, "Querying booking tracking events");

    const db = await getDbConnection();
    const collection = db.collection<BookingTrackingEvent>(
      BOOKING_TRACKING_COLLECTION_NAME,
    );

    // Build filter
    const filter: Filter<BookingTrackingEvent> = this.withOrganizationFilter(
      {},
    );

    if (query?.status && query.status.length > 0) {
      filter.status = { $in: query.status };
    }

    if (query?.lastStep && query.lastStep.length > 0) {
      filter.lastStep = { $in: query.lastStep };
    }

    if (query?.convertedTo && query.convertedTo.length > 0) {
      filter.convertedTo = { $in: query.convertedTo };
    }

    if (query?.dateRange?.start || query?.dateRange?.end) {
      filter.startedAt = {};
      if (query.dateRange.start) {
        filter.startedAt.$gte = query.dateRange.start;
      }
      if (query.dateRange.end) {
        filter.startedAt.$lte = query.dateRange.end;
      }
    }

    // Apply search if provided
    if (query?.search) {
      filter.$or = [
        { sessionId: { $regex: query.search, $options: "i" } },
        { customerEmail: { $regex: query.search, $options: "i" } },
        { customerName: { $regex: query.search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await collection.countDocuments(filter);

    // Apply sorting
    let sort: Sort = { createdAt: -1 }; // Default sort by newest first
    if (query?.sort && query.sort.length > 0) {
      sort = {};
      for (const sortOption of query.sort) {
        sort[sortOption.id] = sortOption.desc ? -1 : 1;
      }
    }

    // Apply pagination
    const limit = query?.limit || 100;
    const offset = query?.offset || 0;

    const events = await collection
      .find(filter)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .toArray();

    logger.debug(
      { count: events.length, total },
      "Retrieved booking tracking events",
    );

    return {
      items: events,
      total,
    };
  }

  /**
   * Get a single booking tracking event by session ID
   */
  public async getEventBySessionId(
    sessionId: string,
  ): Promise<BookingTrackingEvent | null> {
    const logger = this.loggerFactory("getEventBySessionId");
    logger.debug({ sessionId }, "Getting booking tracking event by session ID");

    const db = await getDbConnection();
    const collection = db.collection<BookingTrackingEvent>(
      BOOKING_TRACKING_COLLECTION_NAME,
    );

    const event = await collection.findOne(
      this.withOrganizationFilter({ sessionId }),
    );

    if (!event) {
      logger.debug({ sessionId }, "Event not found");
    }

    return event;
  }
}
