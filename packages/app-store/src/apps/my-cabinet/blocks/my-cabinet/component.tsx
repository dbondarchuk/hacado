"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  BlockStyle,
  ReplaceOriginalColors,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import {
  Skeleton,
  cn,
  toast,
  useTimeZone,
  useUseClientTimezone,
} from "@hacado/ui";
import { DateTime as LuxonDateTime } from "luxon";
import { useEffect, useState } from "react";
import {
  MyCabinetPublicKeys,
  MyCabinetPublicNamespace,
  myCabinetPublicNamespace,
} from "../../translations/types";
import { checkSessionAction } from "./actions";
import { CustomerProfileContext } from "./customer-profile-context";
import { MyCabinetBlockReaderProps, styles } from "./schema";
import { AppointmentsScreen } from "./screens/appointments-screen";
import { AuthScreen } from "./screens/auth-screen";
import { BookScreen } from "./screens/book-screen";
import { ModifyScreen } from "./screens/modify-screen";
import { SessionExpiredContext } from "./session-expired-context";
import { CustomerProfile, HashState } from "./types";

const parseHash = (hash: string): HashState => {
  if (!hash) return { screen: "list" };
  const normalized = hash.replace(/^#/, "");
  const [action, appointmentId] = normalized.split(":");
  if (action === "book") {
    return {
      screen: "book",
      customerPackageId: appointmentId?.trim() || undefined,
    };
  }
  if (
    (action === "cancel" || action === "reschedule") &&
    appointmentId &&
    appointmentId.trim()
  ) {
    return {
      screen: "modify",
      action,
      appointmentId: appointmentId.trim(),
    };
  }
  return { screen: "list" };
};

export const MyCabinetBlockComponent = ({
  appId,
  waitlistAppId,
  style,
  blockBase,
  isEditor,
  showTitle = true,
  scrollToTop = true,
}: {
  appId?: string;
  waitlistAppId?: string;
  style: MyCabinetBlockReaderProps["style"];
  blockBase?: { className?: string; id?: string };
  isEditor?: boolean;
  showTitle?: boolean | null;
  scrollToTop?: boolean | null;
}) => {
  const t = useI18n<MyCabinetPublicNamespace, MyCabinetPublicKeys>(
    myCabinetPublicNamespace,
  );

  const className = generateClassName();
  const configTimeZone = useTimeZone();
  const useClientTimezone = useUseClientTimezone();

  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerProfile, setCustomerProfile] =
    useState<CustomerProfile | null>(null);
  const [timezone, setTimeZone] = useState<string>(
    useClientTimezone
      ? (LuxonDateTime.now().zoneName ?? configTimeZone)
      : configTimeZone,
  );
  const [hashState, setHashState] = useState<HashState>({ screen: "list" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHashChange = () => setHashState(parseHash(window.location.hash));
    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!appId) return;
    let mounted = true;
    checkSessionAction()
      .then((res) => {
        if (!mounted) return;
        setIsAuthenticated(true);
        setCustomerProfile({
          name: res.name,
          email: res.email,
          phone: res.phone,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsSessionChecked(true);
      });
    return () => {
      mounted = false;
    };
  }, [appId]);

  const handleAuthenticated = (profile: CustomerProfile) => {
    setCustomerProfile(profile);
    setIsAuthenticated(true);
  };

  const handleSessionExpired = () => {
    setIsAuthenticated(false);
    setCustomerProfile(null);
    window.location.hash = "";
    toast.error(t("errors.sessionExpired"));
  };

  const wrapper = (children: React.ReactNode) => (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style ?? {}}
      />
      {isEditor && <ReplaceOriginalColors />}
      <div
        className={cn(
          className,
          blockBase?.className,
          "space-y-4 my-cabinet-container",
        )}
        id={blockBase?.id}
      >
        {children}
      </div>
    </>
  );

  if (!appId) {
    return wrapper(
      <div>
        <h2 className="text-lg font-bold text-foreground">
          {t("errors.appNotConfigured.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("errors.appNotConfigured.description")}
        </p>
      </div>,
    );
  }

  return wrapper(
    <>
      {showTitle !== false && (
        <div className="text-center mb-6 title-container">
          <h1 className="text-xl font-semibold text-foreground mb-2 title-text">
            {t("block.title")}
          </h1>
        </div>
      )}
      {!isSessionChecked ? (
        <div className="max-w-lg mx-auto flex flex-col gap-4 items-center justify-center auth-screen-container">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <SessionExpiredContext.Provider value={handleSessionExpired}>
          <CustomerProfileContext.Provider
            value={{ customer: customerProfile, timezone, setTimeZone }}
          >
            {!isAuthenticated ? (
              <AuthScreen appId={appId} onAuthenticated={handleAuthenticated} />
            ) : hashState.screen === "list" ? (
              <AppointmentsScreen appId={appId} waitlistAppId={waitlistAppId} />
            ) : hashState.screen === "book" ? (
              <BookScreen
                waitlistAppId={waitlistAppId}
                lockCustomerPackageId={hashState.customerPackageId}
                scrollToTop={scrollToTop ?? true}
                isEditor={isEditor}
              />
            ) : (
              <ModifyScreen
                appId={appId}
                appointmentId={hashState.appointmentId}
                action={hashState.action}
                scrollToTop={scrollToTop ?? true}
                isEditor={isEditor}
              />
            )}
          </CustomerProfileContext.Provider>
        </SessionExpiredContext.Provider>
      )}
    </>,
  );
};
