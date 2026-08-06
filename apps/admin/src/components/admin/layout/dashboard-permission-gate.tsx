import { getSession } from "@/app/utils";
import { resolveRequiredPermissionForPath } from "@/lib/auth/resolve-nav-permission";
import { meetsRequiredPermission } from "@hacado/utils";
import { headers } from "next/headers";
import { forbidden } from "next/navigation";

/**
 * Must run as a child of the dashboard layout (not in the layout body).
 * `forbidden()` thrown from a layout is caught by the parent segment, which
 * leaves the 403 UI stuck across soft navigations.
 */
export async function DashboardPermissionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const pathname = (await headers()).get("x-pathname") || "";
  const requiredPermission = resolveRequiredPermissionForPath(pathname);

  if (!meetsRequiredPermission(session.user, requiredPermission)) {
    forbidden();
  }

  return children;
}
