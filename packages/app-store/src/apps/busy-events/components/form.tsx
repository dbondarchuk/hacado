"use client";

import { useI18n } from "@timelish/i18n/client";
import { Schedule, ScheduleOverride, WeekIdentifier } from "@timelish/types";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  toast,
  toastPromise,
  useDebounce,
} from "@timelish/ui";
import { Scheduler, WeekSelector } from "@timelish/ui-admin";
import { getDateFromWeekIdentifier, getWeekIdentifier } from "@timelish/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import {
  BusyEventsAdminAllKeys,
  BusyEventsAdminKeys,
  busyEventsAdminNamespace,
  BusyEventsAdminNamespace,
} from "../translations/types";
import { getWeeklyEvents, setEvents } from "./actions";

type WeeklySchedule = ScheduleOverride["schedule"];
type BusyEventsFormProps = {
  appId: string;
  /** Active org members; a member selector is shown when there is more than one. */
  members?: { id: string; name: string }[];
};

export const BusyEventsForm: React.FC<BusyEventsFormProps> = ({
  appId,
  members = [],
}) => {
  const [loading, setLoading] = React.useState(true);
  const t = useI18n<BusyEventsAdminNamespace, BusyEventsAdminKeys>(
    busyEventsAdminNamespace,
  );
  const tAdmin = useI18n("admin");

  const searchParams = useSearchParams();
  const weekStr = searchParams.get("week");
  const week =
    (weekStr ? parseInt(weekStr) : null) || getWeekIdentifier(new Date());

  const showMemberSelector = members.length > 1;
  const memberParam = searchParams.get("member");
  const memberId = showMemberSelector
    ? members.some((member) => member.id === memberParam)
      ? (memberParam ?? undefined)
      : members[0]?.id
    : undefined;

  const router = useRouter();
  const todayWeek = getWeekIdentifier(new Date());

  const [schedule, setSchedule] = useState<Schedule>();

  const [currentSchedule, setCurrentSchedule] = useState(schedule);
  const delayedSchedule = useDebounce(currentSchedule);

  const weekDate = useMemo(() => getDateFromWeekIdentifier(week), [week]);

  const loadSchedule = async () => {
    setLoading(true);

    try {
      const response = await getWeeklyEvents(appId, week, memberId);
      setSchedule(response);
      setCurrentSchedule(response);
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      toast.error(t("errors.failed_to_load_schedule"));
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [appId, week, memberId]);

  const onScheduleChange = async (newSchedule: WeeklySchedule) => {
    if (week < todayWeek) return;
    if (JSON.stringify(schedule) === JSON.stringify(newSchedule)) return;

    try {
      // setLoading(true);
      await toastPromise(setEvents(appId, week, newSchedule, memberId), {
        success: tAdmin("common.toasts.saved"),
        error: tAdmin("common.toasts.error"),
      });

      setSchedule(newSchedule);
    } catch (error: any) {
      console.error(error);
    } finally {
      // setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!delayedSchedule) return;
    onScheduleChange(delayedSchedule);
  }, [delayedSchedule]);

  const updateQuery = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const onWeekChange = React.useCallback(
    (newWeek: WeekIdentifier) => {
      if (newWeek !== week) {
        updateQuery({ week: String(newWeek) });
      }
    },
    [updateQuery, week],
  );

  const onMemberChange = React.useCallback(
    (newMemberId: string) => {
      if (newMemberId !== memberId) {
        updateQuery({ member: newMemberId });
      }
    },
    [updateQuery, memberId],
  );

  return (
    <div className="w-full space-y-8 relative flex flex-col gap-2">
      {showMemberSelector && (
        <Select
          value={memberId}
          onValueChange={onMemberChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full lg:w-[280px]">
            <SelectValue placeholder={t("selectMember")} />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex flex-col lg:flex-row gap-2 justify-between">
        <Button
          variant={week === todayWeek ? "primary" : "outline"}
          disabled={week === todayWeek || loading}
          onClick={() => onWeekChange(todayWeek)}
        >
          {t("thisWeek")}
        </Button>
        <div className="flex flex-row gap-1 max-lg:w-full">
          <Button
            variant="outline"
            size="icon"
            title={t("previousWeek")}
            disabled={loading}
            onClick={() => onWeekChange(week - 1)}
          >
            <ChevronLeft />
          </Button>
          <WeekSelector
            initialWeek={week}
            disabled={loading}
            onWeekChange={onWeekChange}
            className="lg:w-[324px] flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            title={t("nextWeek")}
            disabled={loading}
            onClick={() => onWeekChange(week + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      {loading ? (
        <Skeleton className="w-full h-[70vh]" />
      ) : (
        <Scheduler
          value={schedule || []}
          onChange={setCurrentSchedule}
          disabled={week < todayWeek}
          weekDate={weekDate}
          shiftsLabel={
            "app_busy-events_admin.shifts" satisfies BusyEventsAdminAllKeys
          }
          addShiftLabel={t("addShift")}
        />
      )}
    </div>
  );
};
