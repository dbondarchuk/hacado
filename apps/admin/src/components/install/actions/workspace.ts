"use server";

import { auth } from "@/app/auth";
import { languages } from "@hacado/i18n";
import { getLoggerFactory } from "@hacado/logger";
import { StaticOrganizationService } from "@hacado/services";
import {
  CONFIGURATION_COLLECTION_NAME,
  MEMBERS_COLLECTION_NAME,
  ORGANIZATIONS_COLLECTION_NAME,
} from "@hacado/services/collections";
import { getDbConnection } from "@hacado/services/database";
import {
  brandConfigurationSchema,
  generalConfigurationSchema,
  zCountry,
  zCurrency,
  zTimeZone,
  type ConfigurationOption,
  type Organization,
  type OrganizationMember,
} from "@hacado/types";
import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import * as z from "zod";
import { getDefaultBookingConfiguration } from "../default-booking";
import {
  getOrganizationSlugIssue,
  ORGANIZATION_SLUG_MIN_LENGTH,
  ORGANIZATION_SLUG_REGEX,
} from "../organization-slug";

const workspaceInputSchema = z.object({
  businessName: z.string().min(2).max(128),
  address: z.string().trim().max(256).optional().default(""),
  slug: z
    .string()
    .min(ORGANIZATION_SLUG_MIN_LENGTH)
    .max(63)
    .regex(ORGANIZATION_SLUG_REGEX)
    .refine((slug) => !getOrganizationSlugIssue(slug), {
      message: "reserved",
    }),
  timeZone: zTimeZone,
  language: z.enum(languages),
  country: zCountry,
  currency: zCurrency,
});

export type CreateWorkspaceInput = z.infer<typeof workspaceInputSchema>;

export async function createWorkspace(
  input: CreateWorkspaceInput,
): Promise<{ ok: true; updated: boolean } | { ok: false; code: string }> {
  const logger = getLoggerFactory("InstallActions")("createWorkspace");
  logger.debug({ input }, "Creating workspace");

  const slugIssue =
    typeof input?.slug === "string" ? getOrganizationSlugIssue(input.slug) : "invalid";
  if (slugIssue === "too_short" || slugIssue === "invalid") {
    return { ok: false, code: "slug_invalid" };
  }
  if (slugIssue === "reserved") {
    return { ok: false, code: "slug_reserved" };
  }

  const workspaceInputSchemaResult = workspaceInputSchema.safeParse(input);
  if (!workspaceInputSchemaResult.success) {
    logger.error(
      { error: workspaceInputSchemaResult.error },
      "Invalid workspace input",
    );
    return { ok: false, code: "invalid_input" };
  }
  const parsed = workspaceInputSchemaResult.data;
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user) {
    logger.error({ session }, "Unauthorized");
    return { ok: false, code: "unauthorized" };
  }
  if (!(session.user as { emailVerified?: boolean }).emailVerified) {
    logger.error({ userId: session.user.id }, "Email not verified");
    return { ok: false, code: "email_not_verified" };
  }

  const wasExistingOrg = Boolean(
    (session.user as { organizationId?: string }).organizationId,
  );
  const db = await getDbConnection();
  let orgId: string;
  if (session.user.organizationId) {
    orgId = session.user.organizationId;
    const taken = await new StaticOrganizationService().getOrganizationBySlug(
      parsed.slug,
    );
    if (taken && String(taken._id) !== String(orgId)) {
      logger.error({ slug: parsed.slug, orgId }, "Slug taken");
      return { ok: false, code: "slug_taken" };
    }
    await db
      .collection<Organization>(ORGANIZATIONS_COLLECTION_NAME)
      .updateOne(
        { _id: orgId },
        { $set: { slug: parsed.slug, name: parsed.businessName } },
      );
  } else {
    const taken = await new StaticOrganizationService().getOrganizationBySlug(
      parsed.slug,
    );
    if (taken) {
      logger.error({ slug: parsed.slug }, "Slug taken");
      return { ok: false, code: "slug_taken" };
    }
    orgId = new ObjectId().toString();
    await db
      .collection<{
        _id: string;
        slug: string;
        name: string;
        createdAt: Date;
      }>(ORGANIZATIONS_COLLECTION_NAME)
      .insertOne({
        _id: orgId,
        slug: parsed.slug,
        name: parsed.businessName,
        createdAt: new Date(),
      });
  }

  const existingMember = await db
    .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
    .findOne({ organizationId: orgId, userId: session.user.id });
  if (!existingMember) {
    await db.collection<OrganizationMember>(MEMBERS_COLLECTION_NAME).insertOne({
      _id: new ObjectId().toString(),
      organizationId: orgId,
      userId: session.user.id,
      role: "owner",
      createdAt: new Date(),
      status: "active",
      name: session.user.name || "",
      email: session.user.email.toLowerCase(),
      phone: (session.user as { phone?: string }).phone || "",
      language: parsed.language,
      bio: null,
      calendarSources: [],
    });
  } else {
    await db.collection<OrganizationMember>(MEMBERS_COLLECTION_NAME).updateOne(
      { _id: existingMember._id },
      {
        $set: {
          language: parsed.language,
          ...(!existingMember.name && session.user.name
            ? { name: session.user.name }
            : {}),
        },
      },
    );
  }

  try {
    await auth.api.setActiveOrganization({
      body: { organizationId: orgId },
      headers: headersList,
    });
  } catch {
    // Active org may already be set.
  }

  logger.debug(
    { orgId, userId: session.user.id },
    "Resolved organization for workspace",
  );

  const generalValue = generalConfigurationSchema.parse({
    name: parsed.businessName,
    address: parsed.address || "",
    email: session.user.email,
    phone: session.user.phone,
    country: parsed.country,
    currency: parsed.currency,
    timeZone: parsed.timeZone,
    useClientTimezone: false,
  });

  const brandValue = brandConfigurationSchema.parse({
    title: parsed.businessName,
    description: `${parsed.businessName} - Book online with Hacado.`,
    keywords: `${parsed.businessName}, booking`,
    language: parsed.language,
  });

  const configurations = db.collection<
    | ConfigurationOption<"general">
    | ConfigurationOption<"brand">
    | ConfigurationOption<"booking">
  >(CONFIGURATION_COLLECTION_NAME);
  await configurations.updateOne(
    { key: "general", organizationId: orgId },
    { $set: { key: "general", organizationId: orgId, value: generalValue } },
    { upsert: true },
  );
  logger.debug({ orgId }, "Stored general configuration");

  await configurations.updateOne(
    { key: "brand", organizationId: orgId },
    { $set: { key: "brand", organizationId: orgId, value: brandValue } },
    { upsert: true },
  );
  logger.debug({ orgId }, "Stored brand configuration");

  const existingBooking = await configurations.findOne({
    key: "booking",
    organizationId: orgId,
  } as any);
  if (
    !existingBooking?.value ||
    Object.keys(existingBooking.value).length === 0
  ) {
    logger.debug({ orgId }, "No booking config found, applying defaults");
    await configurations.updateOne(
      { key: "booking", organizationId: orgId },
      {
        $set: {
          key: "booking",
          organizationId: orgId,
          value: getDefaultBookingConfiguration(),
        },
      },
      { upsert: true },
    );
    logger.debug({ orgId }, "Stored default booking configuration");
  }

  logger.debug({ orgId }, "Created or updated workspace");
  return { ok: true, updated: wasExistingOrg };
}
