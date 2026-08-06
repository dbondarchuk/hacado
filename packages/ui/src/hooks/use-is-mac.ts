"use client";
import { useMemo } from "react";

export const useIsMac = () => {
  return useMemo(
    () => navigator?.userAgent?.toLocaleLowerCase().includes("mac") ?? false,
    [navigator?.userAgent],
  );
};
