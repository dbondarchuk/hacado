import { useI18n } from "@hacado/i18n/client";
import { WeekIdentifier } from "@hacado/types";
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
  Spinner,
  toastPromise,
} from "@hacado/ui";
import { RotateCcw } from "lucide-react";
import React from "react";
import {
  WeeklyScheduleAdminKeys,
  WeeklyScheduleAdminNamespace,
  weeklyScheduleAdminNamespace,
} from "../translations/types";
import { resetAllWeeklySchedule } from "./actions";
import { getWeekDisplay } from "./utils";

export type ResetAllDialogProps = {
  appId: string;
  week: WeekIdentifier;
  memberId?: string;
  disabled?: boolean;
  className?: string;
  onConfirm: () => void;
};

export const ResetAllDialog: React.FC<ResetAllDialogProps> = ({
  appId,
  week,
  memberId,
  disabled,
  className,
  onConfirm: onResetAll,
}) => {
  const t = useI18n<WeeklyScheduleAdminNamespace, WeeklyScheduleAdminKeys>(
    weeklyScheduleAdminNamespace,
  );
  const [openConfirmDialog, setOpenConfirmDialog] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const resetToCompany = !!memberId;

  const onConfirm = async () => {
    try {
      setLoading(true);
      await toastPromise(resetAllWeeklySchedule(appId, week, memberId), {
        success: t(
          resetToCompany
            ? "dialogs.resetAll.successCompany"
            : "dialogs.resetAll.success",
          {
            week: getWeekDisplay(week),
          },
        ),
        error: t("statusText.request_error"),
      });

      setOpenConfirmDialog(false);
      onResetAll();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" disabled={disabled} className={className}>
          <RotateCcw />{" "}
          {t(
            resetToCompany
              ? "dialogs.resetAll.resetAllToCompany"
              : "dialogs.resetAll.resetAllToDefault",
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("dialogs.resetAll.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              resetToCompany
                ? "dialogs.resetAll.descriptionCompany"
                : "dialogs.resetAll.description",
              {
                week: getWeekDisplay(week),
              },
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("dialogs.resetAll.cancel")}</AlertDialogCancel>
          <Button
            disabled={loading}
            className="flex flex-row gap-1 items-center"
            onClick={onConfirm}
          >
            {loading && <Spinner />} <span>{t("dialogs.resetAll.reset")}</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
