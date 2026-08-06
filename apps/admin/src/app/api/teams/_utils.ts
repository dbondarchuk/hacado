import { getServicesContainer, getSession } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import type { SessionUser } from "@hacado/types";
import { canFilterByMember, canManageTeam } from "@hacado/utils";
import { NextResponse } from "next/server";

export async function requireTeamManager(logName: string, method: string) {
  const logger = getLoggerFactory(logName)(method);
  const session = await getSession();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) {
    logger.warn("Unauthorized");
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, code: "unauthorized", error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }
  if (!canManageTeam(user)) {
    logger.warn({ role: user.role }, "Forbidden");
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, code: "forbidden", error: "Forbidden" },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session, logger };
}

/** Skip work when the user cannot read appointments across all members. */
export async function requireCanReadAllAppointments(
  logName: string,
  method: string,
) {
  const logger = getLoggerFactory(logName)(method);
  const session = await getSession();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) {
    logger.warn("Unauthorized");
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, code: "unauthorized", error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }
  if (!canFilterByMember(user)) {
    return {
      ok: true as const,
      session,
      logger,
      skip: true as const,
    };
  }
  return { ok: true as const, session, logger, skip: false as const };
}

export async function getTeamServices() {
  return getServicesContainer();
}
