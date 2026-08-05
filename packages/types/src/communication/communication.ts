import { AllKeys } from "@hacado/i18n";
import { AppointmentEntity } from "../booking";
import { Customer } from "../customers";
import { WithDatabaseId, WithOrganizationId } from "../database";
import type { OrganizationMember } from "../users";
import { Prettify } from "../utils";

export const emailCommunicationChannel = "email" as const;
export const textMessageCommunicationChannel = "text-message" as const;
export const communicationChannels = [
  emailCommunicationChannel,
  textMessageCommunicationChannel,
] as const;

export type CommunicationChannel = (typeof communicationChannels)[number];

export const communicationDirectionSchema = ["outbound", "inbound"] as const;
export type CommunicationDirection =
  (typeof communicationDirectionSchema)[number];

export const communicationParticipantTypeSchema = [
  "customer",
  "member",
] as const;
export type CommunicationParticipantType =
  (typeof communicationParticipantTypeSchema)[number];

/** Full message body loaded from S3 (or legacy inline DB fields). */
export type CommunicationLogContentPayload = {
  text: string;
  html?: string;
  data?: unknown;
};

/**
 * Document stored in MongoDB. Large body fields may be absent when payload is
 * stored in S3 under `{organizationId}/communication-logs/{_id}.json`.
 */
export type CommunicationLogEntity = Prettify<
  WithOrganizationId<
    WithDatabaseId<{
      direction: CommunicationDirection;
      channel: CommunicationChannel;
      participant: string;
      participantType: CommunicationParticipantType;
      memberId?: string;
      member?: OrganizationMember;
      handledBy:
        | AllKeys
        | {
            key: AllKeys;
            args: Record<string, string>;
          };
      subject?: string;
      appointmentId?: string;
      customerId?: string;
      dateTime: Date;
      /** Short plain-text preview for lists and search. */
      preview?: string;
      /** True when S3 JSON includes a `data` object to show in admin. */
      hasPayloadData?: boolean;
      /** Legacy inline storage; omitted once payload is in S3. */
      text?: string;
      html?: string;
      data?: unknown;
    }>
  >
>;

export type CommunicationLogCreateInput = Pick<
  CommunicationLogEntity,
  "direction" | "channel" | "participant" | "handledBy"
> & {
  subject?: string;
  appointmentId?: string;
  customerId?: string;
  text: string;
  html?: string;
  data?: unknown;
} & (
      | {
          participantType: Extract<CommunicationParticipantType, "customer">;
          /** Optional assigned member (e.g. when a customer reply belongs to a staff thread). */
          memberId?: string;
        }
      | {
          participantType: Extract<CommunicationParticipantType, "member">;
          memberId: string;
        }
  );

/** API / UI list row: no full body fields, only preview metadata. */
export type CommunicationLog = Omit<
  CommunicationLogEntity,
  "text" | "html" | "data"
> & {
  preview: string;
  hasPayloadData: boolean;
  appointment?: AppointmentEntity;
  customer?: Customer;
};
