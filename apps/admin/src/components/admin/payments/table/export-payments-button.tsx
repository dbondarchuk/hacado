"use client";

import {
  adminApi,
  PaymentsExportError,
  paymentsSearchParams,
} from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { PAYMENTS_EXPORT_MAX_ROWS } from "@timelish/types";
import { Button, toast } from "@timelish/ui";
import { FileDown, Loader2 } from "lucide-react";
import { useQueryState } from "nuqs";
import { useCallback, useState } from "react";
import { usePaymentsTableFilters } from "./use-table-filters";

export function ExportPaymentsButton() {
  const t = useI18n("admin");
  const [isExporting, setIsExporting] = useState(false);
  const {
    searchQuery,
    typeFilter,
    methodFilter,
    start,
    end,
    customerFilter,
    appointmentFilter,
  } = usePaymentsTableFilters();
  const [sort] = useQueryState(
    "sort",
    paymentsSearchParams.sort.withOptions({ shallow: false }),
  );

  const onExport = useCallback(async () => {
    setIsExporting(true);

    try {
      await adminApi.payments.exportPayments({
        search: searchQuery || undefined,
        type: typeFilter ?? undefined,
        method: methodFilter ?? undefined,
        start: start ?? undefined,
        end: end ?? undefined,
        customerId: customerFilter ?? undefined,
        appointmentId: appointmentFilter ?? undefined,
        sort: sort ?? undefined,
      });

      toast.success(t("paymentsList.exportCsvSuccess"));
    } catch (error) {
      if (
        error instanceof PaymentsExportError &&
        error.status === 413 &&
        error.body?.code === "export_limit_exceeded"
      ) {
        toast.error(
          t("paymentsList.exportCsvTooMany", {
            limit: error.body.limit ?? PAYMENTS_EXPORT_MAX_ROWS,
          }),
        );
        return;
      }

      toast.error(t("paymentsList.exportCsvError"));
    } finally {
      setIsExporting(false);
    }
  }, [
    appointmentFilter,
    customerFilter,
    end,
    methodFilter,
    searchQuery,
    start,
    t,
    typeFilter,
    sort,
  ]);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <FileDown className="size-4" />
      )}
      <span className="max-md:hidden">
        {isExporting
          ? t("paymentsList.exportCsvLoading")
          : t("paymentsList.exportCsv")}
      </span>
    </Button>
  );
}
