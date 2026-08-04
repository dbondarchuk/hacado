"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Spinner,
  toastPromise,
} from "@timelish/ui";
import { CustomerSelector, useReload } from "@timelish/ui-admin";
import { UserPlus } from "lucide-react";
import React from "react";
import { reassignFormResponses } from "../../actions";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { ResponsesTableRow } from "./columns";

export const ReassignSelectedFormResponsesButton: React.FC<{
  appId: string;
  selected: ResponsesTableRow[];
}> = ({ selected, appId }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [customerId, setCustomerId] = React.useState<string | undefined>();
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  const tAdmin = useI18n("admin");

  const { reload } = useReload();

  const action = async () => {
    try {
      setIsLoading(true);
      await toastPromise(
        reassignFormResponses(
          appId,
          selected.map((r) => r._id),
          customerId ?? null,
        ),
        {
          success: t("responses.table.toast.responsesReassigned", {
            count: selected.length,
          }),
          error: tAdmin("common.toasts.error"),
        },
      );
      reload();
      setIsOpen(false);
      setCustomerId(undefined);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="secondary"
        disabled={!selected?.length}
        onClick={() => setIsOpen(true)}
        aria-label={t("responses.table.reassignSelected.label", {
          count: selected.length,
        })}
      >
        <UserPlus className="h-4 w-4" />
        <span className="max-md:hidden">
          {t("responses.table.reassignSelected.label", {
            count: selected.length,
          })}
        </span>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("responses.table.reassignSelected.title", {
              count: selected.length,
            })}
          </DialogTitle>
          <DialogDescription>
            {t("responses.table.reassignSelected.description", {
              count: selected.length,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2">
          <Label>{t("responses.edit.customerLabel")}</Label>
          <CustomerSelector
            onItemSelect={(id) => setCustomerId(id ?? undefined)}
            value={customerId}
            allowClear
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("responses.table.reassignSelected.cancel")}
            </Button>
          </DialogClose>
          <Button onClick={action} disabled={isLoading}>
            {isLoading && <Spinner />}
            <span>{t("responses.table.reassignSelected.confirm")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
