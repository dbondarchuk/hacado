"use client";

import { useI18n } from "@hacado/i18n/client";
import { cn, ComboboxAsync, IComboboxItem, Skeleton } from "@hacado/ui";
import { Archive } from "lucide-react";
import React from "react";
import { getDesigns } from "../../actions";
import { DesignListModel } from "../../models";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";

const DesignLoader: React.FC = () => (
  <Skeleton className="min-w-32 max-w-64 w-full h-5 pl-6" />
);

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

export type DesignSelectorProps = {
  appId: string;
  value: string;
  onItemSelect: (value: string) => void;
  allowClear?: false;
  disabled?: boolean;
  className?: string;
  includeArchived?: boolean;
};

export const DesignSelector: React.FC<DesignSelectorProps> = ({
  appId,
  value,
  onItemSelect,
  disabled,
  className,
  includeArchived = false,
}) => {
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

  const fetchDesigns = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 15;
      const offset = (page - 1) * limit;
      const result = await getDesigns(appId, {
        limit,
        offset,
        search: search?.trim() || undefined,
        priorityIds: value ? [value] : undefined,
        isArchived: includeArchived ? [true, false] : [false],
      });

      const items: IComboboxItem[] = (result.items ?? []).map(
        (d: DesignListModel) => ({
          value: d._id,
          label: <DesignLabel design={d} />,
          shortLabel: <DesignLabel design={d} />,
        }),
      );

      const total = result.total ?? 0;
      const hasMore = offset + items.length < total;

      return { items, hasMore };
    },
    [appId, value, includeArchived],
  );

  return (
    <ComboboxAsync
      value={value}
      onChange={(value) => onItemSelect(value ?? "")}
      disabled={disabled}
      className={cn("flex font-normal text-base max-w-full min-w-0", className)}
      placeholder={t("purchases.manualForm.designPlaceholder")}
      fetchItems={fetchDesigns}
      loader={<DesignLoader />}
      allowClear={false}
    />
  );
};
