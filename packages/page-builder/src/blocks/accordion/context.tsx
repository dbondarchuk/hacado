"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toggleOpenItemIds } from "./open-state";
import { AccordionProps } from "./schema";

export type AccordionContextValue = {
  isItemOpen: (id: string) => boolean;
  onToggleItem: (id: string) => void;
  animation?: AccordionProps["props"]["animation"];
  iconPosition?: AccordionProps["props"]["iconPosition"];
  iconStyle?: AccordionProps["props"]["iconStyle"];
};

export const AccordionContext = createContext<AccordionContextValue | null>(
  null,
);

export function useAccordion() {
  return useContext(AccordionContext);
}

export function AccordionProvider({
  children,
  allowMultipleOpen,
  initialOpenItemIds,
  animation,
  iconPosition,
  iconStyle,
}: {
  children: ReactNode;
  allowMultipleOpen?: boolean | null;
  initialOpenItemIds: string[];
  animation?: AccordionProps["props"]["animation"];
  iconPosition?: AccordionProps["props"]["iconPosition"];
  iconStyle?: AccordionProps["props"]["iconStyle"];
}) {
  const [openItemIds, setOpenItemIds] = useState(initialOpenItemIds);
  const didInit = useRef(initialOpenItemIds.length > 0);

  useEffect(() => {
    if (didInit.current || initialOpenItemIds.length === 0) return;
    didInit.current = true;
    setOpenItemIds(initialOpenItemIds);
  }, [initialOpenItemIds]);

  useEffect(() => {
    if (allowMultipleOpen || openItemIds.length <= 1) return;
    setOpenItemIds((current) => current.slice(0, 1));
  }, [allowMultipleOpen, openItemIds.length]);

  const onToggleItem = useCallback(
    (id: string) => {
      setOpenItemIds((current) =>
        toggleOpenItemIds(current, id, allowMultipleOpen),
      );
    },
    [allowMultipleOpen],
  );

  const value = useMemo(
    () => ({
      isItemOpen: (id: string) => openItemIds.includes(id),
      onToggleItem,
      animation,
      iconPosition,
      iconStyle,
    }),
    [animation, iconPosition, iconStyle, onToggleItem, openItemIds],
  );

  return (
    <AccordionContext.Provider value={value}>
      {children}
    </AccordionContext.Provider>
  );
}
