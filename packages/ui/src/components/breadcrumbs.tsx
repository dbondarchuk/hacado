"use client";

import React from "react";

export type BreadcrumbItemProp = {
  title: string;
  /** Shown instead of `title` on small viewports (e.g. last crumb only). */
  mobileTitle?: string;
  link: string;
};

export type BreadcrumbItemProps =
  | BreadcrumbItemProp
  | {
      subItems: BreadcrumbItemProp[];
      title: string;
    };

export type BreadcrumbsContextProps = {
  breadcrumbs?: BreadcrumbItemProps[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItemProps[] | undefined) => void;
};

export const BreadcrumbsContext = React.createContext<BreadcrumbsContextProps>({
  setBreadcrumbs: () => {},
});

export const BreadcrumbsProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [breadcrumbs, setBreadcrumbs] = React.useState<
    BreadcrumbItemProps[] | undefined
  >();

  return (
    <BreadcrumbsContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
      {children}
    </BreadcrumbsContext.Provider>
  );
};

export const Breadcrumbs: React.FC<{ items: BreadcrumbItemProps[] }> = ({
  items,
}) => {
  const { setBreadcrumbs } = React.useContext(BreadcrumbsContext);
  React.useEffect(() => {
    setBreadcrumbs(items);
  }, [items, setBreadcrumbs]);

  return null;
};
