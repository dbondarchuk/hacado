import { navItems } from "@/constants/data";
import type { RequiredPermission } from "@hacado/types";

type NavNode = {
  href?: string;
  requiredPermission?: RequiredPermission;
  items?: NavNode[];
  children?: NavNode[];
};

/** Pages that are not sidebar nav items but still need permission gates. */
const EXTRA_PATH_PERMISSIONS: {
  href: string;
  requiredPermission: RequiredPermission;
}[] = [
  {
    href: "/dashboard/activity",
    requiredPermission: { resource: "activity", action: "read" },
  },
];

function collectNavPermissions(
  items: readonly NavNode[],
  out: { href: string; requiredPermission: RequiredPermission }[],
) {
  for (const item of items) {
    if (item.children) {
      collectNavPermissions(item.children, out);
    }
    if (item.items) {
      collectNavPermissions(item.items, out);
    }
    if (item.href && item.requiredPermission) {
      out.push({
        href: item.href,
        requiredPermission: item.requiredPermission,
      });
    }
  }
}

/**
 * Longest nav `href` prefix match for the current pathname.
 * e.g. `/dashboard/services/options/new` → options item permission.
 */
export function resolveRequiredPermissionForPath(
  pathname: string,
): RequiredPermission | undefined {
  const path = pathname.split("?")[0]?.replace(/\/$/, "") || pathname;
  const entries: { href: string; requiredPermission: RequiredPermission }[] =
    [];
  collectNavPermissions(navItems, entries);
  entries.push(...EXTRA_PATH_PERMISSIONS);

  let best:
    | { href: string; requiredPermission: RequiredPermission }
    | undefined;
  for (const entry of entries) {
    const href = entry.href.replace(/\/$/, "");
    if (path === href || path.startsWith(`${href}/`)) {
      if (!best || href.length > best.href.length) {
        best = { ...entry, href };
      }
    }
  }
  return best?.requiredPermission;
}
