"use client";

import { Language } from "@hacado/i18n";
import { PageHeader } from "@hacado/types";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";

export type PageContextType = {
  header?: PageHeader | null;
  footer?: boolean;
  path?: string;
  params?: Record<string, string | string[] | undefined> | null;
  searchParams?: Record<string, string | string[] | undefined> | null;
  locale?: Language | null;
};

export const PageContext = createContext<PageContextType>({
  header: undefined,
  footer: undefined,
  path: undefined,
  params: undefined,
  searchParams: undefined,
  locale: undefined,
});

export const PageProvider = ({
  children,
  ...rest
}: PropsWithChildren<PageContextType>) => {
  const { header, footer, path, params, searchParams, locale } = rest;
  const value = useMemo(
    () => ({ header, footer, path, params, searchParams, locale }),
    [header, footer, path, params, searchParams, locale],
  );

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = () => {
  return useContext(PageContext);
};

export const useIsPageHeaderScrollable = () => {
  const { header } = usePageContext();
  return (
    !!header?.sticky ||
    header?.position === "sticky" ||
    header?.position === "fixed"
  );
};
