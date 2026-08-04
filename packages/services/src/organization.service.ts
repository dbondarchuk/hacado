import {
  EventSource,
  IEventService,
  IOrganizationService,
  ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE,
  Organization,
} from "@timelish/types";
import { ORGANIZATIONS_COLLECTION_NAME } from "./collections";
import { getDbConnection } from "./database";
import { invalidateOrganizationHostnameCache } from "./organization-hostname-cache";
import { BaseService } from "./services/base.service";

const DOMAIN_ALREADY_IN_USE_ERROR = "domain_already_in_use";

export class OrganizationService
  extends BaseService
  implements IOrganizationService
{
  public constructor(
    organizationId: string,
    protected readonly eventService: IEventService,
  ) {
    super("OrganizationService", organizationId);
  }

  public async getOrganization(): Promise<Organization | null> {
    const logger = this.loggerFactory("getOrganization");
    logger.debug("Getting organization");
    const db = await getDbConnection();
    const organizations = db.collection<Organization>(
      ORGANIZATIONS_COLLECTION_NAME,
    );
    const organization = await organizations.findOne({
      _id: this.organizationId,
    });
    if (!organization) {
      logger.warn(
        { organizationId: this.organizationId },
        "Organization not found",
      );
      return null;
    }
    return {
      ...organization,
      _id: String(organization._id),
    };
  }

  public async setDomain(
    domain: string | null | undefined,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("setDomain");
    const normalized = domain?.trim().toLowerCase();
    logger.debug({ domain: normalized }, "Setting organization domain");
    const db = await getDbConnection();
    const organizations = db.collection<Organization>(
      ORGANIZATIONS_COLLECTION_NAME,
    );

    const organization = await organizations.findOne({
      _id: this.organizationId,
    });
    if (!organization) {
      logger.error(
        { organizationId: this.organizationId, domain },
        "Organization not found",
      );

      throw new Error("Organization not found");
    }

    const previousDomain = organization.domain ?? null;
    if (previousDomain === normalized) {
      logger.warn(
        { domain: normalized, previousDomain },
        "Domain is already in use",
      );
      return;
    }

    await organizations.updateOne(
      { _id: this.organizationId },
      { $set: { domain: normalized || null } },
    );

    await invalidateOrganizationHostnameCache(
      previousDomain,
      normalized ?? null,
    );

    await this.eventService.emit(
      ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE,
      { previousDomain, newDomain: normalized ?? null },
      source,
    );
  }
}

export class StaticOrganizationService {
  public async getOrganizationBySlug(
    slug: string,
  ): Promise<Organization | null> {
    // console.debug("Getting organization by slug");
    const db = await getDbConnection();
    const organizations = db.collection<Organization>(
      ORGANIZATIONS_COLLECTION_NAME,
    );
    const organization = await organizations.findOne({ slug });
    if (!organization) {
      // console.warn({ slug }, "Organization not found by slug");
      return null;
    }
    return {
      ...organization,
      _id: String(organization._id),
    };
  }

  public async getOrganizationByDomain(
    domain: string,
  ): Promise<Organization | null> {
    const db = await getDbConnection();
    const organizations = db.collection<Organization>(
      ORGANIZATIONS_COLLECTION_NAME,
    );
    const organization = await organizations.findOne({ domain });
    if (!organization) {
      // console.warn({ domain }, "Organization not found by domain");
      return null;
    }
    return {
      ...organization,
      _id: String(organization._id),
    };
  }
}
