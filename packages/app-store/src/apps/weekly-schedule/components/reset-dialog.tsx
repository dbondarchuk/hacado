import { useI18n } from "@hacado/i18n/client";
import { ScheduleRecurrenceInfo, WeekIdentifier } from "@hacado/types";
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
import { getWeekIdentifier } from "@hacado/utils";
import { UndoDot } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import {
  WeeklyScheduleAdminKeys,
  WeeklyScheduleAdminNamespace,
  weeklyScheduleAdminNamespace,
} from "../translations/types";
import { removeRecurringWeeklySchedule, resetWeeklySchedule } from "./actions";
import { getWeekDisplay } from "./utils";

type Msg = WeeklyScheduleAdminKeys;
const msg = (key: string) => key as Msg;

export type ResetDialogProps = {
  appId: string;
  week: WeekIdentifier;
  memberId?: string;
  disabled?: boolean;
  isDefault?: boolean;
  recurrence?: ScheduleRecurrenceInfo | null;
  className?: string;
  onConfirm: () => void;
};

export const ResetDialog: React.FC<ResetDialogProps> = ({
  appId,
  week,
  memberId,
  disabled,
  isDefault,
  recurrence,
  className,
  onConfirm: onReset,
}) => {
  const t = useI18n<WeeklyScheduleAdminNamespace, WeeklyScheduleAdminKeys>(
    weeklyScheduleAdminNamespace,
  );
  const [openConfirmDialog, setOpenConfirmDialog] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [removingSeries, setRemovingSeries] = React.useState(false);
  const resetToCompany = !!memberId;
  const hasRecurrence = !!recurrence;
  const recurrenceOnly = hasRecurrence && !recurrence.isWeekOverride;
  const overrideOnSeries = hasRecurrence && recurrence.isWeekOverride;

  const untilDisplay = recurrence
    ? getWeekDisplay(
        getWeekIdentifier(DateTime.fromISO(recurrence.until, { zone: "utc" })),
      )
    : "";

  const triggerLabel = (() => {
    if (isDefault) {
      return t(
        msg(
          resetToCompany
            ? "dialogs.reset.companySchedule"
            : "dialogs.reset.defaultSchedule",
        ),
      );
    }
    if (recurrenceOnly) {
      return (
        <>
          <UndoDot /> {t(msg("dialogs.reset.removeThisWeekFromSeries"))}
        </>
      );
    }
    return (
      <>
        <UndoDot />{" "}
        {t(
          msg(
            resetToCompany
              ? "dialogs.reset.resetThisWeekToCompany"
              : "dialogs.reset.resetThisWeekToDefault",
          ),
        )}
      </>
    );
  })();

  const descriptionKey = msg(
    recurrenceOnly
      ? resetToCompany
        ? "dialogs.reset.descriptionFromSeriesCompany"
        : "dialogs.reset.descriptionFromSeries"
      : overrideOnSeries
        ? resetToCompany
          ? "dialogs.reset.descriptionOverrideOnSeriesCompany"
          : "dialogs.reset.descriptionOverrideOnSeries"
        : resetToCompany
          ? "dialogs.reset.descriptionCompany"
          : "dialogs.reset.description",
  );

  const onConfirmWeek = async () => {
    try {
      setLoading(true);
      await toastPromise(resetWeeklySchedule(appId, week, memberId), {
        success: t(
          msg(
            hasRecurrence
              ? "dialogs.reset.successFromSeries"
              : resetToCompany
                ? "dialogs.reset.successCompany"
                : "dialogs.reset.success",
          ),
          {
            week: getWeekDisplay(week),
          },
        ),
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

  const onConfirmRemoveSeries = async () => {
    if (!recurrence) return;
    try {
      setRemovingSeries(true);
      await toastPromise(
        removeRecurringWeeklySchedule(appId, recurrence.id, memberId),
        {
          success: t(msg("dialogs.reset.removeSeriesSuccess")),
          error: t("statusText.request_error"),
        },
      );

      setOpenConfirmDialog(false);
      onReset();
    } catch (error: any) {
      console.error(error);
    } finally {
      setRemovingSeries(false);
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
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("dialogs.reset.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(descriptionKey, {
              week: getWeekDisplay(week),
              everyWeeks: recurrence?.everyWeeks ?? 1,
            })}
          </AlertDialogDescription>
          {hasRecurrence && (
            <AlertDialogDescription>
              {t(msg("dialogs.reset.removeSeriesDescription"), {
                everyWeeks: recurrence.everyWeeks,
                until: untilDisplay,
                fallback: t(
                  msg(
                    resetToCompany
                      ? "dialogs.reset.fallbackCompany"
                      : "dialogs.reset.fallbackDefault",
                  ),
                ),
              })}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>{t("dialogs.reset.cancel")}</AlertDialogCancel>
          {hasRecurrence && (
            <Button
              variant="destructive"
              disabled={loading || removingSeries}
              className="flex flex-row gap-1 items-center"
              onClick={onConfirmRemoveSeries}
            >
              {removingSeries && <Spinner />}{" "}
              <span>{t(msg("dialogs.reset.removeSeries"))}</span>
            </Button>
          )}
          <Button
            disabled={loading || removingSeries}
            className="flex flex-row gap-1 items-center"
            onClick={onConfirmWeek}
          >
            {loading && <Spinner />}{" "}
            <span>
              {recurrenceOnly
                ? t(msg("dialogs.reset.removeThisWeekFromSeries"))
                : t("dialogs.reset.reset")}
            </span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
