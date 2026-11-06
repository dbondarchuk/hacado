import {
  createSerializer,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs";

import { baseSearchParams } from "@hacado/api-sdk/admin/search-params/base";
import { communicationChannels } from "@hacado/types/communication";
import { appointmentReminderTypes } from "../models";

export const searchParams = {
  ...baseSearchParams,
  channel: parseAsArrayOf(
    parseAsStringEnum(communicationChannels.flat()),
  ).withDefault(communicationChannels.flat()),
  type: parseAsArrayOf(
    parseAsStringEnum(appointmentReminderTypes.flat()),
  ).withDefault(appointmentReminderTypes.flat()),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "updatedAt",
      desc: true,
    },
  ]),
  ts: parseAsString,
};

export const serialize = createSerializer(searchParams);
