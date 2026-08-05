import type { DaySchedule, HourNumbers } from "@hacado/types";
import type { ReactNode } from "react";

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

export type CalendarEventVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "destructive"
  | "current";

export type EventCalendarMember = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type EventCalendarEvent = {
  id?: string;
  start: Date;
  end: Date;
  /** Primary label — service name for appointments, event title for external. */
  title: string;
  /** Customer display name (appointments). */
  customerName?: string;
  /** Assigned staff member (appointments). */
  member?: EventCalendarMember;
  variant?: CalendarEventVariant;
  /** Member-derived hex; when set, overrides variant fill with tinted styles. */
  color?: string;
};

type BaseEventCalendarProps = {
  date?: Date;
  events?: EventCalendarEvent[];
  className?: string;
  schedule?: Record<string, DaySchedule>;
  onRangeChange?: (start: Date, end: Date) => void;
  onEventClick?: (event: EventCalendarEvent) => void;
};

type BaseWeeklyEventCalendarProps = BaseEventCalendarProps & {
  scrollToHour?: HourNumbers;
  slotInterval?: 5 | 10 | 15 | 20 | 30;
};

type WeekOfEventCalendarProps = BaseWeeklyEventCalendarProps;

type DaysAroundCalendarProps = BaseWeeklyEventCalendarProps & {
  daysAround?: number;
};

export type WeeklyEventCalendarProps =
  | (WeekOfEventCalendarProps & {
      variant: "week-of";
    })
  | (DaysAroundCalendarProps & {
      variant: "days-around";
    });

export type DailyEventCalendarProps = BaseWeeklyEventCalendarProps;

export type MonthlyEventCalendarProps = BaseEventCalendarProps & {
  onDateClick?: (date: Date) => void;
};

export type AgendaEventCalendarProps = BaseEventCalendarProps & {
  daysToShow?: number;
  renderEvent?: (event: EventCalendarEvent) => ReactNode;
};

export type EventCalendarType =
  | "weekly"
  | "days-around"
  | "monthly"
  | "daily"
  | "agenda";

export type EventCalendarView = EventCalendarType;

export type EventCalendarProps = {
  events?: EventCalendarEvent[];
  schedule?: Record<string, DaySchedule>;
  className?: string;
  loading?: boolean;

  /** Anchor date for the visible range. */
  date?: Date;
  onDateChange?: (date: Date) => void;

  /**
   * Controlled / forced view. When set with `onViewChange`, the calendar is controlled.
   * When set without allowing view switch, the view is forced.
   */
  view?: EventCalendarView;
  defaultView?: EventCalendarView;
  onViewChange?: (view: EventCalendarView) => void;

  /** Show the header (today, time nav, mode switch, date label). Default true. */
  showControls?: boolean;
  /** Show Today + prev/next. Default true. */
  allowTimeChange?: boolean;
  /** Show Day/Week/Month/Agenda switch. Default true. */
  allowViewSwitch?: boolean;

  daysAround?: number;
  daysToShow?: number;
  scrollToHour?: HourNumbers;
  slotInterval?: 5 | 10 | 15 | 20 | 30;

  onRangeChange?: (start: Date, end: Date) => void;
  onEventClick?: (event: EventCalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  renderEvent?: (event: EventCalendarEvent) => ReactNode;
  /** Rendered in the controls row immediately after the view switch. */
  controlsAfterViewSwitch?: ReactNode;
};

/** Fetching wrapper around EventCalendar (admin API + appointment dialog). */
export type EventsCalendarProps = EventCalendarProps & {
  /** @deprecated Prefer `view`. Kept for backwards compatibility. */
  type?: EventCalendarView;
  /** Scope fetched events/schedule to this member. Omit for all (server may still gate). */
  memberId?: string;
};
