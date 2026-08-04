"use client";

import { useI18n } from "@timelish/i18n/client";
import { WeekIdentifier } from "@timelish/types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
import { WeekSelector } from "@timelish/ui-admin";
import { getWeekIdentifier } from "@timelish/utils";
import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import {
  WeeklyScheduleAdminKeys,
  WeeklyScheduleAdminNamespace,
  weeklyScheduleAdminNamespace,
} from "../translations/types";
import { copyWeeklySchedule } from "./actions";
import { getWeekDisplay } from "./utils";

type CopyScheduleDialogProps = {
  appId: string;
  week: WeekIdentifier;
  memberId?: string;
  disabled?: boolean;
  className?: string;
};

export const CopyScheduleDialog: React.FC<CopyScheduleDialogProps> = ({
  appId,
  week,
  memberId,
  disabled,
  className,
}) => {
  const t = useI18n<WeeklyScheduleAdminNamespace, WeeklyScheduleAdminKeys>(
    weeklyScheduleAdminNamespace,
  );
  const [openDialog, setOpenDialog] = React.useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [newWeek, setNewWeek] = React.useState(week);

  const router = useRouter();
  const todayWeek = getWeekIdentifier(new Date());

  const onConfirm = async () => {
    try {
      setLoading(true);
      await toastPromise(copyWeeklySchedule(appId, week, newWeek, memberId), {
        success: t("dialogs.copy.success"),
        error: t("statusText.request_error"),
      });

      setOpenConfirmDialog(false);
      setOpenDialog(false);

      router.push(`?week=${newWeek}`);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const id = React.useId();

  return (
    <Dialog onOpenChange={setOpenDialog} open={openDialog}>
      <DialogTrigger asChild>
        <Button variant="primary" disabled={disabled} className={className}>
          <Copy /> {t("dialogs.copy.copySchedule")}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex flex-col max-h-[100%] translate-y-[-100%]"
        overlayVariant="blur"
      >
        <DialogHeader>
          <DialogTitle className="w-full flex flex-row justify-between items-center mt-2">
            {t("dialogs.copy.title")}
          </DialogTitle>
          <DialogDescription>
            {t("dialogs.copy.description", {
              week: getWeekDisplay(week),
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col gap-2 w-full overflow-auto">
          <Label htmlFor={id}>Target week</Label>
          <WeekSelector
            initialWeek={newWeek}
            onWeekChange={setNewWeek}
            minWeek={todayWeek}
          />
        </div>
        <DialogFooter className="!justify-between flex-row gap-2">
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
          <AlertDialog
            open={openConfirmDialog}
            onOpenChange={setOpenConfirmDialog}
          >
            <AlertDialogTrigger asChild>
              <Button variant="default" disabled={week === newWeek}>
                {t("dialogs.copy.copy")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("dialogs.copy.title")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("dialogs.copy.description", {
                    week: getWeekDisplay(newWeek),
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("dialogs.copy.cancel")}
                </AlertDialogCancel>
                <Button
                  disabled={loading}
                  className="flex flex-row gap-1 items-center"
                  onClick={onConfirm}
                >
                  {loading && <Spinner />} <span>{t("dialogs.copy.copy")}</span>
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
