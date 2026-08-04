"use client";

import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { CustomerListModel } from "@timelish/types";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Spinner,
  toastPromise,
} from "@timelish/ui";
import { CustomerSelector } from "@timelish/ui-admin";
import { Merge } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export const MergeSelectedCustomersButton: React.FC<{
  selected: CustomerListModel[];
}> = ({ selected }) => {
  const t = useI18n("admin");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [targetCustomerId, setTargetCustomerId] = React.useState<string>();

  const router = useRouter();
  const action = async () => {
    if (!targetCustomerId) return;

    try {
      setIsLoading(true);

      await toastPromise(
        adminApi.customers.mergeCustomers(
          targetCustomerId,
          selected.map((customer) => customer._id),
        ),
        {
          success: t("customers.table.merge.success"),
          error: t("customers.table.merge.error"),
        },
      );

      router.refresh();
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          aria-label={t("customers.table.merge.selectedCount", {
            count: selected.length,
          })}
          disabled={isLoading || !selected || !selected.length}
        >
          {isLoading && <Spinner />}
          <Merge className="h-4 w-4" />
          <span className="max-md:hidden">
            {t("customers.table.merge.selectedCount", {
              count: selected.length,
            })}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("customers.table.merge.selectedCount", {
              count: selected.length,
            })}
          </DialogTitle>
          <DialogDescription>
            {t("customers.table.merge.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2">
          <Label>{t("customers.table.merge.targetCustomer")}</Label>
          <CustomerSelector
            onItemSelect={setTargetCustomerId}
            value={targetCustomerId}
            className="w-full"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("customers.table.merge.cancel")}
            </Button>
          </DialogClose>
          <Button
            onClick={action}
            variant="default"
            disabled={!targetCustomerId}
          >
            {isLoading && <Spinner />}
            <span>{t("customers.table.merge.confirm")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
