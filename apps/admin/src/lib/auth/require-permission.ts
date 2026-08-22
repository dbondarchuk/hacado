import { getSession } from "@/app/utils";
import type { AppLogger } from "@hacado/logger";
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
  logger: AppLogger,
) {
  const session = await getSession();
  const user = session?.user as SessionUser | undefined;

  logger.debug("Checking permission for user", { userId: user?.id });

  if (!user?.id) {
    logger.warn("Unauthorized");
    return {
      ok: false as const,
      logger,
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
      logger,
      response: NextResponse.json(
        { success: false, code: "forbidden", error: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  logger.debug("Permission granted for user", { userId: user?.id });
  return { ok: true as const, session, user, logger, response: null };
}
