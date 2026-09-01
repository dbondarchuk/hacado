"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

interface PortalContextType {
  document: Document;
  body: HTMLElement;
  setDocument: (document: Document) => void;
  viewportHintHost: HTMLElement | null;
  setViewportHintHost: (host: HTMLElement | null) => void;
}

const PortalContext = createContext<PortalContextType>({
  document: typeof document !== "undefined" ? document : ({} as Document),
  body: typeof document !== "undefined" ? document.body : ({} as HTMLElement),
  setDocument: () => {},
  viewportHintHost: null,
  setViewportHintHost: () => {},
});

export const usePortalContext = () =>
  useContext(PortalContext) ?? {
    document: typeof document !== "undefined" ? document : ({} as Document),
    body: typeof document !== "undefined" ? document.body : ({} as HTMLElement),
    setDocument: () => {},
    viewportHintHost: null,
    setViewportHintHost: () => {},
  };

interface PortalProviderProps {
  children: React.ReactNode;
}

export const PortalProvider: React.FC<PortalProviderProps> = ({ children }) => {
  const [stateDocument, setDocument] = useState<Document>(
    typeof document !== "undefined" ? document : ({} as Document),
  );
  const [viewportHintHost, setViewportHintHost] = useState<HTMLElement | null>(
    null,
  );

  const value: PortalContextType = useMemo(
    () => ({
      document: stateDocument,
      body: stateDocument.body || ({} as HTMLElement),
      setDocument,
      viewportHintHost,
      setViewportHintHost,
    }),
    [stateDocument, viewportHintHost],
  );

  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
  );
};
