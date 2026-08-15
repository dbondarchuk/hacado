"use client";

import { AllKeys, useI18n } from "@hacado/i18n/client";
import { AvailablePeriod, ScheduleDaySource } from "@hacado/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  SimpleTimePicker,
  use12HourFormat,
} from "@hacado/ui";
import { parseTime } from "@hacado/utils";
import { Clock, Plus, X } from "lucide-react";
import { DateTime } from "luxon";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { scheduleSourceBlockClass } from "./schedule-source-styles";
import { formatTime, getWeekDayMap, timeToMinutes } from "./utils";

export interface SimpleSchedulerProps {
  days?: number[];
  value: AvailablePeriod[];
  onChange: (value: AvailablePeriod[]) => void;
  addShiftLabel?: string;
  shiftsLabel?: AllKeys;
  weekDate?: Date;
  /** When true, accordion sections for days that already have shifts start expanded. */
  expandDaysWithShiftsByDefault?: boolean;
  /** Per-weekday source layer for shift badges. */
  daySources?: Record<number, ScheduleDaySource>;
  daySourceLabels?: Partial<Record<ScheduleDaySource, string>>;
}

function getExpandedDayIds(days: number[], value: AvailablePeriod[]): string[] {
  return days
    .filter((day) => {
      const period = value.find((p) => p.weekDay === day);
      return (period?.shifts.length ?? 0) > 0;
    })
    .map((day) => day.toString());
}

export const SimpleScheduler: React.FC<SimpleSchedulerProps> = ({
  days = [1, 2, 3, 4, 5, 6, 7],
  value,
  onChange,
  addShiftLabel,
  shiftsLabel,
  weekDate,
  expandDaysWithShiftsByDefault = false,
  daySources,
  daySourceLabels,
}) => {
  const t = useI18n("ui");
  const tAll = useI18n();
  const [expandedDays, setExpandedDays] = useState<string[]>(() =>
    expandDaysWithShiftsByDefault ? getExpandedDayIds(days, value) : [],
  );
  const [editingShift, setEditingShift] = useState<{
    day: number;
    index: number;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [newShift, setNewShift] = useState<{
    day: number;
    startTime: string;
    endTime: string;
  } | null>(null);

  const uses12HourFormat = use12HourFormat();

  // Format time with the utility function
  const formatTimeWithLocale = (time: string) => {
    return formatTime(time, uses12HourFormat);
  };

  const mergeOverlappingShifts = (shifts: { start: string; end: string }[]) => {
    if (shifts.length <= 1) return shifts;

    // Sort shifts by start time
    const sortedShifts = [...shifts].sort(
      (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
    );

    const mergedShifts: { start: string; end: string }[] = [];
    let currentShift = sortedShifts[0];

    for (let i = 1; i < sortedShifts.length; i++) {
      const nextShift = sortedShifts[i];

      // Check if shifts overlap or touch
      const currentEnd = timeToMinutes(currentShift.end);
      const nextStart = timeToMinutes(nextShift.start);
      const nextEnd = timeToMinutes(nextShift.end);

      if (currentEnd >= nextStart) {
        // Merge the shifts
        currentShift = {
          start: currentShift.start,
          end: currentEnd >= nextEnd ? currentShift.end : nextShift.end,
        };
      } else {
        // Add the current shift and move to the next one
        mergedShifts.push(currentShift);
        currentShift = nextShift;
      }
    }

    // Add the last shift
    mergedShifts.push(currentShift);

    return mergedShifts;
  };

  // Get shifts for a specific day
  const getShiftsForDay = (day: number) => {
    const period = value.find((p) => p.weekDay === day);
    const shifts = period ? period.shifts : [];
    return mergeOverlappingShifts(shifts);
  };

  // Start editing a shift
  const handleEditShift = (
    day: number,
    index: number,
    startTime: string,
    endTime: string,
  ) => {
    setEditingShift({ day, index, startTime, endTime });
  };

  // Save edited shift
  const handleSaveEdit = () => {
    if (!editingShift) return;

    // Validate times
    if (
      timeToMinutes(editingShift.startTime) >=
      timeToMinutes(editingShift.endTime)
    ) {
      toast.error(t("scheduler.invalidTimeRange"), {
        description: t("scheduler.startTimeBeforeEndTime"),
      });

      return;
    }

    // Create a new value array with the updated shift
    const newValue = [...value];
    const periodIndex = newValue.findIndex(
      (p) => p.weekDay === editingShift.day,
    );

    if (periodIndex !== -1) {
      // Update existing period
      const newShifts = [...newValue[periodIndex].shifts];
      newShifts[editingShift.index] = {
        start: editingShift.startTime,
        end: editingShift.endTime,
      };
      newValue[periodIndex] = {
        ...newValue[periodIndex],
        shifts: mergeOverlappingShifts(newShifts),
      };
    }

    setEditingShift(null);
    onChange(newValue);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingShift(null);
  };

  // Delete a shift
  const handleDeleteShift = (day: number, index: number) => {
    // Create a new value array without the deleted shift
    const newValue = [...value];
    const periodIndex = newValue.findIndex((p) => p.weekDay === day);

    if (periodIndex !== -1) {
      const newShifts = newValue[periodIndex].shifts.filter(
        (_, i) => i !== index,
      );

      if (newShifts.length === 0) {
        // Remove the period if no shifts remain
        newValue.splice(periodIndex, 1);
      } else {
        // Update the period with remaining shifts
        newValue[periodIndex] = {
          ...newValue[periodIndex],
          shifts: mergeOverlappingShifts(newShifts),
        };
      }
    }

    onChange(newValue);
  };

  // Start adding a new shift
  const handleStartAddShift = (day: number) => {
    // Default to first time slot and a 1-hour duration
    const startTime = "09:00";
    const endTime = "17:00";

    setNewShift({ day, startTime, endTime });

    // Ensure the day accordion is expanded
    if (!expandedDays.includes(day.toString())) {
      setExpandedDays([...expandedDays, day.toString()]);
    }
  };

  // Save new shift
  const handleSaveNewShift = () => {
    if (!newShift) return;

    // Validate times
    if (timeToMinutes(newShift.startTime) >= timeToMinutes(newShift.endTime)) {
      toast.error(t("scheduler.invalidTimeRange"), {
        description: t("scheduler.startTimeBeforeEndTime"),
      });
      return;
    }

    // Create a new value array with the added shift
    const newValue = [...value];
    const periodIndex = newValue.findIndex((p) => p.weekDay === newShift.day);

    if (periodIndex !== -1) {
      // Add to existing period
      newValue[periodIndex] = {
        ...newValue[periodIndex],
        shifts: mergeOverlappingShifts([
          ...newValue[periodIndex].shifts,
          { start: newShift.startTime, end: newShift.endTime },
        ]),
      };
    } else {
      // Create new period
      newValue.push({
        weekDay: newShift.day,
        shifts: [{ start: newShift.startTime, end: newShift.endTime }],
      });
    }

    onChange(newValue);
    setNewShift(null);
  };

  // Cancel adding new shift
  const handleCancelNewShift = () => {
    setNewShift(null);
  };

  const date = useMemo(() => DateTime.now().startOf("day"), []);
  const timeToDate = (time: string) => {
    const parsed = parseTime(time);
    return date.set(parsed).toJSDate();
  };

  const dateToTime = (date: Date) => {
    const dateTime = DateTime.fromJSDate(date);
    return `${dateTime.hour.toString().padStart(2, "0")}:${dateTime.minute.toString().padStart(2, "0")}`;
  };

  const weekDayMap = getWeekDayMap(
    t("calendar.monday"),
    t("calendar.tuesday"),
    t("calendar.wednesday"),
    t("calendar.thursday"),
    t("calendar.friday"),
    t("calendar.saturday"),
    t("calendar.sunday"),
  );

  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        value={expandedDays}
        onValueChange={setExpandedDays}
        className="w-full"
      >
        {days.map((day) => (
          <AccordionItem key={day} value={day.toString()}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex justify-between items-center w-full pr-4">
                <span>
                  {weekDate
                    ? DateTime.fromJSDate(weekDate)
                        .startOf("week")
                        .plus({ days: day - 1 })
                        .toFormat("EEEE, MMM d")
                    : weekDayMap[day]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {shiftsLabel
                    ? tAll(shiftsLabel, {
                        count: getShiftsForDay(day).length,
                      })
                    : t("scheduler.shifts", {
                        count: getShiftsForDay(day).length,
                      })}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {/* List existing shifts */}
                {getShiftsForDay(day).map((shift, index) => {
                  const source = daySources?.[day] || "default";
                  const sourceLabel = daySourceLabels?.[source];
                  return (
                    <Card
                      key={index}
                      className={`relative border ${scheduleSourceBlockClass[source]}`}
                    >
                      <CardContent className="p-3">
                        {editingShift &&
                        editingShift.day === day &&
                        editingShift.index === index ? (
                          // Edit mode
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs font-medium mb-1 block">
                                  {t("scheduler.startTime")}
                                </label>
                                <SimpleTimePicker
                                  modal
                                  minutesDivisibleBy={5}
                                  use12HourFormat={uses12HourFormat}
                                  value={timeToDate(editingShift.startTime)}
                                  onChange={(date) =>
                                    setEditingShift({
                                      ...editingShift,
                                      startTime: dateToTime(date),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium mb-1 block">
                                  {t("scheduler.endTime")}
                                </label>
                                <SimpleTimePicker
                                  modal
                                  minutesDivisibleBy={5}
                                  use12HourFormat={uses12HourFormat}
                                  value={timeToDate(editingShift.endTime)}
                                  onChange={(date) =>
                                    setEditingShift({
                                      ...editingShift,
                                      endTime: dateToTime(date),
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                {t("common.cancel")}
                              </Button>
                              <Button size="sm" onClick={handleSaveEdit}>
                                {t("common.save")}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col gap-1.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 shrink-0 opacity-70" />
                                <span>
                                  {formatTimeWithLocale(shift.start)} -{" "}
                                  {formatTimeWithLocale(shift.end)}
                                </span>
                              </div>
                              {sourceLabel && (
                                <Badge
                                  variant={
                                    source === "company"
                                      ? "default"
                                      : source === "member"
                                        ? "outline"
                                        : source === "app" ||
                                            source === "holiday"
                                          ? "destructive"
                                          : "secondary"
                                  }
                                  className="w-fit"
                                >
                                  {sourceLabel}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2"
                                onClick={() =>
                                  handleEditShift(
                                    day,
                                    index,
                                    shift.start,
                                    shift.end,
                                  )
                                }
                              >
                                {t("scheduler.edit")}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive"
                                onClick={() => handleDeleteShift(day, index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* New shift form */}
                {newShift && newShift.day === day ? (
                  <Card>
                    <CardContent className="p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium mb-1 block">
                            {t("scheduler.startTime")}
                          </label>
                          <SimpleTimePicker
                            modal
                            minutesDivisibleBy={5}
                            use12HourFormat={uses12HourFormat}
                            value={timeToDate(newShift.startTime)}
                            onChange={(date) =>
                              setNewShift({
                                ...newShift,
                                startTime: dateToTime(date),
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">
                            {t("scheduler.endTime")}
                          </label>
                          <SimpleTimePicker
                            modal
                            minutesDivisibleBy={5}
                            use12HourFormat={uses12HourFormat}
                            value={timeToDate(newShift.endTime)}
                            onChange={(date) =>
                              setNewShift({
                                ...newShift,
                                endTime: dateToTime(date),
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelNewShift}
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button size="sm" onClick={handleSaveNewShift}>
                          {addShiftLabel ?? t("scheduler.addShift")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleStartAddShift(day)}
                  >
                    <Plus className="h-4 w-4 mr-1" />{" "}
                    {addShiftLabel ?? t("scheduler.addShift")}
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
