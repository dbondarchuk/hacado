import { okStatus } from "@hacado/types";
import {
  dismissWaitlistEntries,
  getWaitlistEntry as getWaitlistEntryAction,
} from "../../actions";

export const dismissWaitlistEntry = async (appId: string, id: string) => {
  await dismissWaitlistEntries(appId, [id]);
  return okStatus;
};

export const getWaitlistEntry = async (appId: string, id: string) => {
  const entry = await getWaitlistEntryAction(appId, id);
  return entry;
};
