import {
  Job,
  JobRequest,
  RepeatableJobOptions,
  ScheduleRepeatableJobRequest,
} from "../jobs";

export interface IJobService {
  scheduleJob(job: JobRequest): Promise<Job>;
  scheduleRepeatableJob(
    job: ScheduleRepeatableJobRequest,
    repeat: RepeatableJobOptions,
  ): Promise<void>;
  removeRepeatableJob(id: string): Promise<void>;
  getJob(id: string): Promise<Job | null>;
  getDeduplicatedJob(deduplicationId: string): Promise<Job | null>;
  removeDeduplicationKey(deduplicationId: string): Promise<void>;
  getJobs(): Promise<Job[]>;
  cancelJob(id: string): Promise<void>;
}
