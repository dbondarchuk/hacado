"use client";

import { useI18n } from "@timelish/i18n/client";
import { ComboboxAsync, IComboboxItem, Skeleton } from "@timelish/ui";
import { Lock } from "lucide-react";
import React from "react";
import { getForms } from "../actions";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../translations/types";

const FormSelectorLoader: React.FC = () => (
  <div className="flex flex-row items-center gap-2 py-2 px-2 w-full">
    <Skeleton className="h-5 w-40" />
  </div>
);

export const FormSelector: React.FC<{
  appId: string;
  value?: string;
  onItemSelect: (value: string | undefined) => void;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
  /** When false (default), only public (non-archived) forms are shown. */
  includeArchived?: boolean;
}> = ({
  appId,
  value,
  onItemSelect,
  allowClear,
  disabled,
  className,
  includeArchived = false,
}) => {
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);

  const getFormsCallback = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await getForms(appId, {
        limit,
        offset: (page - 1) * limit,
        search: search || undefined,
        priorityIds: value ? [value] : undefined,
        isArchived: includeArchived ? undefined : [false],
      });

      return {
        items: (result.items ?? []).map((form) => {
          const archived = form.isArchived ?? false;
          return {
            label: archived ? (
              <span className="flex items-center gap-1.5">
                <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                {form.name}
              </span>
            ) : (
              form.name
            ),
            shortLabel: archived ? (
              <span className="flex items-center gap-1.5">
                <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                {form.name}
              </span>
            ) : (
              form.name
            ),
            value: form._id,
          };
        }) satisfies IComboboxItem[],
        hasMore:
          (result.items?.length ?? 0) + (page - 1) * limit < result.total,
      };
    },
    [appId, value, includeArchived],
  );

  return (
    <ComboboxAsync
      onChange={onItemSelect}
      disabled={disabled}
      className={className}
      placeholder={t("responses.new.selectPlaceholder")}
      value={value}
      allowClear={allowClear}
      fetchItems={getFormsCallback}
      loader={<FormSelectorLoader />}
    />
  );
};
