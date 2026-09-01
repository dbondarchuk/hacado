"use client";

import { createContext, useContext } from "react";

export type MediaSourcesConfig = {
  unsplash: boolean;
  pexels: boolean;
};

const defaultMediaSources: MediaSourcesConfig = {
  unsplash: false,
  pexels: false,
};

const MediaSourcesContext =
  createContext<MediaSourcesConfig>(defaultMediaSources);

export const MediaSourcesProvider = ({
  children,
  value,
}: {
  children: React.ReactNode;
  value: MediaSourcesConfig;
}) => {
  return (
    <MediaSourcesContext.Provider value={value}>
      {children}
    </MediaSourcesContext.Provider>
  );
};

export const useMediaSources = () => useContext(MediaSourcesContext);
