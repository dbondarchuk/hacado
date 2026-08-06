import type { AdminKeys } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import { Link } from "@hacado/ui";
import { Plus } from "lucide-react";
import { DateTime } from "luxon";
import { getSession } from "../utils";

function greetingKey(hour: number): AdminKeys {
  if (hour < 12) return "dashboard.greeting.morning";
  if (hour < 17) return "dashboard.greeting.afternoon";
  return "dashboard.greeting.evening";
}

export async function DashboardGreeting({ subtitle }: { subtitle: string }) {
  const session = await getSession();
  const t = await getI18nAsync("admin");
  const firstName =
    session?.user?.name?.trim().split(/\s+/)[0] ||
    t("dashboard.greeting.fallbackName");
  const key = greetingKey(DateTime.now().hour);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight text-foreground">
          {t(key, { name: firstName })}
        </h1>
        <p className="text-base text-muted-foreground max-w-xl">{subtitle}</p>
      </div>
      <Link
        href="/dashboard/appointments/new"
        button
        variant="default"
        className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 shadow-sm"
      >
        <Plus className="size-4" strokeWidth={1.75} />
        {t("dashboard.greeting.newAppointment")}
      </Link>
    </div>
  );
}
