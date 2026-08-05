"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  ButtonGroup,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hacado/ui";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import { HeaderActionButtonsPortal } from "@hacado/ui-admin-kit";
import { Plus, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { SelectFormDialog } from "../components/select-form-dialog";
import { DeleteSelectedFormResponsesButton } from "./delete-selected";
import { FormsDataTableAsyncFilterBox } from "./forms-data-table-async-filter-box";
import { ReassignSelectedFormResponsesButton } from "./reassign-selected";
import { useResponsesTableFilters } from "./use-table-filters";

export const ResponsesTableAction: React.FC<{
  appId: string;
  /** When set, customer filter is hidden and new response link includes this customer and returnUrl. */
  customerIdLock?: string;
  disableNewResponseLink?: boolean;
  /** When set with customerIdLock, redirect here after creating a new response. */
  returnUrl?: string;
}> = ({ appId, customerIdLock, disableNewResponseLink, returnUrl }) => {
  const { rowSelection } = useSelectedRowsStore();
  const router = useRouter();
  const [selectFormOpen, setSelectFormOpen] = useState(false);
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setSearchQuery,
    setPage,
    formIdFilter,
    setFormIdFilter,
    customerIdFilter,
    setCustomerIdFilter,
    start,
    setStartValue,
    end,
    setEndValue,
  } = useResponsesTableFilters();
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  const tAdmin = useI18n("admin");

  const handleSelectFormForNew = (formId: string) => {
    const params = new URLSearchParams({ formId });
    if (customerIdLock) params.set("customerId", customerIdLock);
    if (returnUrl) params.set("returnUrl", returnUrl);
    router.push(`/dashboard/forms/responses/new?${params.toString()}`);
  };

  const selectedFormId =
    formIdFilter?.length === 1 ? formIdFilter[0] : undefined;

  const additionalFilters = (
    <>
      <FormsDataTableAsyncFilterBox
        appId={appId}
        filterKey="formId"
        filterValue={formIdFilter}
        setFilterValue={setFormIdFilter}
      />
      {!customerIdLock && (
        <CustomersDataTableAsyncFilterBox
          filterKey="customerId"
          title={t("responses.table.filters.customer")}
          filterValue={customerIdFilter}
          setFilterValue={setCustomerIdFilter}
        />
      )}
      <DataTableRangeBox
        startValue={start}
        endValue={end}
        setStartValue={setStartValue}
        setEndValue={setEndValue}
      />
    </>
  );

  return (
    <>
      <div className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 md:flex-wrap items-center gap-4">
          <DataTableSearch
            searchKey="search"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setPage={setPage}
          />
          <Popover>
            <PopoverTrigger
              tooltip={tAdmin("common.labels.filters")}
              asChild
              className="md:hidden"
            >
              <Button variant="outline">
                <Settings2 size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-2">
              {additionalFilters}
            </PopoverContent>
          </Popover>
          <div className="hidden md:flex flex-row gap-4">
            {additionalFilters}
          </div>
          <DataTableResetFilter
            isFilterActive={isAnyFilterActive}
            onReset={resetFilters}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 max-md:justify-between">
          <ButtonGroup>
            <ReassignSelectedFormResponsesButton
              selected={rowSelection}
              appId={appId}
            />
            <DeleteSelectedFormResponsesButton
              selected={rowSelection}
              appId={appId}
            />
          </ButtonGroup>
          <HeaderActionButtonsPortal>
            {!disableNewResponseLink && (
              <Button
                onClick={() => setSelectFormOpen(true)}
                variant="default"
                aria-label={t("responses.table.actions.create")}
              >
                <Plus size={16} />
                <span className="max-md:hidden">
                  {t("responses.table.actions.create")}
                </span>
              </Button>
            )}
          </HeaderActionButtonsPortal>
        </div>
      </div>
      <SelectFormDialog
        appId={appId}
        open={selectFormOpen}
        onOpenChange={setSelectFormOpen}
        onSelect={handleSelectFormForNew}
        selectedFormId={selectedFormId}
      />
    </>
  );
};
