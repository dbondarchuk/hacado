import type {
  NavItemGroup,
  RequiredPermission,
  SessionUser,
} from "@hacado/types";
import { meetsRequiredPermission } from "@hacado/utils";

type NavItemWithPermission = {
  requiredPermission?: RequiredPermission;
  href?: string;
  items?: NavItemWithPermission[];
  children?: NavItemWithPermission[];
};

/**
 * Recursively drop nav items the user is not allowed to see.
 * If an item fails its own permission but has visible descendants, keep it as
 * a folder (href cleared) so nested allowed items remain reachable.
 */
export function filterNavItemsForPermission<T extends NavItemWithPermission>(
  items: T[],
  user: SessionUser | null | undefined,
): T[] {
  return items
    .map((item) => {
      const nextChildren = item.children
        ? filterNavItemsForPermission(item.children, user)
        : undefined;
      const nextItems = item.items
        ? filterNavItemsForPermission(item.items, user)
        : undefined;

      const selfAllowed = meetsRequiredPermission(
        user,
        item.requiredPermission,
      );
      const hasVisibleDescendants =
        (nextChildren !== undefined && nextChildren.length > 0) ||
        (nextItems !== undefined && nextItems.length > 0);

      if (!selfAllowed && !hasVisibleDescendants) {
        return null;
      }

      if (nextChildren !== undefined) {
        if (nextChildren.length === 0) {
          return null;
        }
        return {
          ...item,
          ...(selfAllowed ? {} : { href: undefined }),
          children: nextChildren,
        };
      }

      if (nextItems !== undefined) {
        if (nextItems.length === 0) {
          if (!selfAllowed || !item.href) {
            return null;
          }
          return { ...item, items: [] };
        }
        return {
          ...item,
          ...(selfAllowed ? {} : { href: undefined }),
          items: nextItems,
        };
      }

      return selfAllowed ? item : null;
    })
    .filter((item): item is T => item !== null);
}

export type { NavItemGroup };
