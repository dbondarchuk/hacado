"use client";

import { createContext, useContext, useEffect } from "react";
import { useReaderContext } from "./readerContext";

type ModalContextType = {
  id: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const ModalContext = createContext<ModalContextType | null>(null);

export const useCurrentModal = () => {
  return useContext(ModalContext);
};

export const ModalProvider = ({
  children,
  id,
  isOpen,
  setIsOpen,
}: ModalContextType & {
  children: React.ReactNode;
}) => {
  const readerContext = useReaderContext();

  useEffect(() => {
    if (!readerContext) return;

    readerContext.modal.register({ id, isOpen, setIsOpen });

    return () => {
      readerContext.modal.unregister(id);
    };
  }, [id, isOpen, setIsOpen, readerContext]);

  return (
    <ModalContext.Provider value={{ id, isOpen, setIsOpen }}>
      {children}
    </ModalContext.Provider>
  );
};
