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
import { UndoDot } from "lucide-react";
import React from "react";
import {
  WeeklyScheduleAdminKeys,
  WeeklyScheduleAdminNamespace,
  weeklyScheduleAdminNamespace,
} from "../translations/types";
import { resetWeeklySchedule } from "./actions";
import { getWeekDisplay } from "./utils";

export type ResetDialogProps = {
  appId: string;
  week: WeekIdentifier;
  memberId?: string;
  disabled?: boolean;
  isDefault?: boolean;
  className?: string;
  onConfirm: () => void;
};

export const ResetDialog: React.FC<ResetDialogProps> = ({
  appId,
  week,
  memberId,
  disabled,
  isDefault,
  className,
  onConfirm: onReset,
}) => {
  const t = useI18n<WeeklyScheduleAdminNamespace, WeeklyScheduleAdminKeys>(
    weeklyScheduleAdminNamespace,
  );
  const [openConfirmDialog, setOpenConfirmDialog] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const onConfirm = async () => {
    try {
      setLoading(true);
      await toastPromise(resetWeeklySchedule(appId, week, memberId), {
        success: t("dialogs.reset.success", {
          week: getWeekDisplay(week),
        }),
        error: t("statusText.request_error"),
      });

      setOpenConfirmDialog(false);
      onReset();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
      <AlertDialogTrigger asChild>
        <Button
          variant="secondary"
          disabled={disabled || isDefault}
          className={className}
        >
          {!isDefault ? (
            <>
              <UndoDot /> {t("dialogs.reset.resetToDefault")}
            </>
          ) : (
            t("dialogs.reset.defaultSchedule")
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("dialogs.reset.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("dialogs.reset.description", {
              week: getWeekDisplay(week),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("dialogs.reset.cancel")}</AlertDialogCancel>
          <Button
            disabled={loading}
            className="flex flex-row gap-1 items-center"
            onClick={onConfirm}
          >
            {loading && <Spinner />} <span>{t("dialogs.reset.reset")}</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
