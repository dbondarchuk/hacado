"use client";

import { useI18n } from "@timelish/i18n/client";
import { AlertModal, Button, Spinner, toastPromise } from "@timelish/ui";
import { useReload } from "@timelish/ui-admin";
import { X } from "lucide-react";
import React from "react";
import { dismissWaitlistEntries } from "../actions";
import { WaitlistEntry } from "../models";
import {
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
  waitlistAdminNamespace,
} from "../translations/types";

export const DismissSelectedWaitlistEntriesButton: React.FC<{
  appId: string;
  selected: WaitlistEntry[];
}> = ({ selected, appId }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
    waitlistAdminNamespace,
  );

  const { reload } = useReload();
  const action = async () => {
    try {
      setIsLoading(true);

      await toastPromise(
        dismissWaitlistEntries(
          appId,
          selected.map((r) => r._id),
        ),
        {
          success: t("table.toast.waitlist_entries_dismissed", {
            count: selected.length,
          }),
          error: t("table.toast.error_deleting_waitlist_entries"),
        },
      );

      reload();
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        disabled={isLoading || !selected || !selected.length}
        onClick={() => setIsOpen(true)}
        aria-label={t("table.dismiss.label", {
          count: selected.length,
        })}
      >
        {isLoading && <Spinner />}
        <X className="h-4 w-4" />
        <span className="max-md:hidden">
          {t("table.dismiss.label", {
            count: selected.length,
          })}
        </span>
      </Button>
      <AlertModal
        isOpen={isOpen}
        loading={isLoading}
        onClose={() => setIsOpen(false)}
        onConfirm={action}
        description={t("table.dismiss.description", {
          count: selected.length,
        })}
        title={t("table.dismiss.label", {
          count: selected.length,
        })}
        continueButton={t("table.dismiss.confirm", {
          count: selected.length,
        })}
      />
    </>
  );
};
