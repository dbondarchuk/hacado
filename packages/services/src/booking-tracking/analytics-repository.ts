import {
  BookingProgressAnalyticsDaily,
  BookingProgressMetricsDelta,
} from "@hacado/types";
import { Filter, MongoServerError } from "mongodb";
import { BOOKING_PROGRESS_ANALYTICS_DAILY_COLLECTION_NAME } from "../collections";
import { getDbConnection } from "../database";
import { BaseService } from "../services/base.service";
import { metricsDeltaToInc } from "./metrics-delta";

export class BookingProgressAnalyticsRepository extends BaseService {
  public constructor(organizationId: string) {
    super("BookingProgressAnalyticsRepository", organizationId);
  }

  public async incrementMetrics(
    date: Date,
    delta: BookingProgressMetricsDelta,
  ): Promise<void> {
    const inc = metricsDeltaToInc(delta);
    if (Object.keys(inc).length === 0) return;

    const logger = this.loggerFactory("incrementMetrics");
    const db = await getDbConnection();
    const collection = db.collection<BookingProgressAnalyticsDaily>(
      BOOKING_PROGRESS_ANALYTICS_DAILY_COLLECTION_NAME,
    );

    const now = new Date();
    const filter: Filter<BookingProgressAnalyticsDaily> =
      this.withOrganizationFilter({ date });

    const update = {
      $setOnInsert: {
        organizationId: this.organizationId,
        date,
        createdAt: now,
      },
      $inc: inc,
      $set: { updatedAt: now },
    };

    try {
      await collection.updateOne(filter, update, { upsert: true });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        await collection.updateOne(filter, {
          $inc: inc,
          $set: { updatedAt: now },
        });
      } else {
        logger.error({ error, date, delta }, "Failed to increment metrics");
        throw error;
      }
    }
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof MongoServerError && error.code === 11000;
}
