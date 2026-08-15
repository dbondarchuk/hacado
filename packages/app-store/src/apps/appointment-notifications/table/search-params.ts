import {
  createSerializer,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs";

import { baseSearchParams } from "@hacado/api-sdk";
import { communicationChannels } from "@hacado/types";
import { appointmentNotificationTypes } from "../models";

export const searchParams = {
  ...baseSearchParams,
  channel: parseAsArrayOf(
    parseAsStringEnum(communicationChannels.flat()),
  ).withDefault(communicationChannels.flat()),
  type: parseAsArrayOf(
    parseAsStringEnum(appointmentNotificationTypes.flat()),
  ).withDefault(appointmentNotificationTypes.flat()),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "updatedAt",
      desc: true,
    },
  ]),
  ts: parseAsString,
};

export const serialize = createSerializer(searchParams);
