import { useCallback, useEffect, useRef, useState } from "react";

/** Tracks which sortable item ids are collapsed. New items start collapsed when `defaultCollapsed` is true. */
export function useCollapsedSortableItems(
  ids: string[],
  defaultCollapsed = true,
) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() =>
    defaultCollapsed ? new Set(ids) : new Set(),
  );
  const knownIdsRef = useRef<Set<string>>(new Set(ids));

  useEffect(() => {
    const known = knownIdsRef.current;
    const nextKnown = new Set(ids);
    const added: string[] = [];
    for (const id of ids) {
      if (!known.has(id)) added.push(id);
    }
    knownIdsRef.current = nextKnown;

    setCollapsedIds((prev) => {
      const next = new Set<string>();
      for (const id of ids) {
        if (prev.has(id)) next.add(id);
      }
      if (defaultCollapsed) {
        for (const id of added) next.add(id);
      }
      return next;
    });
  }, [ids, defaultCollapsed]);

  const allCollapsed =
    ids.length === 0 || ids.every((id) => collapsedIds.has(id));

  const toggleAll = useCallback(() => {
    setCollapsedIds(allCollapsed ? new Set() : new Set(ids));
  }, [allCollapsed, ids]);

  const toggleOne = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isCollapsed = useCallback(
    (id: string) => collapsedIds.has(id),
    [collapsedIds],
  );

  return { allCollapsed, toggleAll, toggleOne, isCollapsed };
}
