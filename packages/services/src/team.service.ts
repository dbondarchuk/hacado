import type {
  DeactivateMemberResult,
  EventSource,
  IEventService,
  InvitationCanceledPayload,
  InvitationCreatedPayload,
  ITeamService,
  MemberCreatedPayload,
  MemberDeactivatedPayload,
  MemberInactiveReason,
  MemberProfileUpdate,
  MemberProfileUpdatedPayload,
  MemberReactivatedPayload,
  MemberRoleChangedPayload,
  MemberStatus,
  Organization,
  OrganizationAdminContact,
  OrganizationMember,
  Query,
  ReconcileSlotsResult,
  TeamMemberListModel,
  UserRole,
  WithTotal,
} from "@hacado/types";
import {
  INVITATION_CANCELED_EVENT_TYPE,
  INVITATION_CREATED_EVENT_TYPE,
  MEMBER_CREATED_EVENT_TYPE,
  MEMBER_DEACTIVATED_EVENT_TYPE,
  MEMBER_PROFILE_UPDATED_EVENT_TYPE,
  MEMBER_REACTIVATED_EVENT_TYPE,
  MEMBER_ROLE_CHANGED_EVENT_TYPE,
} from "@hacado/types";
import { buildSearchQuery, escapeRegex } from "@hacado/utils";
import { Filter, ObjectId, Sort } from "mongodb";
import { getRedisClient } from "./bullmq/redis-client";
import {
  APPOINTMENTS_COLLECTION_NAME,
  MEMBERS_COLLECTION_NAME,
  ORGANIZATIONS_COLLECTION_NAME,
} from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

function normalizeMemberId(id: ObjectId | string): string {
  return typeof id === "string" ? id : id.toString();
}

export class TeamService extends BaseService implements ITeamService {
  public constructor(
    organizationId: string,
    private readonly eventService: IEventService,
  ) {
    super("TeamService", organizationId);
  }

  public async getMembers(options?: {
    status?: MemberStatus | MemberStatus[];
    includeInactive?: boolean;
  }): Promise<OrganizationMember[]> {
    const logger = this.loggerFactory("getMembers");
    const db = await getDbConnection();
    const filter: Record<string, unknown> = {
      organizationId: this.organizationId,
    };

    if (options?.status) {
      filter.status = Array.isArray(options.status)
        ? { $in: options.status }
        : options.status;
    } else if (!options?.includeInactive) {
      filter.status = "active";
    }

    const members = await db
      .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
      .find(filter)
      .sort({ createdAt: 1 })
      .toArray();

    logger.debug({ count: members.length }, "Members loaded");
    return members;
  }

  public async getMemberById(
    memberId: string,
  ): Promise<OrganizationMember | null> {
    const db = await getDbConnection();
    return db.collection<OrganizationMember>(MEMBERS_COLLECTION_NAME).findOne({
      _id: memberId,
      organizationId: this.organizationId,
    } as any);
  }

  public async getMemberByUserId(
    userId: string,
  ): Promise<OrganizationMember | null> {
    const db = await getDbConnection();
    return db.collection<OrganizationMember>(MEMBERS_COLLECTION_NAME).findOne({
      organizationId: this.organizationId,
      userId,
    });
  }

  public async getActiveMembers(): Promise<OrganizationMember[]> {
    return this.getMembers({ status: "active" });
  }

  public async listMembers(
    query: Query & {
      status?: MemberStatus[];
      role?: UserRole[];
      priorityIds?: string[];
      start?: Date;
      end?: Date;
    },
  ): Promise<WithTotal<TeamMemberListModel>> {
    const logger = this.loggerFactory("listMembers");
    logger.debug({ query }, "Listing members");

    const db = await getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { createdAt: 1 };

    const filter: Filter<OrganizationMember> = {
      organizationId: this.organizationId,
    };

    if (query.status?.length) {
      filter.status = { $in: query.status };
    }

    if (query.role?.length) {
      filter.role = { $in: query.role };
    }

    if (query.start || query.end) {
      filter.createdAt = {
        ...(query.start ? { $gte: query.start } : {}),
        ...(query.end ? { $lte: query.end } : {}),
      };
    }

    if (query.search?.trim()) {
      const $regex = new RegExp(escapeRegex(query.search.trim()), "i");
      filter.$or = buildSearchQuery<OrganizationMember>(
        { $regex },
        "name",
        "email",
      );
    }

    const priorityStages = query.priorityIds?.length
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
              values: {
                $concatArrays: ["$priority", "$other"],
              },
            },
          },
          { $unwind: "$values" },
          { $replaceRoot: { newRoot: "$values" } },
        ]
      : [{ $match: filter }, { $sort: sort }];

    const [result] = await db
      .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
      .aggregate([
        ...priorityStages,
        {
          $project: {
            calendarSources: 0,
          },
        },
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
      items: (result.paginatedResults || []) as TeamMemberListModel[],
    };

    logger.debug(
      { total: response.total, count: response.items.length },
      "Members listed",
    );
    return response;
  }

  public async getActiveMemberCount(): Promise<number> {
    const db = await getDbConnection();
    return db.collection(MEMBERS_COLLECTION_NAME).countDocuments({
      organizationId: this.organizationId,
      status: "active",
    });
  }

  public async getOwnerMember(): Promise<OrganizationMember> {
    const db = await getDbConnection();
    const owner = await db
      .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
      .findOne({
        organizationId: this.organizationId,
        role: "owner",
      });

    if (!owner) {
      throw new Error("Owner not found");
    }

    return owner;
  }

  public async canInviteMoreMembers(): Promise<boolean> {
    const db = await getDbConnection();
    const org = await db
      .collection<Organization>(ORGANIZATIONS_COLLECTION_NAME)
      .findOne(
        { _id: this.organizationId },
        { projection: { availableUsers: 1, userSlots: 1 } },
      );

    const available =
      org?.availableUsers ??
      (org?.userSlots
        ? (org.userSlots.included ?? 0) + (org.userSlots.additional ?? 0)
        : 1);
    const active = await this.getActiveMemberCount();
    return active < available;
  }

  public async listUpcomingAppointmentsForMember(memberId: string): Promise<
    Array<{
      _id: string;
      dateTime: Date;
      customerName?: string;
    }>
  > {
    const db = await getDbConnection();
    const now = new Date();
    const rows = await db
      .collection(APPOINTMENTS_COLLECTION_NAME)
      .find({
        organizationId: this.organizationId,
        memberId,
        dateTime: { $gte: now },
        status: { $ne: "declined" },
      })
      .project({ _id: 1, dateTime: 1, "fields.name": 1 })
      .sort({ dateTime: 1 })
      .limit(50)
      .toArray();

    return rows.map((r) => ({
      _id: String(r._id),
      dateTime: r.dateTime as Date,
      customerName: (r as { fields?: { name?: string } }).fields?.name,
    }));
  }

  public async deactivateMember(
    memberId: string,
    reason: MemberInactiveReason,
    source: EventSource,
    options?: { force?: boolean },
  ): Promise<DeactivateMemberResult> {
    const logger = this.loggerFactory("deactivateMember");
    const member = await this.getMemberById(memberId);
    if (!member) return { ok: false, code: "not_found" };
    if (member.role === "owner") {
      return { ok: false, code: "cannot_deactivate_owner" };
    }

    if (reason === "removed" && !options?.force) {
      const upcoming = await this.listUpcomingAppointmentsForMember(memberId);
      if (upcoming.length) {
        return {
          ok: false,
          code: "has_upcoming_appointments",
          upcomingAppointments: upcoming,
        };
      }
    }

    const db = await getDbConnection();
    const inactivatedAt = new Date();
    await db.collection<OrganizationMember>(MEMBERS_COLLECTION_NAME).updateOne(
      {
        _id: memberId as unknown as OrganizationMember["_id"],
        organizationId: this.organizationId,
      },
      {
        $set: {
          status: "inactive",
          inactiveReason: reason,
          inactivatedAt,
        },
      },
    );

    await this.invalidateUserSessions(member.userId);

    const deactivatedMember: OrganizationMember = {
      ...member,
      status: "inactive",
      inactiveReason: reason,
      inactivatedAt,
    };

    await this.eventService.emit(
      MEMBER_DEACTIVATED_EVENT_TYPE,
      {
        member: deactivatedMember,
        reason,
      } satisfies MemberDeactivatedPayload,
      source,
    );

    logger.info({ memberId, reason }, "Member deactivated");
    return {
      ok: true,
      upcomingAppointmentCount: (
        await this.listUpcomingAppointmentsForMember(memberId)
      ).length,
    };
  }

  public async reactivateMember(
    memberId: string,
    source: EventSource,
  ): Promise<OrganizationMember | null> {
    if (!(await this.canInviteMoreMembers())) {
      return null;
    }

    const db = await getDbConnection();
    await db.collection<OrganizationMember>(MEMBERS_COLLECTION_NAME).updateOne(
      {
        _id: memberId as unknown as OrganizationMember["_id"],
        organizationId: this.organizationId,
        inactiveReason: "downgrade",
      },
      {
        $set: { status: "active" },
        $unset: { inactiveReason: "", inactivatedAt: "" },
      },
    );

    const member = await this.getMemberById(memberId);
    if (member?.status === "active") {
      await this.eventService.emit(
        MEMBER_REACTIVATED_EVENT_TYPE,
        { member } satisfies MemberReactivatedPayload,
        source,
      );
    }

    return member;
  }

  public async updateMemberRole(
    memberId: string,
    role: Exclude<UserRole, "owner">,
    source: EventSource,
  ): Promise<OrganizationMember | null> {
    const member = await this.getMemberById(memberId);
    if (!member || member.role === "owner") return null;

    const previousRole = member.role;
    if (previousRole === role) {
      return member;
    }

    const db = await getDbConnection();
    await db.collection<OrganizationMember>(MEMBERS_COLLECTION_NAME).updateOne(
      {
        _id: memberId as unknown as OrganizationMember["_id"],
        organizationId: this.organizationId,
      },
      { $set: { role } },
    );

    const updated = await this.getMemberById(memberId);
    if (updated) {
      await this.eventService.emit(
        MEMBER_ROLE_CHANGED_EVENT_TYPE,
        {
          member: updated,
          previousRole,
          role,
        } satisfies MemberRoleChangedPayload,
        source,
      );
    }

    return updated;
  }

  public async reconcileMembersToSlots(
    source: EventSource,
  ): Promise<ReconcileSlotsResult> {
    const logger = this.loggerFactory("reconcileMembersToSlots");
    const db = await getDbConnection();
    const org = await db
      .collection<Organization>(ORGANIZATIONS_COLLECTION_NAME)
      .findOne({ _id: this.organizationId });

    const availableUsers =
      org?.availableUsers ??
      (org?.userSlots
        ? (org.userSlots.included ?? 0) + (org.userSlots.additional ?? 0)
        : 1);

    const active = await this.getMembers({ status: "active" });
    const deactivatedMemberIds: string[] = [];
    const reactivatedMemberIds: string[] = [];

    if (active.length > availableUsers) {
      const excess = active.length - availableUsers;
      const nonOwners = active
        .filter((m) => m.role !== "owner")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      for (let i = 0; i < excess && i < nonOwners.length; i++) {
        const id = normalizeMemberId(nonOwners[i]._id);
        await this.deactivateMember(id, "downgrade", source, { force: true });
        deactivatedMemberIds.push(id);
      }
    } else if (active.length < availableUsers) {
      const slots = availableUsers - active.length;
      const candidates = await db
        .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
        .find({
          organizationId: this.organizationId,
          status: "inactive",
          inactiveReason: "downgrade",
        })
        .sort({ createdAt: 1 })
        .limit(slots)
        .toArray();

      for (const m of candidates) {
        const id = normalizeMemberId(m._id);
        const reactivated = await this.reactivateMember(id, source);
        if (reactivated?.status === "active") {
          reactivatedMemberIds.push(id);
        }
      }
    }

    const activeMemberCount = await this.getActiveMemberCount();
    logger.info(
      {
        availableUsers,
        activeMemberCount,
        deactivatedMemberIds,
        reactivatedMemberIds,
      },
      "Slots reconciled",
    );

    return {
      deactivatedMemberIds,
      reactivatedMemberIds,
      availableUsers,
      activeMemberCount,
    };
  }

  public async hasUpcomingAppointmentsOnInactiveMembers(): Promise<
    Array<{ memberId: string; memberName: string; count: number }>
  > {
    const inactive = await this.getMembers({
      status: "inactive",
      includeInactive: true,
    });
    const results: Array<{
      memberId: string;
      memberName: string;
      count: number;
    }> = [];

    for (const m of inactive) {
      const upcoming = await this.listUpcomingAppointmentsForMember(
        normalizeMemberId(m._id),
      );
      if (upcoming.length) {
        results.push({
          memberId: normalizeMemberId(m._id),
          memberName: m.name || m.email || m.userId,
          count: upcoming.length,
        });
      }
    }

    return results;
  }

  public async updateMemberProfile(
    memberId: string,
    profile: MemberProfileUpdate,
    source: EventSource,
  ): Promise<OrganizationMember | null> {
    const logger = this.loggerFactory("updateMemberProfile");
    logger.debug(
      { memberId, profile, organizationId: this.organizationId },
      "Updating member profile",
    );

    const db = await getDbConnection();
    const result = await db
      .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
      .updateOne(
        {
          _id: memberId as unknown as OrganizationMember["_id"],
          organizationId: this.organizationId,
        },
        { $set: profile },
      );

    if (!result.matchedCount) {
      logger.warn(
        { memberId, organizationId: this.organizationId },
        "Member not updated",
      );
      return null;
    }

    const member = await this.getMemberById(memberId);
    if (member) {
      await this.eventService.emit(
        MEMBER_PROFILE_UPDATED_EVENT_TYPE,
        {
          member,
          update: profile,
        } satisfies MemberProfileUpdatedPayload,
        source,
      );
    }

    return member;
  }

  public async emitInvitationCreated(
    invitation: { invitationId: string; email: string; role: string },
    source: EventSource,
  ): Promise<void> {
    await this.eventService.emit(
      INVITATION_CREATED_EVENT_TYPE,
      {
        invitationId: invitation.invitationId,
        email: invitation.email,
        role: invitation.role,
      } satisfies InvitationCreatedPayload,
      source,
    );
  }

  public async emitInvitationCanceled(
    invitation: { invitationId: string; email: string; role: string },
    source: EventSource,
  ): Promise<void> {
    await this.eventService.emit(
      INVITATION_CANCELED_EVENT_TYPE,
      {
        invitationId: invitation.invitationId,
        email: invitation.email,
        role: invitation.role,
      } satisfies InvitationCanceledPayload,
      source,
    );
  }

  public async emitMemberCreated(
    member: OrganizationMember,
    source: EventSource,
    options?: { invitationId?: string },
  ): Promise<void> {
    await this.eventService.emit(
      MEMBER_CREATED_EVENT_TYPE,
      {
        member,
        invitationId: options?.invitationId,
      } satisfies MemberCreatedPayload,
      source,
    );
  }

  public async getOrganizationAdminContacts(): Promise<
    OrganizationAdminContact[]
  > {
    const logger = this.loggerFactory("getOrganizationAdminContacts");
    logger.debug(
      { organizationId: this.organizationId },
      "Getting organization admin contacts",
    );
    const db = await getDbConnection();

    const members = await db
      .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
      .find({
        organizationId: this.organizationId,
        status: "active",
        role: { $in: ["owner", "admin"] satisfies UserRole[] },
      })
      .sort({ createdAt: 1 })
      .toArray();

    if (!members.length) {
      logger.warn(
        { organizationId: this.organizationId },
        "Organization admin members not found",
      );
      return [];
    }

    const contacts: OrganizationAdminContact[] = [];
    for (const member of members) {
      if (!member.email) continue;
      contacts.push({
        memberId: normalizeMemberId(member._id),
        email: member.email,
        name: member.name || member.email,
        language: member.language || "en",
      });
    }

    logger.debug(
      { organizationId: this.organizationId, count: contacts.length },
      "Organization admin contacts loaded from members",
    );
    return contacts;
  }

  private async invalidateUserSessions(userId: string): Promise<void> {
    const logger = this.loggerFactory("invalidateUserSessions");
    try {
      const redis = getRedisClient();
      const activeKey = `active-sessions-${userId}`;
      const activeRaw = await redis.get(activeKey);
      if (activeRaw) {
        try {
          const sessions = JSON.parse(activeRaw) as Array<{ token?: string }>;
          for (const session of sessions) {
            if (session?.token) await redis.del(session.token);
          }
        } catch {
          // ignore malformed active-sessions payload
        }
        await redis.del(activeKey);
      }

      const db = await getDbConnection();
      await db.collection("sessions").deleteMany({ userId });
      logger.debug({ userId }, "Sessions invalidated");
    } catch (error) {
      logger.warn({ error, userId }, "Failed to invalidate sessions");
    }
  }
}
