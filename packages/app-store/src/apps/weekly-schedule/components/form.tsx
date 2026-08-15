"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Schedule,
  ScheduleDaySource,
  ScheduleOverride,
  ScheduleRecurrenceInfo,
  ScheduleWeekDay,
  WeekIdentifier,
} from "@hacado/types";
import {
  Badge,
  Button,
  Separator,
  Skeleton,
  toast,
  toastPromise,
  useDebounce,
} from "@hacado/ui";
import { MemberSelector, Scheduler, WeekSelector } from "@hacado/ui-admin";
import { getDateFromWeekIdentifier, getWeekIdentifier } from "@hacado/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useEffectEvent, useMemo, useState } from "react";
import {
  WeeklyScheduleAdminKeys,
  WeeklyScheduleAdminNamespace,
  weeklyScheduleAdminNamespace,
} from "../translations/types";
import {
  getWeeklySchedule,
  setCompanyHolidays,
  updateWeeklySchedule,
} from "./actions";
import { CopyScheduleDialog } from "./copy-schedule-dialog";
import { RepeatScheduleDialog } from "./repeat-schedule-dialog";
import { ResetAllDialog } from "./reset-all-dialog";
import { ResetDialog } from "./reset-dialog";
import { getWeekDisplay } from "./utils";

const COMPANY_SCOPE = "company";
const ALL_WEEK_DAYS: ScheduleWeekDay[] = [1, 2, 3, 4, 5, 6, 7];

type WeeklySchedule = ScheduleOverride["schedule"];
type WeeklyScheduleFormProps = {
  appId: string;
  showMemberSelector?: boolean;
};

const sourceBadgeVariant: Record<
  ScheduleDaySource,
  "secondary" | "outline" | "default" | "destructive"
> = {
  default: "secondary",
  company: "default",
  member: "outline",
  app: "destructive",
  holiday: "destructive",
};

export const WeeklyScheduleForm: React.FC<WeeklyScheduleFormProps> = ({
  appId,
  showMemberSelector = false,
}) => {
  const t = useI18n<WeeklyScheduleAdminNamespace, WeeklyScheduleAdminKeys>(
    weeklyScheduleAdminNamespace,
  );

  const [loading, setLoading] = React.useState(true);

  const searchParams = useSearchParams();
  const weekStr = searchParams.get("week");
  const week =
    (weekStr ? parseInt(weekStr) : null) || getWeekIdentifier(new Date());

  const scopeParam = searchParams.get("member");
  const memberId = !showMemberSelector
    ? undefined
    : scopeParam === COMPANY_SCOPE || !scopeParam
      ? undefined
      : scopeParam;

  const isCompanyScope = !memberId;

  const router = useRouter();
  const todayWeek = getWeekIdentifier(new Date());

  const [schedule, setSchedule] = useState<Schedule>();
  const [isDefault, setIsDefault] = useState(true);
  const [daySources, setDaySources] = useState<
    Record<number, ScheduleDaySource>
  >({});
  const [holidays, setHolidays] = useState<ScheduleWeekDay[]>([]);
  const [savingHolidays, setSavingHolidays] = useState(false);
  const [recurrence, setRecurrence] = useState<ScheduleRecurrenceInfo | null>(
    null,
  );

  const [currentSchedule, setCurrentSchedule] = useState(schedule);
  const delayedSchedule = useDebounce(currentSchedule);
  // Scheduler remits a normalized shape on mount; treat that as baseline, not a user edit.
  const baselineJsonRef = React.useRef<string | null>(null);
  const syncingFromSchedulerRef = React.useRef(false);
  // Bumped on scope/week change so in-flight saves from a previous scope are ignored.
  const scopeEpochRef = React.useRef(0);

  const weekDate = useMemo(() => getDateFromWeekIdentifier(week), [week]);

  const loadSchedule = async (epoch: number) => {
    setLoading(true);
    syncingFromSchedulerRef.current = true;
    baselineJsonRef.current = null;

    try {
      const response = await getWeeklySchedule(appId, week, memberId);
      // Ignore stale responses after the user switched scope/week.
      if (epoch !== scopeEpochRef.current) return;

      const loaded = response.schedule;
      baselineJsonRef.current = JSON.stringify(loaded);
      setSchedule(loaded);
      setCurrentSchedule(loaded);
      setIsDefault(response.isDefault);
      setDaySources(response.daySources || {});
      setHolidays(response.holidays || []);
      setRecurrence(response.recurrence ?? null);
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      toast.error(t("statusText.failed_to_load_schedule"));
    }
  };

  useEffect(() => {
    const epoch = scopeEpochRef.current + 1;
    scopeEpochRef.current = epoch;
    setLoading(true);
    setSchedule(undefined);
    setCurrentSchedule(undefined);
    baselineJsonRef.current = null;
    syncingFromSchedulerRef.current = true;
    void loadSchedule(epoch);
  }, [appId, week, memberId]);

  const onSchedulerChange = React.useCallback((next: WeeklySchedule) => {
    if (syncingFromSchedulerRef.current) {
      syncingFromSchedulerRef.current = false;
      baselineJsonRef.current = JSON.stringify(next);
      setSchedule(next);
      setCurrentSchedule(next);
      return;
    }
    setCurrentSchedule(next);
  }, []);

  // Always reads the latest memberId/week/loading without re-running on scope change.
  // Saves must only be triggered when delayedSchedule itself changes.
  const saveDelayedSchedule = useEffectEvent(
    async (newSchedule: WeeklySchedule) => {
      if (loading) return;
      const epoch = scopeEpochRef.current;
      if (week < todayWeek) return;
      const nextJson = JSON.stringify(newSchedule);
      if (nextJson === baselineJsonRef.current) return;

      try {
        await toastPromise(
          updateWeeklySchedule(appId, week, newSchedule, memberId),
          {
            success: t("statusText.saved"),
            error: t("statusText.request_error"),
          },
        );

        if (epoch !== scopeEpochRef.current) return;

        baselineJsonRef.current = nextJson;
        setSchedule(newSchedule);
        setIsDefault(false);

        const response = await getWeeklySchedule(appId, week, memberId);
        if (epoch !== scopeEpochRef.current) return;
        setIsDefault(response.isDefault);
        setDaySources(response.daySources || {});
        setHolidays(response.holidays || []);
        setRecurrence(response.recurrence ?? null);
      } catch (error: any) {
        console.error(error);
      }
    },
  );

  useEffect(() => {
    if (!delayedSchedule) return;
    void saveDelayedSchedule(delayedSchedule);
  }, [delayedSchedule]);

  const reloadSchedule = React.useCallback(() => {
    const epoch = scopeEpochRef.current;
    void loadSchedule(epoch);
  }, [appId, week, memberId, t]);

  // keep loadSchedule stable usage for holidays
  const persistHolidays = async (nextHolidays: ScheduleWeekDay[]) => {
    if (!isCompanyScope || week < todayWeek) return;
    setSavingHolidays(true);
    try {
      await toastPromise(setCompanyHolidays(appId, week, nextHolidays), {
        success: t("statusText.saved"),
        error: t("statusText.request_error"),
      });
      reloadSchedule();
    } catch (error: any) {
      console.error(error);
    } finally {
      setSavingHolidays(false);
    }
  };

  const toggleHoliday = (weekDay: ScheduleWeekDay) => {
    const next = holidays.includes(weekDay)
      ? holidays.filter((day) => day !== weekDay)
      : [...holidays, weekDay].sort((a, b) => a - b);
    setHolidays(next);
    void persistHolidays(next);
  };

  const markWholeWeekHoliday = () => {
    setHolidays(ALL_WEEK_DAYS);
    void persistHolidays(ALL_WEEK_DAYS);
  };

  const clearHolidays = () => {
    setHolidays([]);
    void persistHolidays([]);
  };

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
    (value: string | undefined) => {
      updateQuery({
        member: value ?? COMPANY_SCOPE,
      });
    },
    [updateQuery],
  );

  const uniqueSources = useMemo(
    () => Array.from(new Set(Object.values(daySources))),
    [daySources],
  );

  return (
    <div className="w-full space-y-8 relative flex flex-col gap-2">
      {(showMemberSelector ||
        (!loading && (uniqueSources.length > 0 || recurrence))) && (
        <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-center sm:justify-between">
          {showMemberSelector && (
            <MemberSelector
              className="w-full sm:w-[280px] sm:shrink-0"
              value={memberId}
              disabled={loading}
              allowClear
              placeholder={t("form.companySchedule")}
              onItemSelect={onMemberChange}
            />
          )}
          {!loading && (uniqueSources.length > 0 || recurrence) && (
            <div className="flex flex-1 flex-wrap gap-2 items-center text-sm text-muted-foreground min-w-0">
              {uniqueSources.length > 0 && (
                <>
                  <span>{t("form.legend")}</span>
                  {uniqueSources.map((source) => (
                    <Badge key={source} variant={sourceBadgeVariant[source]}>
                      {t(`form.source.${source}`)}
                    </Badge>
                  ))}
                </>
              )}
              {recurrence && (
                <>
                  <Badge variant="outline">
                    {t("form.recurrence.badge" as WeeklyScheduleAdminKeys, {
                      everyWeeks: recurrence.everyWeeks,
                      until: getWeekDisplay(
                        getWeekIdentifier(
                          DateTime.fromISO(recurrence.until, { zone: "utc" }),
                        ),
                      ),
                    })}
                  </Badge>
                  {recurrence.isWeekOverride && (
                    <span className="text-xs">
                      {t(
                        "form.recurrence.weekOverride" as WeeklyScheduleAdminKeys,
                      )}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-2 flex-wrap-reverse justify-between">
        <div className="flex flex-col sm:flex-row gap-1 w-full justify-between">
          <Button
            variant={week === todayWeek ? "primary" : "outline"}
            disabled={week === todayWeek || loading}
            onClick={() => onWeekChange(todayWeek)}
            className="max-sm:w-full"
          >
            {t("form.thisWeek")}
          </Button>
          <div className="flex flex-row gap-1 max-lg:w-full">
            <Button
              variant="outline"
              size="icon"
              title={t("form.previousWeek")}
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
              title={t("form.nextWeek")}
              disabled={loading}
              onClick={() => onWeekChange(week + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="">&nbsp;</div>
        </div>
        <div className="flex flex-col lg:flex-row flex-wrap gap-2 justify-between w-full">
          <div className="flex flex-col max-sm:gap-1 sm:flex-row items-center max-2xl:w-full">
            <ResetDialog
              appId={appId}
              week={week}
              memberId={memberId}
              isDefault={isDefault}
              recurrence={recurrence}
              disabled={week < todayWeek || loading}
              onConfirm={reloadSchedule}
              className="max-sm:w-full sm:rounded-r-none sm:flex-1"
            />
            <Separator orientation="vertical" className="max-sm:hidden" />
            <ResetAllDialog
              appId={appId}
              week={week}
              memberId={memberId}
              disabled={week < todayWeek || loading}
              onConfirm={reloadSchedule}
              className="max-sm:w-full sm:rounded-l-none sm:border-l-0 sm:flex-1"
            />
          </div>
          <div className="flex items-center max-2xl:w-full">
            <CopyScheduleDialog
              appId={appId}
              week={week}
              memberId={memberId}
              disabled={isDefault}
              className="rounded-r-none flex-1"
            />
            <Separator orientation="vertical" />
            <RepeatScheduleDialog
              appId={appId}
              week={week}
              memberId={memberId}
              disabled={isDefault}
              className="rounded-l-none border-l-0 flex-1"
            />
          </div>
        </div>
      </div>

      {isCompanyScope && !loading && (
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">
                {t("form.holidays.title")}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("form.holidays.description")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={week < todayWeek || savingHolidays}
                onClick={markWholeWeekHoliday}
              >
                {t("form.holidays.closeWeek")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={
                  week < todayWeek || savingHolidays || holidays.length === 0
                }
                onClick={clearHolidays}
              >
                {t("form.holidays.clear")}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 sm:grid-cols-[80px_repeat(7,minmax(150px,_1fr))] gap-1">
            <div className="max-sm:hidden time-cell bg-transparent text-transparent text-center p-2 font-medium border-b border-r pointer-events-none border-transparent select-none"></div>
            {ALL_WEEK_DAYS.map((weekDay) => {
              const active = holidays.includes(weekDay);
              const label = DateTime.fromJSDate(weekDate, { zone: "utc" })
                .startOf("day")
                .plus({ days: weekDay - 1 })
                .toFormat("ccc");
              return (
                <Button
                  key={weekDay}
                  size="sm"
                  variant={active ? "destructive" : "outline"}
                  className="px-1"
                  disabled={week < todayWeek || savingHolidays}
                  onClick={() => toggleHoliday(weekDay)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
      )}
      {loading ? (
        <Skeleton className="w-full h-[70vh]" />
      ) : (
        <Scheduler
          value={schedule || []}
          onChange={onSchedulerChange}
          disabled={week < todayWeek}
          weekDate={weekDate}
          daySources={daySources}
          daySourceLabels={{
            default: t("form.source.default"),
            company: t("form.source.company"),
            member: t("form.source.member"),
            app: t("form.source.app"),
            holiday: t("form.source.holiday"),
          }}
        />
      )}
    </div>
  );
};
