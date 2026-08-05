"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  AsyncFilterBoxOption,
  AsyncFilterBoxProps,
  DataTableAsyncFilterBox,
} from "@hacado/ui-admin";
import { Lock } from "lucide-react";
import React from "react";
import { getForms } from "../../actions";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";

export const FormsDataTableAsyncFilterBox: React.FC<
  Omit<AsyncFilterBoxProps, "fetchItems" | "title" | "filterKey"> & {
    appId: string;
    title?: AsyncFilterBoxProps["title"];
    filterKey?: AsyncFilterBoxProps["filterKey"];
  }
> = ({ appId, title: propsTitle, filterKey = "formId", ...rest }) => {
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  const title = propsTitle ?? t("responses.table.filters.form");

  const fetchItems = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await getForms(appId, {
        limit,
        offset: (page - 1) * limit,
        search: search || undefined,
        priorityIds: rest.filterValue ?? undefined,
        isArchived: [false, true],
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
        }) satisfies AsyncFilterBoxOption[],
        hasMore:
          (result.items?.length ?? 0) + (page - 1) * limit < result.total,
      };
    },
    [appId, rest.filterValue],
  );

  return (
    <DataTableAsyncFilterBox
      title={title}
      filterKey={filterKey}
      fetchItems={fetchItems}
      {...rest}
    />
  );
};
