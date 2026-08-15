import { getSession } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import type {
  SessionUser,
  TeamPermissionAction,
  TeamPermissionResource,
} from "@hacado/types";
import { hasPermission } from "@hacado/utils";
import { NextResponse } from "next/server";

export async function requirePermission<R extends TeamPermissionResource>(
  resource: R,
  action: TeamPermissionAction<R>,
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

  if (!hasPermission(user, resource, action)) {
    logger.warn({ role: user.role, resource, action }, "Forbidden");
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, code: "forbidden", error: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  return { ok: true as const, session, user, logger };
}
