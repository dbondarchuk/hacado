import { useFormatter, useI18n, useLocale } from "@timelish/i18n/client";
import { DateRange } from "@timelish/types";
import {
  Button,
  CalendarDateRangePicker,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  useTimeZone,
} from "@timelish/ui";
import { eachOfInterval } from "@timelish/utils";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { DateTime as LuxonDateTime } from "luxon";
import { useState } from "react";

import {
  formatDateRange,
  groupWaitlistDates,
  WaitlistDateGroup,
} from "../models/utils";

import {
  MAX_WAITLIST_DATES,
  WaitlistDate,
  waitlistTime,
  WaitlistTime,
} from "../models/waitlist";
import {
  WaitlistPublicKeys,
  waitlistPublicNamespace,
  WaitlistPublicNamespace,
} from "../translations/types";

interface WaitlistDatePickerProps {
  value: WaitlistDate[];
  onChange: (entries: WaitlistDate[]) => void;
  minDate?: Date;
}

export function WaitlistDatePicker({
  value,
  onChange,
  minDate = new Date(),
}: WaitlistDatePickerProps) {
  const locale = useLocale();
  const formatter = useFormatter();
  const t = useI18n<WaitlistPublicNamespace, WaitlistPublicKeys>(
    waitlistPublicNamespace,
  );

  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(
    null,
  );
  const [selectedTimes, setSelectedTimes] = useState<WaitlistTime[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleTimeToggle = (time: WaitlistTime) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
    );
  };

  const handleAddEntry = () => {
    if (
      selectedDateRange?.start &&
      selectedDateRange?.end &&
      selectedTimes.length > 0
    ) {
      const dates = eachOfInterval(
        selectedDateRange.start,
        selectedDateRange.end,
        "day",
      )
        .map((date) => ({
          date: date.toISODate()!,
          time: [...selectedTimes],
        }))
        .filter(({ date }) => !value.some((v) => v.date === date));

      const newDates = [...value, ...dates].slice(0, MAX_WAITLIST_DATES);
      onChange(newDates);
      setSelectedDateRange(null);
      setSelectedTimes([]);
      setIsDialogOpen(false);
    }
  };

  const handleRemoveEntry = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const timeZone = useTimeZone();

  const handleRemoveDateFromGroup = (
    group: WaitlistDateGroup,
    dateToRemove: WaitlistDate,
  ) => {
    const updatedDates = value.filter(
      (date) =>
        !(
          date.date === dateToRemove.date &&
          JSON.stringify(date.time.sort()) ===
            JSON.stringify(dateToRemove.time.sort())
        ),
    );
    onChange(updatedDates);
  };

  const handleRemoveGroup = (group: WaitlistDateGroup) => {
    const updatedDates = value.filter(
      (date) =>
        !group.dates.some(
          (groupDate) =>
            date.date === groupDate.date &&
            JSON.stringify(date.time.sort()) ===
              JSON.stringify(groupDate.time.sort()),
        ),
    );
    onChange(updatedDates);
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const isEntryValid =
    selectedDateRange?.start &&
    selectedDateRange?.end &&
    selectedTimes.length > 0;

  const groups = groupWaitlistDates(value);

  return (
    <>
      <div className="space-y-2">
        {groups.map((group) => (
          <Collapsible
            key={group.id}
            open={expandedGroups.has(group.id)}
            onOpenChange={() => toggleGroupExpansion(group.id)}
          >
            <div className="rounded-md border bg-accent/50">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between gap-2 p-2 hover:bg-accent/70 cursor-pointer">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {group.dates.length > 1 ? (
                      expandedGroups.has(group.id) ? (
                        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      )
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">
                        {formatDateRange(
                          group.startDate,
                          group.endDate,
                          locale,
                        )}
                        {group.dates.length > 1 && (
                          <span className="text-muted-foreground ml-1">
                            {t("block.dates.groupLabel", {
                              count: group.dates.length,
                            })}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatter.list(
                          group.times.map((time) => (
                            <span key={time}>{t(`block.times.${time}`)}</span>
                          )),
                          { type: "conjunction" },
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {group.dates.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveGroup(group);
                        }}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                    {group.dates.length === 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDateFromGroup(group, group.dates[0]);
                        }}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              {group.dates.length > 1 && (
                <CollapsibleContent>
                  <div className="px-2 pb-2 space-y-1">
                    {group.dates.map((date) => (
                      <div
                        key={`${date.date}-${date.time.join(",")}`}
                        className="flex items-center justify-between gap-2 rounded-md bg-background/50 p-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">
                            {LuxonDateTime.fromISO(date.date)
                              .setLocale(locale)
                              .toLocaleString(LuxonDateTime.DATE_HUGE)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveDateFromGroup(group, date)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              )}
            </div>
          </Collapsible>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="w-full bg-transparent"
            size="sm"
            variant="outline"
            disabled={value.length >= MAX_WAITLIST_DATES}
          >
            <Plus className="h-3 w-3 mr-1.5" />
            {t("block.times.add")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("block.times.add")}</DialogTitle>
            <DialogDescription>
              {t("block.times.addDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("block.date.label")} *
              </Label>
              <CalendarDateRangePicker
                timeZone={timeZone}
                range={selectedDateRange ?? undefined}
                onChange={(dateRange) =>
                  setSelectedDateRange(dateRange ?? null)
                }
                showOutsideDays={false}
                startMonth={new Date()}
                endMonth={LuxonDateTime.now().plus({ years: 1 }).toJSDate()}
                max={MAX_WAITLIST_DATES}
                disabled={(day) => {
                  const date = LuxonDateTime.fromJSDate(day);
                  return (
                    day < minDate ||
                    value.some((v) => v.date === date.toISODate())
                  );
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("block.times.label")} *
              </Label>
              <div className="space-y-1.5">
                {waitlistTime.map((slot) => (
                  <div
                    key={slot}
                    className="flex items-center gap-2 rounded-md border p-2 hover:bg-accent"
                  >
                    <Checkbox
                      id={slot}
                      checked={selectedTimes.includes(slot)}
                      onCheckedChange={() => handleTimeToggle(slot)}
                    />
                    <Label
                      htmlFor={slot}
                      className="cursor-pointer font-normal flex-1"
                    >
                      {t(`block.times.${slot}`)}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({t(`block.times.descriptions.${slot}`)})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">{t("block.buttons.close")}</Button>
            </DialogClose>
            <Button
              variant="primary"
              onClick={handleAddEntry}
              disabled={!isEntryValid}
            >
              {t("block.buttons.addTime")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
