"use client";

import { useI18n } from "@hacado/i18n/client";
import { Link } from "@hacado/ui";
import { DataTableResetFilter, DataTableSearch } from "@hacado/ui-admin";
import { Plus, Receipt } from "lucide-react";
import { usePackagesTableFilters } from "./use-table-filters";

export function PackagesTableAction() {
  const t = useI18n("admin");
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
  } = usePackagesTableFilters();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/services/packages/sold"
          button
          variant="outline"
          aria-label={t("services.packages.sold.title")}
        >
          <Receipt className="h-4 w-4" />
          <span className="max-md:hidden">
            {t("services.packages.sold.title")}
          </span>
        </Link>
        <Link
          href="/dashboard/services/packages/new"
          button
          variant="default"
          aria-label={t("services.packages.addNew")}
        >
          <Plus className="h-4 w-4" />
          <span className="max-md:hidden">{t("services.packages.addNew")}</span>
        </Link>
      </div>
    </div>
  );
}
