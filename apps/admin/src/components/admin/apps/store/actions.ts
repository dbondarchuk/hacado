"use server";

import { getActor, getServicesContainer, getSession } from "@/app/utils";
import { getOwnerMemberIds } from "@/lib/auth/app-access";
import { sessionCanInstallApp } from "@/lib/billing/subscription-plan-access";
import { AvailableApps } from "@hacado/app-store";
import { withCatalogTarget } from "@hacado/app-store/utils";
import { BaseAllKeys } from "@hacado/i18n";
import { getLoggerFactory } from "@hacado/logger";
import type { SessionUser } from "@hacado/types";
import {
  BookingConfiguration,
  BookingProviderScope,
  bookingProviderScopes,
  CalendarSourceScope,
  calendarSourceScopes,
  ConnectedAppStatusWithText,
  DefaultAppsConfiguration,
  DefaultAppScope,
  defaultAppScopes,
  DefaultAppToInstallScope,
  MeetingUrlProviderScope,
  meetingUrlProviderScopes,
} from "@hacado/types";
import {
  canInstallApp,
  canInstallCompanyApps,
  filterConnectedAppsForInstallQuota,
  filterInstallDefaultScopesForUser,
} from "@hacado/utils";

const logger = getLoggerFactory("AppStoreActions");

export const getInstalledApps = async (name: string) => {
  const actionLogger = logger("getInstalledApps");

  actionLogger.debug(
    {
      appName: name,
    },
    "Getting installed apps",
  );

  try {
    const [servicesContainer, session, ownerMemberIds] = await Promise.all([
      getServicesContainer(),
      getSession(),
      getOwnerMemberIds(),
    ]);
    if (!session) {
      throw new Error("Unauthorized");
    }
    const installed =
      await servicesContainer.connectedAppsService.getAppsByApp(name);
    const result = filterConnectedAppsForInstallQuota(
      session.user as SessionUser,
      installed.map(withCatalogTarget),
      ownerMemberIds,
    );

    actionLogger.debug(
      {
        appName: name,
        installedAppsCount: result.length,
      },
      "Installed apps retrieved successfully",
    );

    return result;
  } catch (error) {
    actionLogger.error(
      {
        appName: name,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to get installed apps",
    );
    throw error;
  }
};

export const installComplexApp = async (name: string) => {
  const actionLogger = logger("installComplexApp");

  actionLogger.debug(
    {
      appName: name,
    },
    "Installing complex app",
  );

  try {
    const servicesContainer = await getServicesContainer();
    const session = await getSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const catalogApp = AvailableApps[name];
    if (
      !catalogApp ||
      !canInstallApp(session.user as SessionUser, catalogApp) ||
      !sessionCanInstallApp(session, name)
    ) {
      throw new Error("subscription_upgrade_required");
    }

    const appId = await servicesContainer.connectedAppsService.createNewApp(
      name,
      session.user.memberId,
    );

    actionLogger.debug(
      {
        appName: name,
        appId,
      },
      "Complex app created, updating status",
    );

    await servicesContainer.connectedAppsService.updateApp(appId, {
      status: "connected",
      statusText: "apps.common.statusText.installed" satisfies BaseAllKeys,
    });

    actionLogger.debug(
      {
        appName: name,
        appId,
        status: "connected",
      },
      "Complex app installed successfully",
    );

    return appId;
  } catch (error) {
    actionLogger.error(
      {
        appName: name,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to install complex app",
    );
    throw error;
  }
};

export const setAppStatus = async (
  appId: string,
  status: ConnectedAppStatusWithText,
) => {
  const actionLogger = logger("setAppStatus");

  actionLogger.debug(
    {
      appId,
      status: status.status,
      statusText: status.statusText,
    },
    "Setting app status",
  );

  try {
    const servicesContainer = await getServicesContainer();
    const result = await servicesContainer.connectedAppsService.updateApp(
      appId,
      status,
    );

    actionLogger.debug(
      {
        appId,
        status: status.status,
        statusText: status.statusText,
      },
      "App status updated successfully",
    );

    return result;
  } catch (error) {
    actionLogger.error(
      {
        appId,
        status: status.status,
        statusText: status.statusText,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to set app status",
    );
    throw error;
  }
};

const DEFAULT_SCOPE_TO_CONFIG_FIELD: Partial<
  Record<DefaultAppScope, keyof DefaultAppsConfiguration>
> = {
  payment: "paymentAppId",
  "mail-send": "emailSenderAppId",
  "text-message-send": "textMessageSenderAppId",
  "text-message-respond": "textMessageResponderAppId",
};

export const setDefaultAppByScope = async (
  appId: string,
  scopes: DefaultAppToInstallScope[],
) => {
  const actionLogger = logger("setDefaultAppByScope");
  const [servicesContainer, actor, session] = await Promise.all([
    getServicesContainer(),
    getActor(),
    getSession(),
  ]);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const uniqueScopes = filterInstallDefaultScopesForUser(
    [...new Set(scopes)],
    session.user as SessionUser,
  );

  actionLogger.debug(
    {
      appId,
      scopes: uniqueScopes,
      canInstallCompany: canInstallCompanyApps(session.user as SessionUser),
    },
    "Setting default app by scope",
  );

  if (
    uniqueScopes.some((scope) =>
      calendarSourceScopes.includes(scope as CalendarSourceScope),
    )
  ) {
    actionLogger.debug(
      { appId, scopes: uniqueScopes },
      "Setting calendar source app",
    );
    const user = await servicesContainer.teamService.getMemberById(
      session.user.memberId,
    );

    if (!user) {
      throw new Error("User not found");
    }

    const currentSources = user.calendarSources ?? [];
    if (!currentSources.some((source) => source.appId === appId)) {
      await servicesContainer.teamService.updateMemberProfile(
        session.user.memberId,
        {
          calendarSources: [...currentSources, { appId }],
        },
      );

      actionLogger.debug(
        { appId, scopes: uniqueScopes },
        "Calendar source app set",
      );
    }
  }

  if (
    uniqueScopes.some((scope) =>
      meetingUrlProviderScopes.includes(scope as MeetingUrlProviderScope),
    )
  ) {
    actionLogger.debug(
      { appId, scopes: uniqueScopes },
      "Setting meeting URL provider app",
    );
    await servicesContainer.teamService.updateMemberProfile(
      session.user.memberId,
      { meetingUrlProviderAppId: appId },
    );
    actionLogger.debug(
      { appId, scopes: uniqueScopes },
      "Meeting URL provider app set",
    );
  }

  if (
    uniqueScopes.some((scope) =>
      bookingProviderScopes.includes(scope as BookingProviderScope),
    )
  ) {
    actionLogger.debug(
      { appId, scopes: uniqueScopes },
      "Setting booking provider app",
    );
    const currentBooking =
      await servicesContainer.configurationService.getConfiguration("booking");
    const nextBooking: BookingConfiguration = {
      ...(currentBooking as BookingConfiguration),
    };
    let hasBookingChanges = false;

    if (uniqueScopes.includes("schedule")) {
      nextBooking.scheduleAppId = appId;
      hasBookingChanges = true;
    }
    if (uniqueScopes.includes("availability-provider")) {
      nextBooking.availabilityProviderAppId = appId;
      hasBookingChanges = true;
    }

    if (hasBookingChanges) {
      actionLogger.debug(
        { appId, scopes: uniqueScopes },
        "Setting booking provider app",
      );
      await servicesContainer.configurationService.setConfiguration(
        "booking",
        nextBooking,
        actor,
      );
    } else {
      actionLogger.debug(
        { appId, scopes: uniqueScopes },
        "No booking provider app changes",
      );
    }
  }

  const defaultScopes = uniqueScopes.filter((scope) =>
    defaultAppScopes.includes(scope as DefaultAppScope),
  ) as DefaultAppScope[];

  if (defaultScopes.length) {
    actionLogger.debug(
      { appId, scopes: uniqueScopes },
      "Setting default app by scope",
    );
    const currentDefaultApps =
      await servicesContainer.configurationService.getConfiguration(
        "defaultApps",
      );

    const nextDefaultApps: DefaultAppsConfiguration = {
      ...(currentDefaultApps ?? {}),
    };

    for (const scope of defaultScopes) {
      const field = DEFAULT_SCOPE_TO_CONFIG_FIELD[scope];
      if (!field) continue;
      nextDefaultApps[field] = appId;
    }

    await servicesContainer.configurationService.setConfiguration(
      "defaultApps",
      nextDefaultApps,
      actor,
    );

    actionLogger.debug({ appId, scopes: uniqueScopes }, "Default app set");
  }

  actionLogger.debug(
    { appId, scopes: uniqueScopes },
    "App install targets applied",
  );
  return { success: true };
};
