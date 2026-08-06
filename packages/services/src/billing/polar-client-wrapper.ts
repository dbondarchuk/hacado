import { getLoggerFactory } from "@hacado/logger";
import type { Polar } from "@polar-sh/sdk";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription";
import { getPolarClient } from "./polar-client";
import { PolarConfig } from "./types";

/** Inputs for Polar team-customer lifecycle (used by `PolarClientWrapper`). */
export type BillingEnsureTeamCustomerInput = {
  organizationId: string;
  ownerUserId: string;
  ownerEmail: string;
  ownerName?: string | null;
  teamName?: string | null;
};

export type BillingSyncTeamCustomerFromGeneralInput = {
  organizationId: string;
  name: string;
  email: string;
};

const wrapperLogger = getLoggerFactory("PolarClientWrapper");

export type PolarCustomerMeterRow = {
  meterId: string;
  balance: number;
  creditedUnits: number;
  consumedUnits: number;
};

/**
 * All Polar SDK usage for billing should go through this wrapper.
 */
export class PolarClientWrapper {
  private readonly polar: Polar;

  constructor(private readonly polarConfig: PolarConfig) {
    this.polar = getPolarClient(polarConfig);
  }

  public get client(): Polar {
    return this.polar;
  }

  public get config(): PolarConfig {
    return { ...this.polarConfig };
  }

  async getSubscriptionById(subscriptionId: string): Promise<Subscription> {
    return this.polar.subscriptions.get({ id: subscriptionId });
  }

  async getCustomerMeterRow(params: {
    customerId?: string;
    externalCustomerId?: string;
    meterId: string;
  }): Promise<PolarCustomerMeterRow | null> {
    const meterId = params.meterId.trim();
    if (!meterId) return null;

    const page = params.customerId?.trim()
      ? await this.polar.customerMeters.list({
          customerId: params.customerId.trim(),
          meterId,
          limit: 10,
        })
      : params.externalCustomerId?.trim()
        ? await this.polar.customerMeters.list({
            externalCustomerId: params.externalCustomerId.trim(),
            meterId,
            limit: 10,
          })
        : null;

    if (!page) return null;

    const row =
      page.result.items.find((m) => m.meterId === meterId) ??
      page.result.items[0];

    if (!row) return null;

    return {
      meterId: row.meterId,
      balance: row.balance,
      creditedUnits: row.creditedUnits,
      consumedUnits: row.consumedUnits,
    };
  }

  async ingestMeteredEvents(
    events: Array<{
      name: string;
      externalCustomerId: string;
      externalId?: string;
      metadata?: Record<string, string>;
    }>,
  ): Promise<void> {
    if (!events.length) return;
    await this.polar.events.ingest({ events });
  }

  async ensureTeamCustomerForOrganization(
    input: BillingEnsureTeamCustomerInput,
  ): Promise<void> {
    const externalId = input.organizationId.trim();
    const ownerUserId = input.ownerUserId.trim();
    const ownerEmail = input.ownerEmail.trim();

    if (!externalId || !ownerUserId || !ownerEmail) {
      wrapperLogger("ensureTeamCustomerForOrganization").debug(
        { externalId, hasOwner: !!ownerUserId, hasEmail: !!ownerEmail },
        "Skipping Polar team customer: missing organization id, owner id, or email",
      );
      return;
    }

    try {
      await this.polar.customers.getExternal({ externalId });
      return;
    } catch (error) {
      wrapperLogger("ensureTeamCustomerForOrganization").debug(
        { externalId, error },
        "Error getting customer, creating...",
      );
      /* create below */
    }

    const teamName = input.teamName?.trim();
    const ownerName = input.ownerName?.trim();

    try {
      await this.polar.customers.create({
        type: "team",
        externalId,
        ...(teamName ? { name: teamName } : {}),
        email: ownerEmail,
        owner: {
          email: ownerEmail,
          ...(ownerName ? { name: ownerName } : {}),
          externalId: ownerUserId,
        },
      });
    } catch (error) {
      try {
        await this.polar.customers.getExternal({ externalId });
        return;
      } catch {
        /* fall through */
      }
      wrapperLogger("ensureTeamCustomerForOrganization").warn(
        { error, organizationId: externalId },
        "Could not ensure Polar team customer",
      );
    }
  }

  listProducts(
    query?: Parameters<Polar["products"]["list"]>[0],
  ): ReturnType<Polar["products"]["list"]> {
    return this.polar.products.list(query ?? {});
  }

  listSubscriptions(
    query?: Parameters<Polar["subscriptions"]["list"]>[0],
  ): ReturnType<Polar["subscriptions"]["list"]> {
    return this.polar.subscriptions.list(query ?? {});
  }

  createCheckoutSession(
    body: Parameters<Polar["checkouts"]["create"]>[0],
  ): ReturnType<Polar["checkouts"]["create"]> {
    return this.polar.checkouts.create(body);
  }

  createCustomerBillingPortalSession(
    body: Parameters<Polar["customerSessions"]["create"]>[0],
  ): ReturnType<Polar["customerSessions"]["create"]> {
    return this.polar.customerSessions.create(body);
  }

  getCustomer(
    externalCustomerId: string,
  ): ReturnType<Polar["customers"]["getExternal"]> {
    return this.polar.customers.getExternal({ externalId: externalCustomerId });
  }

  async syncTeamCustomerFromGeneralSettings(
    input: BillingSyncTeamCustomerFromGeneralInput,
  ): Promise<void> {
    const externalId = input.organizationId.trim();
    const name = input.name.trim();
    const email = input.email.trim();
    if (!externalId || !name || !email) {
      wrapperLogger("syncTeamCustomerFromGeneralSettings").debug(
        { externalId, hasName: !!name, hasEmail: !!email },
        "Skipping Polar team customer sync: missing organization id, name, or email",
      );
      return;
    }

    try {
      await this.polar.customers.updateExternal({
        externalId,
        customerUpdateExternalID: {
          name,
          email,
        },
      });
    } catch (error) {
      wrapperLogger("syncTeamCustomerFromGeneralSettings").warn(
        { error, organizationId: externalId },
        "Could not update Polar team customer from general settings",
      );
    }
  }
}
