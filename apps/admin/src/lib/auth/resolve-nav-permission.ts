import { navItems } from "@/constants/data";
import type { RequiredPermission } from "@timelish/types";

type NavNode = {
  href?: string;
  requiredPermission?: RequiredPermission;
  items?: NavNode[];
  children?: NavNode[];
};

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

  let best: { href: string; requiredPermission: RequiredPermission } | undefined;
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
