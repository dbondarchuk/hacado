import { TeamMemberListModel } from "../users/list";
import { Appointment } from "./appointment";

export type CalendarEvent =
  | Appointment
  | {
      uid: string;
      title: string;
      dateTime: Date;
      totalDuration: number;
      memberId: string;
      member?: TeamMemberListModel;
    };
