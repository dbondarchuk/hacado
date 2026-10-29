"use client";

import { useI18n } from "@hacado/i18n/client";

import {
  CustomersDataTableAsyncFilterBox,
  DataTableFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
  MembersDataTableAsyncFilterBox,
  OptionsDataTableAsyncFilterBox,
  useAuth,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import {
  HeaderActionButtonsPortal,
  ResponsiveFilterBar,
} from "@hacado/ui-admin-kit";
import { canFilterByMember, hasPermission } from "@hacado/utils";

import React from "react";
import { WaitlistStatus, waitlistStatus } from "../models";
import {
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
  waitlistAdminNamespace,
} from "../translations/types";
import { DismissSelectedWaitlistEntriesButton } from "./dismiss-selected";
import { NewEntryDialog } from "./new-entry";
import { SettingsDialog } from "./settings";
import { useWaitlistTableFilters } from "./use-table-filters";

export const WaitlistTableAction: React.FC<{
  appId: string;
  /** When set, customer filter is hidden and table is fixed to this customer (e.g. on customer tab). */
  customerIdLock?: string;
}> = ({ appId, customerIdLock }) => {
  const {
    statusFilter,
    setStatusFilter,
    customerFilter,
    setCustomerFilter,
    optionFilter,
    setOptionFilter,
    memberFilter,
    setMemberFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    start,
    setStartValue,
    end,
    setEndValue,
  } = useWaitlistTableFilters();
  const { rowSelection } = useSelectedRowsStore();
  const { user } = useAuth();
  const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
    waitlistAdminNamespace,
  );
  const tUi = useI18n("ui");

  const showMemberFilter = canFilterByMember(user);
  const canUpdateSettings = hasPermission(user, "settings", "update");

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="status"
        title={t("table.columns.status")}
        options={[...waitlistStatus, "expired"].map((status) => ({
          value: status,
          label: t(`statuses.${status as WaitlistStatus | "expired"}`),
        }))}
        setFilterValue={setStatusFilter as any}
        filterValue={statusFilter}
      />
      {!customerIdLock && (
        <CustomersDataTableAsyncFilterBox
          filterValue={customerFilter}
          setFilterValue={setCustomerFilter}
        />
      )}
      <OptionsDataTableAsyncFilterBox
        filterValue={optionFilter}
        setFilterValue={setOptionFilter}
      />
      {showMemberFilter ? (
        <MembersDataTableAsyncFilterBox
          title={t("table.columns.member")}
          filterValue={memberFilter || []}
          setFilterValue={setMemberFilter as any}
        />
      ) : null}
      <DataTableRangeBox
        startValue={start}
        endValue={end}
        setStartValue={setStartValue}
        setEndValue={setEndValue}
      />
    </>
  );

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 w-full flex-1 flex-nowrap items-center gap-2 md:gap-4">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <ResponsiveFilterBar>{additionalFilters}</ResponsiveFilterBar>
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 max-md:justify-between">
        <DismissSelectedWaitlistEntriesButton
          selected={rowSelection}
          appId={appId}
        />
        <HeaderActionButtonsPortal>
          <NewEntryDialog appId={appId} customerIdLock={customerIdLock} />
          {!customerIdLock && canUpdateSettings && (
            <SettingsDialog appId={appId} />
          )}
        </HeaderActionButtonsPortal>
      </div>
    </div>
  );
};
