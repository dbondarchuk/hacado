"use client";

import { createContext, useContext, useEffect } from "react";
import { useReaderContext } from "./readerContext";

type BannerContextType = {
  id: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const BannerContext = createContext<BannerContextType>({
  isOpen: false,
  id: "",
  setIsOpen: () => {},
});

export const useCurrentBanner = () => {
  const context = useContext(BannerContext);
  if (!context) {
    return null;
  }

  return context;
};

export const BannerProvider = ({
  children,
  id,
  isOpen,
  setIsOpen,
}: BannerContextType & {
  children: React.ReactNode;
}) => {
  const readerContext = useReaderContext();
  useEffect(() => {
    const banner = { id, isOpen, setIsOpen };
    if (readerContext) {
      readerContext.banner.unregisterBanner(id);
      readerContext.banner.registerBanner(banner);
    }
  }, [id, isOpen, setIsOpen, readerContext]);

  return (
    <BannerContext.Provider value={{ id, isOpen, setIsOpen }}>
      {children}
    </BannerContext.Provider>
  );
};
