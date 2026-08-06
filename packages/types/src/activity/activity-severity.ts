import * as z from "zod";

export const activitySeveritySchema = z.enum([
  "info",
  "success",
  "warning",
  "error",
]);

export type ActivitySeverity = z.infer<typeof activitySeveritySchema>;
