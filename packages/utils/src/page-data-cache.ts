import { Page } from "@hacado/types";
import { cache } from "react";

export type PageDataStore = {
  searchParams: Record<string, any | undefined | null>;
  routeParams: Record<string, any>;
  page: Page;
  params: Record<string, any>;
};

const getStore = cache(() => ({
  data: {
    params: {},
    searchParams: {},
    page: {},
    routeParams: {},
  } as PageDataStore,
}));

export const getPageData = () => getStore().data;

export const setPageData = (data: PageDataStore) => {
  getStore().data = data;
};
