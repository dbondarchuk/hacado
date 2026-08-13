import { getMemberLanguageForUser } from "@/lib/auth/member-language";
import { resolveMemberProfileFields } from "@/lib/auth/pending-member-profile";
import { teamAc, teamOrganizationRoles } from "@/lib/auth/permissions";
import { persistPolarSubscriptionToOrganization } from "@/lib/billing/persist-polar-subscription";
import {
  applyPolarOrderPaidToSmsBalances,
  applyPolarOrderPaidToUserSlots,
} from "@/lib/billing/polar-order-paid";
import { sendEmail } from "@/utils/email/send-email";
import { languages, type Language } from "@hacado/i18n";
import {
  getPolarClient,
  getRedisClient,
  ServicesContainer,
} from "@hacado/services";
import { resolvePlanTierFromOrganization } from "@hacado/services/billing";
import { MEMBERS_COLLECTION_NAME } from "@hacado/services/collections";
import {
  getDbConnection,
  getDbConnectionSync,
} from "@hacado/services/database";
import {
  memberEventSource,
  OrganizationSubscriptionStatus,
  systemEventSource,
  type Organization as OrganizationDbModel,
  type OrganizationMember,
  type SessionUser,
  type WithDatabaseId,
} from "@hacado/types";
import { getAdminUrl } from "@hacado/utils";
import { polar, portal, webhooks } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError } from "better-auth/api";
import { captcha, customSession, organization } from "better-auth/plugins";
import { ObjectId } from "mongodb";
import { ApiError } from "next/dist/server/api-utils";

const memberProfileAdditionalFields = {
  email: {
    type: "string" as const,
    required: false,
    input: false,
  },
  name: {
    type: "string" as const,
    required: false,
    input: true,
  },
  phone: {
    type: "string" as const,
    required: false,
    input: true,
  },
  bio: {
    type: "string" as const,
    required: false,
    input: true,
  },
  language: {
    type: [...languages],
    required: false,
    input: true,
    defaultValue: "en",
  },
  image: {
    type: "string" as const,
    required: false,
    input: true,
  },
  status: {
    type: "string" as const,
    required: false,
    defaultValue: "active",
    input: false,
  },
  inactiveReason: {
    type: "string" as const,
    required: false,
    input: false,
  },
  inactivatedAt: {
    type: "date" as const,
    required: false,
    input: false,
  },
};

export const auth = betterAuth({
  trustedOrigins: async (request) => {
    const defaultOrigins = [
      process.env.BETTER_AUTH_TRUST_HOST || process.env.AUTH_TRUST_HOST || "",
      ...(process.env.NODE_ENV === "development"
        ? ["http://localhost:3001"]
        : []),
    ];
    if (!request) {
      return defaultOrigins;
    }

    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/auth/polar/webhooks")) {
      return ["*"];
    }

    return defaultOrigins;
  },
  database: (options: any) => {
    return mongodbAdapter(getDbConnectionSync(), {
      usePlural: true,
      transaction: false,
    })(options);
  },
  secondaryStorage: {
    get: async (key: string) => {
      return await getRedisClient().get(key);
    },
    set: async (key: string, value: any, ttl: number | undefined) => {
      if (ttl) {
        await getRedisClient().set(key, value, "EX", ttl);
      } else {
        await getRedisClient().set(key, value);
      }
    },
    delete: async (key: string) => {
      await getRedisClient().del(key);
    },
  },
  advanced: {
    database: {
      generateId: () => new ObjectId().toString(),
    },
    defaultCookieAttributes: {
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }) => {
      const language = await getMemberLanguageForUser(user.id);
      await sendEmail("resetPassword", user.email, language, {
        url,
        token,
        name: user.name,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      const language = await getMemberLanguageForUser(user.id);
      await sendEmail("emailVerification", user.email, language, {
        url,
        token,
        name: user.name,
      });
    },
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 24 hours
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url, token }) => {
        const language = await getMemberLanguageForUser(user.id);
        await sendEmail("changeEmail", user.email, language, {
          url,
          token,
          name: user.name,
          newEmail,
        });
      },
    },
  },
  databaseHooks: {
    user: {
      update: {
        after: async (user) => {
          if (!user.email || !user.id) return;
          const db = await getDbConnection();
          await db
            .collection(MEMBERS_COLLECTION_NAME)
            .updateMany(
              { userId: String(user.id) },
              { $set: { email: String(user.email).toLowerCase() } },
            );
        },
      },
    },
  },
  plugins: [
    ...(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY
      ? [
          captcha({
            provider: "cloudflare-turnstile",
            secretKey: process.env.TURNSTILE_SECRET_KEY!,
            endpoints: ["/sign-up/email", "/request-password-reset"],
          }),
        ]
      : []),
    organization({
      organizationLimit: 1,
      ac: teamAc,
      roles: teamOrganizationRoles,
      invitationExpiresIn: 60 * 60 * 24 * 7,
      cancelPendingInvitationsOnReInvite: true,
      membershipLimit: async (_user, organizationDoc) => {
        const db = await getDbConnection();
        const org = await db
          .collection<OrganizationDbModel>("organizations")
          .findOne({ _id: organizationDoc.id });
        return (
          org?.availableUsers ??
          (org?.userSlots
            ? (org.userSlots.included ?? 0) + (org.userSlots.additional ?? 0)
            : 1)
        );
      },
      schema: {
        member: {
          additionalFields: memberProfileAdditionalFields,
        },
      },
      sendInvitationEmail: async (data) => {
        const adminUrl = getAdminUrl();
        const url = `${adminUrl}/accept-invitation?invitationId=${data.id}`;
        const language = await getMemberLanguageForUser(
          data.inviter.user.id,
          data.organization.id,
        );
        await sendEmail("teamInvitation", data.email, language, {
          url,
          organizationName: data.organization.name,
          inviterName: data.inviter.user.name,
          role: data.role,
        });
      },
      requireEmailVerificationOnInvitation: false,
      organizationHooks: {
        beforeAddMember: async ({ member, user }) => {
          const profile = await resolveMemberProfileFields(user, {
            name: (member as { name?: string }).name,
            phone: (member as { phone?: string }).phone,
            language: (member as { language?: Language }).language,
          });
          return {
            data: {
              ...member,
              ...profile,
            },
          };
        },
        /**
         * Better Auth's acceptInvitation calls createMember directly and skips
         * beforeAddMember — apply signup profile fields here instead.
         */
        afterAcceptInvitation: async ({ invitation, member, user }) => {
          const profile = await resolveMemberProfileFields(user, {
            name: (member as { name?: string }).name,
            phone: (member as { phone?: string }).phone,
            language: (member as { language?: Language }).language,
          });
          const db = await getDbConnection();
          await db.collection(MEMBERS_COLLECTION_NAME).updateOne(
            {
              organizationId: member.organizationId,
              userId: user.id,
            },
            { $set: profile },
          );

          const teamService = ServicesContainer(
            member.organizationId,
          ).teamService;
          const created = await teamService.getMemberByUserId(user.id);
          if (created) {
            const memberId =
              typeof created._id === "string"
                ? created._id
                : String(created._id);
            await teamService.emitMemberCreated(
              created,
              memberEventSource(memberId),
              { invitationId: invitation.id },
            );
          }
        },
        afterCreateInvitation: async ({
          invitation,
          inviter,
          organization,
        }) => {
          const teamService = ServicesContainer(organization.id).teamService;
          const inviterMember = await teamService.getMemberByUserId(inviter.id);
          const source = inviterMember
            ? memberEventSource(
                typeof inviterMember._id === "string"
                  ? inviterMember._id
                  : String(inviterMember._id),
              )
            : systemEventSource;
          await teamService.emitInvitationCreated(
            {
              invitationId: invitation.id,
              email: invitation.email,
              role: String(invitation.role),
            },
            source,
          );
        },
        afterCancelInvitation: async ({
          invitation,
          cancelledBy,
          organization,
        }) => {
          const teamService = ServicesContainer(organization.id).teamService;
          const actorMember = await teamService.getMemberByUserId(
            cancelledBy.id,
          );
          const source = actorMember
            ? memberEventSource(
                typeof actorMember._id === "string"
                  ? actorMember._id
                  : String(actorMember._id),
              )
            : systemEventSource;
          await teamService.emitInvitationCanceled(
            {
              invitationId: invitation.id,
              email: invitation.email,
              role: String(invitation.role),
            },
            source,
          );
        },
        beforeCreateInvitation: async ({ invitation, organization: org }) => {
          const db = await getDbConnection();
          const email = invitation.email.toLowerCase();
          const existingUser = await db
            .collection("users")
            .findOne(
              { $expr: { $eq: [{ $toLower: "$email" }, email] } },
              { projection: { _id: 1 } },
            );
          if (existingUser) {
            const userId = String(existingUser._id);
            const existingMembership = await db
              .collection(MEMBERS_COLLECTION_NAME)
              .findOne({ userId }, { projection: { _id: 1 } });
            if (existingMembership) {
              throw new APIError("BAD_REQUEST", {
                message:
                  "The user is part of another organization. Please use another email address",
                code: "USER_ALREADY_IN_ORGANIZATION",
              });
            }
          }
          const orgDoc = await db
            .collection<OrganizationDbModel>("organizations")
            .findOne({ _id: org.id });
          const available =
            orgDoc?.availableUsers ??
            (orgDoc?.userSlots
              ? (orgDoc.userSlots.included ?? 0) +
                (orgDoc.userSlots.additional ?? 0)
              : 1);
          const activeCount = await db
            .collection(MEMBERS_COLLECTION_NAME)
            .countDocuments({
              organizationId: org.id,
              status: "active",
            });
          if (activeCount >= available) {
            throw new APIError("BAD_REQUEST", {
              message:
                "No available user slots. Purchase more seats to invite.",
              code: "NO_AVAILABLE_USER_SLOTS",
            });
          }
          if (invitation.role === "owner") {
            throw new APIError("BAD_REQUEST", {
              message: "Cannot invite another owner",
              code: "INVALID_ROLE",
            });
          }
        },
        beforeRemoveMember: async ({ member }) => {
          if (member.role === "owner") {
            throw new APIError("BAD_REQUEST", {
              message: "Cannot remove the owner",
              code: "CANNOT_REMOVE_OWNER",
            });
          }
        },
      },
    }),
    polar({
      client: getPolarClient().client,
      createCustomerOnSignUp: false,
      use: [
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onSubscriptionCreated: async ({ data }) => {
            await persistPolarSubscriptionToOrganization(data);
          },
          onSubscriptionUpdated: async ({ data }) => {
            await persistPolarSubscriptionToOrganization(data);
          },
          onSubscriptionActive: async ({ data }) => {
            await persistPolarSubscriptionToOrganization(data);
          },
          onSubscriptionCanceled: async ({ data }) => {
            await persistPolarSubscriptionToOrganization(data);
          },
          onSubscriptionRevoked: async ({ data }) => {
            await persistPolarSubscriptionToOrganization(data);
          },
          onSubscriptionUncanceled: async ({ data }) => {
            await persistPolarSubscriptionToOrganization(data);
          },
          onOrderPaid: async ({ data }) => {
            await applyPolarOrderPaidToSmsBalances(data);
            await applyPolarOrderPaidToUserSlots(data);
          },
          onPayload: async ({ data }) => {
            console.log("onPayloadReceived", data);
          },
        }),
      ],
    }),
    customSession(async ({ user, session }) => {
      const db = await getDbConnection();
      const sessionActiveOrgId = (
        session as { activeOrganizationId?: string | null }
      ).activeOrganizationId;

      let member: OrganizationMember | null = null;

      if (sessionActiveOrgId) {
        member = await db
          .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
          .findOne({
            organizationId: sessionActiveOrgId,
            userId: user.id,
            status: "active",
          });
      }

      if (!member) {
        member = await db
          .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
          .find({ userId: user.id, status: "active" })
          .sort({ createdAt: 1 })
          .limit(1)
          .next();

        if (
          member &&
          session.token &&
          member.organizationId !== sessionActiveOrgId
        ) {
          await db
            .collection("sessions")
            .updateOne(
              { token: session.token },
              { $set: { activeOrganizationId: member.organizationId } },
            );
        }
      }

      if (!member) {
        const sessionUser = {
          ...user,
          organizationId: "",
          organizationInstalled: false,
          phone: "",
          language: "en" as Language,
          organizationName: "",
          organizationSlug: "",
          organizationDomain: "",
          role: "owner" as const,
          memberId: "",
          memberStatus: "active" as const,
          memberRole: "owner" as const,
          availableUsers: 1,
          allowAdditionalUsers: false,
          subscriptionStatus: OrganizationSubscriptionStatus.Active,
          subscriptionPlanTier: null,
          feesExempt: false,
          bio: null as string | null,
          calendarSources: [] as SessionUser["calendarSources"],
          meetingUrlProviderAppId: null as string | null,
        } as SessionUser;
        return {
          ...session,
          user: sessionUser,
        };
      }

      if (!member.email && user.email) {
        const email = user.email.toLowerCase();
        await db
          .collection(MEMBERS_COLLECTION_NAME)
          .updateOne({ _id: member._id as never }, { $set: { email } });
        member.email = email;
      }

      const organizationId = member.organizationId;
      const organization = await db
        .collection<WithDatabaseId<OrganizationDbModel>>("organizations")
        .findOne({
          _id: organizationId,
        });

      if (!organization) {
        throw new ApiError(400, "Organization not found");
      }

      const memberRole = member.role || ("owner" as const);
      const memberStatus = member.status || "active";
      const memberId =
        typeof member._id === "string" ? member._id : String(member._id);

      const availableUsers =
        organization.availableUsers ??
        (organization.userSlots
          ? (organization.userSlots.included ?? 0) +
            (organization.userSlots.additional ?? 0)
          : 1);

      return {
        ...session,
        user: {
          ...user,
          name: member.name || user.name || "",
          phone: member.phone || "",
          bio: member.bio ?? null,
          image: member.image ?? user.image ?? null,
          organizationInstalled: !!organization.isInstalled,
          organizationId,
          organizationName: organization.name ?? "",
          organizationSlug: organization.slug,
          organizationDomain: organization.domain ?? "",
          language: member.language || "en",
          role: memberRole,
          memberId,
          memberStatus,
          memberRole,
          availableUsers,
          allowAdditionalUsers: organization.allowAdditionalUsers ?? false,
          subscriptionStatus:
            organization.polarSubscriptionStatus ??
            OrganizationSubscriptionStatus.Active,
          subscriptionPlanTier: resolvePlanTierFromOrganization(organization),
          feesExempt: !!organization.feesExempt,
          calendarSources: member.calendarSources ?? [],
          meetingUrlProviderAppId: member.meetingUrlProviderAppId ?? null,
        } as SessionUser,
      };
    }),
  ],
});

export type Session = Omit<typeof auth.$Infer.Session, "user"> & {
  user: SessionUser;
};
export type User = SessionUser;
