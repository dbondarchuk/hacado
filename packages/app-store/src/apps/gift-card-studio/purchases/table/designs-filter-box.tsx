"use client";

import { useI18n } from "@hacado/i18n/client";
import { Skeleton } from "@hacado/ui";
import { DataTableAsyncFilterBox } from "@hacado/ui-admin";
import { Archive } from "lucide-react";
import React, { useCallback } from "react";
import { getDesigns } from "../../actions";
import { DesignListModel } from "../../models/design";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";

const DesignLabel: React.FC<{ design: DesignListModel }> = ({ design }) => {
  return (
    <div className="flex flex-row items-center gap-2 overflow-hidden text-nowrap w-full py-1">
      {!!design.isArchived && (
        <Archive className="size-3.5 shrink-0 text-muted-foreground" />
      )}{" "}
      {design.name}
    </div>
  );
};

const DesignLoader: React.FC<{}> = ({}) => {
  return (
    <div className="flex flex-row items-center gap-2 overflow-hidden text-nowrap w-full py-1 pl-6">
      <Skeleton className="w-40 h-5" />
    </div>
  );
};

export const DesignsDataTableAsyncFilterBox: React.FC<{
  appId: string;
  filterKey: string;
  filterValue: string[];
  setFilterValue: (v: string[] | null) => void;
}> = ({ appId, filterKey, filterValue, setFilterValue }) => {
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );
  const fetchItems = useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const res = await getDesigns(appId, {
        limit,
        offset: (page - 1) * limit,
        isArchived: [true, false],
        search,
      });
      return {
        items: (res.items ?? []).map((d) => ({
          value: d._id,
          label: <DesignLabel design={d} />,
          shortLabel: <DesignLabel design={d} />,
        })),
        hasMore: res.total > page * limit,
      };
    },
    [appId],
  );

  return (
    <DataTableAsyncFilterBox
      filterKey={filterKey}
      title={t("purchases.table.filters.design")}
      fetchItems={fetchItems}
      setFilterValue={async (v) => {
        const next = typeof v === "function" ? v(filterValue) : v;
        setFilterValue(next);
        return new URLSearchParams();
      }}
      filterValue={filterValue}
      loader={<DesignLoader />}
    />
  );
};
