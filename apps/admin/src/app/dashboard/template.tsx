import { DashboardPermissionGate } from "@/components/admin/layout/dashboard-permission-gate";

/**
 * Permission checks belong here (not in `layout.tsx`).
 * `forbidden()` thrown from a layout is caught by the parent segment and soft
 * navigations can leave the 403 UI stuck; template runs inside the dashboard
 * children boundary so `dashboard/forbidden.tsx` handles it correctly.
 */
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardPermissionGate>{children}</DashboardPermissionGate>;
}
