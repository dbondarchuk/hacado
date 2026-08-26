export type AccordionOpenChild = {
  id: string;
  data?: { props?: { isOpen?: boolean | null } };
};

export function getInitialOpenItemIds(
  children: AccordionOpenChild[],
  allowMultipleOpen?: boolean | null,
  defaultOpenFirst?: boolean | null,
): string[] {
  const ids: string[] = [];
  for (const child of children) {
    if (child.data?.props?.isOpen && child.id) {
      ids.push(child.id);
    }
  }
  const firstId = children[0]?.id;
  if (defaultOpenFirst && firstId && !ids.includes(firstId)) {
    ids.unshift(firstId);
  }
  if (!allowMultipleOpen) {
    return ids.slice(0, 1);
  }
  return ids;
}

export function toggleOpenItemIds(
  current: string[],
  id: string,
  allowMultipleOpen?: boolean | null,
): string[] {
  const isOpen = current.includes(id);
  if (allowMultipleOpen) {
    return isOpen
      ? current.filter((openId) => openId !== id)
      : [...current, id];
  }
  return isOpen ? [] : [id];
}
