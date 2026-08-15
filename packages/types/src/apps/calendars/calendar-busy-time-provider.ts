import { Period } from "../../booking";
import { ConnectedAppData } from "../connected-app.data";

export type CalendarBusyTime = Period & {
  title?: string;
  uid: string;
};

export interface ICalendarBusyTimeProvider {
  getBusyTimes(
    app: ConnectedAppData,
    start: Date,
    end: Date,
    memberId?: string,
  ): Promise<CalendarBusyTime[]>;
}
