"use client";

import { soldPackagesSearchParams } from "@hacado/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function useSoldPackagesTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    soldPackagesSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );
  const [page, setPage] = useQueryState("page", soldPackagesSearchParams.page);
  const [customerIdFilter, setCustomerIdFilter] = useQueryState(
    "customerId",
    soldPackagesSearchParams.customerId.withOptions({ shallow: false }),
  );
  const [packageIdFilter, setPackageIdFilter] = useQueryState(
    "packageId",
    soldPackagesSearchParams.packageId.withOptions({ shallow: false }),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    soldPackagesSearchParams.status.withOptions({ shallow: false }),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setCustomerIdFilter(null);
    setPackageIdFilter(null);
    setStatusFilter(null);
    setPage(1);
  }, [
    setSearchQuery,
    setCustomerIdFilter,
    setPackageIdFilter,
    setStatusFilter,
    setPage,
  ]);

  const isAnyFilterActive = useMemo(
    () =>
      !!searchQuery ||
      (customerIdFilter?.length ?? 0) > 0 ||
      (packageIdFilter?.length ?? 0) > 0 ||
      (statusFilter?.length ?? 0) > 0,
    [searchQuery, customerIdFilter, packageIdFilter, statusFilter],
  );

  return {
    searchQuery,
    setSearchQuery,
    setPage,
    customerIdFilter: customerIdFilter ?? [],
    setCustomerIdFilter,
    packageIdFilter: packageIdFilter ?? [],
    setPackageIdFilter,
    statusFilter: statusFilter ?? [],
    setStatusFilter,
    resetFilters,
    isAnyFilterActive,
  };
}
