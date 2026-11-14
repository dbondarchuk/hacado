"use client";

import { createContext, useContext, useMemo, useRef } from "react";

type Overlay = {
  id: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

type ReaderModalContextType = {
  open: (modalId: string) => void;
  close: (modalId: string) => void;
  isOpen: (modalId: string) => boolean;
  register: (modal: Overlay) => void;
  unregister: (modalId: string) => void;
};

type ReaderContextType = {
  modal: ReaderModalContextType;
};

export const ReaderContext = createContext<ReaderContextType>({
  modal: {
    open: () => {},
    close: () => {},
    isOpen: () => false,
    register: () => {},
    unregister: () => {},
  },
});

export const useReaderContext = () => {
  const context = useContext(ReaderContext);
  if (!context) {
    return null;
  }

  return context;
};

export const useReaderModalContext = () => {
  const context = useContext(ReaderContext);
  if (!context) {
    return null;
  }

  return context.modal;
};

const useModalRegistry = () => {
  const modals = useRef<Map<string, Overlay>>(new Map());

  const open = (modalId: string) => {
    const modal = modals.current.get(modalId);
    if (modal) {
      modal.setIsOpen(true);
    }
  };

  const close = (modalId: string) => {
    const modal = modals.current.get(modalId);
    if (modal) {
      modal.setIsOpen(false);
    }
  };

  const isOpen = (modalId: string) =>
    modals.current.get(modalId)?.isOpen ?? false;

  const register = (modal: Overlay) => {
    modals.current.set(modal.id, modal);
  };

  const unregister = (modalId: string) => {
    modals.current.delete(modalId);
  };

  return useMemo(
    () => ({
      open,
      close,
      isOpen,
      register,
      unregister,
    }),
    [modals],
  );
};

export const ReaderProvider = ({ children }: { children: React.ReactNode }) => {
  const modal = useModalRegistry();

  return (
    <ReaderContext.Provider value={{ modal }}>
      {children}
    </ReaderContext.Provider>
  );
};
