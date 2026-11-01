import type { IServicesContainer } from "@hacado/types/services";
import { processSmsVerificationCoreJob } from "./sms-verification";

export type CoreJobProcessorContext = {
  organizationId: string;
  jobId: string;
  services: IServicesContainer;
  payload: unknown;
};

export type CoreJobProcessor = (ctx: CoreJobProcessorContext) => Promise<void>;

/** BuiltInApps-style map: core requestType → processor. */
export const CoreJobProcessors: Record<string, CoreJobProcessor> = {
  "sms-verification": processSmsVerificationCoreJob,
};
