import {
  CommunicationChannel,
  CommunicationDirection,
  CommunicationLog,
  CommunicationLogContentPayload,
  CommunicationLogCreateInput,
  CommunicationParticipantType,
} from "../communication";
import { Query, WithTotal } from "../database";
import { DateRange } from "../general";

export interface ICommunicationLogsService {
  log(log: CommunicationLogCreateInput): Promise<void>;
  getCommunicationLogs(
    query: Query & {
      direction?: CommunicationDirection[];
      channel?: CommunicationChannel[];
      participantType?: CommunicationParticipantType[];
      range?: DateRange;
      customerId?: string | string[];
      appointmentId?: string;
      memberId?: string | string[];
    },
  ): Promise<WithTotal<CommunicationLog>>;
  getCommunicationLogContent(
    logId: string,
    options?: { memberId?: string | string[] },
  ): Promise<CommunicationLogContentPayload | null>;
  clearAllLogs(): Promise<void>;
  clearSelectedLogs(ids: string[]): Promise<void>;
  clearOldLogs(maxDate: Date): Promise<void>;
}
