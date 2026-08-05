import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import {
  communicationChannels,
  communicationDirectionSchema,
  communicationParticipantTypeSchema,
} from "@hacado/types";
import { baseSearchParams } from "./base";

export const communicationLogsSearchParams = {
  ...baseSearchParams,
  start: parseAsIsoDateTime,
  end: parseAsIsoDateTime,
  direction: parseAsArrayOf(
    parseAsStringLiteral(communicationDirectionSchema),
  ).withDefault([...communicationDirectionSchema]),
  participantType: parseAsArrayOf(
    parseAsStringLiteral(communicationParticipantTypeSchema),
  ).withDefault([...communicationParticipantTypeSchema]),
  channel: parseAsArrayOf(
    parseAsStringLiteral(communicationChannels),
  ).withDefault([...communicationChannels]),
  customer: parseAsArrayOf(parseAsString),
  member: parseAsArrayOf(parseAsString),
  appointmentId: parseAsString,
  sort: baseSearchParams.sort.withDefault([
    {
      id: "dateTime",
      desc: true,
    },
  ]),
};

export const communicationLogsSearchParamsCache = createSearchParamsCache(
  communicationLogsSearchParams,
);

export const serializeCommunicationLogsSearchParams = createSerializer(
  communicationLogsSearchParams,
);

export const communicationLogsSearchParamsSchema = createStandardSchemaV1(
  communicationLogsSearchParams,
);

export type CommunicationLogsSearchParams = Partial<
  inferParserType<typeof communicationLogsSearchParams>
>;

export const communicationLogsSearchParamsLoader = createLoader(
  communicationLogsSearchParams,
);
