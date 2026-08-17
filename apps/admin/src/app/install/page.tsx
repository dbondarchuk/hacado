import { InstallWizard } from "@/components/install/install-wizard";
import { organizationHasInstallBillingAccess } from "@/lib/billing/install-billing-access";
import { getI18nAsync } from "@hacado/i18n/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getInstallCalendarAppsSnapshot,
  getInstallPaymentAppsSnapshot,
  getInstallPreferencesSnapshot,
  getInstallScheduleSnapshot,
  getInstallServicesSnapshot,
  getInstallWorkspaceSnapshot,
} from "../../components/install/actions";
import { getSession } from "../utils";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getI18nAsync("install");
  return {
    title: t("page.title"),
    description: t("page.description"),
  };
};

export default async function InstallPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout_id?: string }>;
}) {
  const session = await getSession();
  const publicDomain = process.env.PUBLIC_DOMAIN ?? "hacado.me";
  const sp = await searchParams;

  if (session.user.organizationId && session.user.organizationInstalled) {
    redirect("/dashboard");
  }

  const emailVerified = Boolean(
    (session.user as { emailVerified?: boolean }).emailVerified,
  );

  const organizationId = (session.user as { organizationId?: string })
    .organizationId;

  const billingOk = await organizationHasInstallBillingAccess(organizationId, {
    reconcileWithPolar: Boolean(sp.checkout_id),
  });
  if (!billingOk) {
    redirect("/checkout");
  }

  const [
    workspaceFromServer,
    servicesFromServer,
    calendarAppsFromServer,
    paymentAppsFromServer,
    preferencesFromServer,
    scheduleFromServer,
  ] = await Promise.all([
    getInstallWorkspaceSnapshot(),
    getInstallServicesSnapshot(),
    getInstallCalendarAppsSnapshot(),
    getInstallPaymentAppsSnapshot(),
    getInstallPreferencesSnapshot(),
    getInstallScheduleSnapshot(),
  ]);

  return (
    <InstallWizard
      email={session.user.email}
      emailVerified={emailVerified}
      publicDomain={publicDomain}
      workspaceFromServer={workspaceFromServer}
      servicesFromServer={servicesFromServer}
      calendarAppsFromServer={calendarAppsFromServer}
      paymentAppsFromServer={paymentAppsFromServer}
      preferencesFromServer={preferencesFromServer}
      scheduleFromServer={scheduleFromServer}
    />
  );
}
