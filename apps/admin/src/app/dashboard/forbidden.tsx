import { getI18nAsync } from "@hacado/i18n/server";
import { Link } from "@hacado/ui";

export default async function Forbidden() {
  const t = await getI18nAsync("admin");

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="mx-auto max-w-md rounded-lg border p-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">403</p>
        <h2 className="mt-2 text-2xl font-semibold">
          {t("dashboard.forbidden.title")}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {t("dashboard.forbidden.description")}
        </p>
        <div className="mt-6 flex justify-center">
          <Link button href="/dashboard" variant="default" hardNavigate>
            {t("dashboard.forbidden.backToDashboard")}
          </Link>
        </div>
      </div>
    </div>
  );
}
