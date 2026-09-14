"use client";

import { createContext, useContext, useMemo, useRef } from "react";

type Overlay = {
  id: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

type ReaderPopupContextType = {
  openPopup: (popupId: string) => void;
  closePopup: (popupId: string) => void;
  isPopupOpen: (popupId: string) => boolean;
  registerPopup: (popup: Overlay) => void;
  unregisterPopup: (popupId: string) => void;
};

type ReaderBannerContextType = {
  openBanner: (bannerId: string) => void;
  closeBanner: (bannerId: string) => void;
  isBannerOpen: (bannerId: string) => boolean;
  registerBanner: (banner: Overlay) => void;
  unregisterBanner: (bannerId: string) => void;
};

type ReaderContextType = {
  popup: ReaderPopupContextType;
  banner: ReaderBannerContextType;
};

export const ReaderContext = createContext<ReaderContextType>({
  popup: {
    openPopup: () => {},
    closePopup: () => {},
    isPopupOpen: () => false,
    registerPopup: () => {},
    unregisterPopup: () => {},
  },
  banner: {
    openBanner: () => {},
    closeBanner: () => {},
    isBannerOpen: () => false,
    registerBanner: () => {},
    unregisterBanner: () => {},
  },
});

export const useReaderContext = () => {
  const context = useContext(ReaderContext);
  if (!context) {
    return null;
  }

  return context;
};

export const useReaderPopupContext = () => {
  const context = useContext(ReaderContext);
  if (!context) {
    return null;
  }
  return context.popup;
};

export const useReaderBannerContext = () => {
  const context = useContext(ReaderContext);
  if (!context) {
    return null;
  }
  return context.banner;
};

const usePopupContext = () => {
  const popups = useRef<Map<string, Overlay>>(new Map());

  const openPopup = (popupId: string) => {
    const popup = popups.current.get(popupId);
    if (popup) {
      popup.setIsOpen(true);
    }
  };

  const closePopup = (popupId: string) => {
    const popup = popups.current.get(popupId);
    if (popup) {
      popup.setIsOpen(false);
    }
  };

  const isPopupOpen = (popupId: string) =>
    popups.current.get(popupId)?.isOpen ?? false;

  const registerPopup = (popup: Overlay) => {
    popups.current.set(popup.id, popup);
  };

  const unregisterPopup = (popupId: string) => {
    popups.current.delete(popupId);
  };

  const popup = useMemo(
    () => ({
      openPopup,
      closePopup,
      isPopupOpen,
      registerPopup,
      unregisterPopup,
    }),
    [popups],
  );

  return popup;
};

const useBannerContext = () => {
  const banners = useRef<Map<string, Overlay>>(new Map());

  const openBanner = (bannerId: string) => {
    const banner = banners.current.get(bannerId);
    if (banner) {
      banner.setIsOpen(true);
    }
  };

  const closeBanner = (bannerId: string) => {
    const banner = banners.current.get(bannerId);
    if (banner) {
      banner.setIsOpen(false);
    }
  };

  const isBannerOpen = (bannerId: string) =>
    banners.current.get(bannerId)?.isOpen ?? false;

  const registerBanner = (banner: Overlay) => {
    banners.current.set(banner.id, banner);
  };

  const unregisterBanner = (bannerId: string) => {
    banners.current.delete(bannerId);
  };

  const banner = useMemo(
    () => ({
      openBanner,
      closeBanner,
      isBannerOpen,
      registerBanner,
      unregisterBanner,
    }),
    [banners],
  );

  return banner;
};

export const ReaderProvider = ({ children }: { children: React.ReactNode }) => {
  const popup = usePopupContext();
  const banner = useBannerContext();

  return (
    <ReaderContext.Provider value={{ popup, banner }}>
      {children}
    </ReaderContext.Provider>
  );
};
