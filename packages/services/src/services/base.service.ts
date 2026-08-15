import { getLoggerFactory } from "@hacado/logger";
import { Filter } from "mongodb";
import pino from "pino";

/**
 * Base service that provides organization isolation
 * All services should extend this to automatically filter by organizationId
 */
export abstract class BaseService {
  protected readonly organizationId: string;
  protected readonly loggerFactory: (functionName?: string) => pino.Logger;

  constructor(serviceName: string, organizationId: string) {
    this.organizationId = organizationId;
    this.loggerFactory = getLoggerFactory(serviceName, this.organizationId);
  }

  /**
   * Add organizationId filter to any MongoDB filter
   * Ensures all queries are scoped to the organization
   */
  protected withOrganizationFilter<T>(filter: Filter<T>): Filter<T> {
    return {
      $and: [{ organizationId: this.organizationId }, filter],
    } as Filter<T>;
  }

  /**
   * Verify that a document belongs to the organization
   * Throws an error if the document's organizationId doesn't match
   */
  protected verifyOrganizationOwnership(
    documentOrganizationId: string | undefined,
  ): void {
    if (
      !documentOrganizationId ||
      documentOrganizationId !== this.organizationId
    ) {
      throw new Error("Document does not belong to the organization");
    }
  }

  /**
   * Get the current organization ID
   */
  public getOrganizationId(): string {
    return this.organizationId;
  }
}
