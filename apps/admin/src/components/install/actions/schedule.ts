"use server";

import { auth } from "@/app/auth";
import { getActor } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { ServicesContainer } from "@hacado/services";
import {
  scheduleConfigurationSchema,
  shiftsSchema,
  type Schedule,
} from "@hacado/types";
import { headers } from "next/headers";

export async function getInstallScheduleSnapshot(): Promise<Schedule | null> {
  const logger = getLoggerFactory("InstallActions")(
    "getInstallScheduleSnapshot",
  );
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;
  if (!session?.user || !organizationId) {
    logger.error({ session, organizationId }, "Unauthorized");
    return null;
  }

  const services = ServicesContainer(organizationId, true);
  const existing =
    (await services.configurationService.getConfiguration("schedule")) ?? null;
  const hasWorkingHours = existing?.schedule?.some(
    (day) => day.shifts?.length > 0,
  );
  if (!hasWorkingHours) {
    logger.debug({ organizationId }, "No install schedule snapshot yet");
    return null;
  }

  logger.debug({ organizationId }, "Resolved install schedule snapshot");
  return existing.schedule;
}

export async function saveInstallSchedule(
  schedule: Schedule,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const logger = getLoggerFactory("InstallActions")("saveInstallSchedule");
  const parsedSchedule = shiftsSchema.safeParse(schedule);
  if (!parsedSchedule.success) {
    logger.error({ error: parsedSchedule.error }, "Invalid schedule input");
    return { ok: false, code: "invalid_input" };
  }

  const hasWorkingHours = parsedSchedule.data.some(
    (day) => day.shifts.length > 0,
  );
  if (!hasWorkingHours) {
    return { ok: false, code: "no_working_hours" };
  }

  const config = scheduleConfigurationSchema.safeParse({
    schedule: parsedSchedule.data,
  });
  if (!config.success) {
    logger.error({ error: config.error }, "Invalid schedule configuration");
    return { ok: false, code: "invalid_input" };
  }

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;
  if (!session?.user || !organizationId) {
    logger.error({ session, organizationId }, "Unauthorized");
    return { ok: false, code: "unauthorized" };
  }

  const source = await getActor();
  const services = ServicesContainer(organizationId, true);
  await services.configurationService.setConfiguration(
    "schedule",
    config.data,
    source,
  );
  logger.debug({ organizationId }, "Saved install schedule");
  return { ok: true };
}
