"use client";

import { createContext, useContext } from "react";

const LinkShorteningEnabledContext = createContext(false);

export const LinkShorteningEnabledProvider = ({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) => {
  return (
    <LinkShorteningEnabledContext.Provider value={enabled}>
      {children}
    </LinkShorteningEnabledContext.Provider>
  );
};

export const useLinkShorteningEnabled = () => {
  return useContext(LinkShorteningEnabledContext);
};
