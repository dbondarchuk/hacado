"use client";
import { useI18n } from "@hacado/i18n/client";
import {
  AlertModal,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toastPromise,
} from "@hacado/ui";
import { useReload } from "@hacado/ui-admin";
import { SendCommunicationDialog } from "@hacado/ui-admin-kit";
import { CalendarPlus, MoreHorizontal, Send, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { dismissWaitlistEntries } from "../actions";
import { WaitlistEntry } from "../models";
import {
  WaitlistAdminKeys,
  waitlistAdminNamespace,
  WaitlistAdminNamespace,
} from "../translations/types";

interface CellActionProps {
  waitlistEntry: WaitlistEntry;
  appId: string;
}

export const CellAction: React.FC<CellActionProps> = ({
  waitlistEntry,
  appId,
}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openCommunicationDialogOpen, setOpenCommunicationDialogOpen] =
    useState(false);
  const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
    waitlistAdminNamespace,
  );

  const tUi = useI18n("ui");

  const { reload } = useReload();

  const onConfirm = async () => {
    try {
      setLoading(true);

      await toastPromise(dismissWaitlistEntries(appId, [waitlistEntry._id]), {
        success: t("table.toast.waitlist_entry_dismissed", {
          name: waitlistEntry.name,
        }),
        error: t("table.toast.error_deleting_waitlist_entry"),
      });

      setOpen(false);
      reload();
    } catch (error: any) {
      setLoading(false);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SendCommunicationDialog
        customerId={waitlistEntry.customerId}
        open={openCommunicationDialogOpen}
        onOpenChange={setOpenCommunicationDialogOpen}
      />
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title={t("table.dismiss.title")}
        description={t("table.dismiss.description")}
        continueButton={t("table.dismiss.confirm")}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{tUi("common.openMenu")}</span>
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{tUi("actions.label")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/waitlist/appointment/new?id=${waitlistEntry._id}`}
              className="text-foreground"
            >
              <CalendarPlus className="size-3.5" />{" "}
              {t("table.actions.createAppointment")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenCommunicationDialogOpen(true)}
          >
            <Send className="size-3.5" />
            {t("table.actions.sendMessage")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <X className="size-3.5" /> {t("table.dismiss.action")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
