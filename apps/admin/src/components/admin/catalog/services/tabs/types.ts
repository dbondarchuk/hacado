import type { getAppointmentOptionSchemaWithUniqueCheck } from "@hacado/types/booking";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

export type TabProps = {
  form: UseFormReturn<
    z.infer<ReturnType<typeof getAppointmentOptionSchemaWithUniqueCheck>>
  >;
  disabled?: boolean;
};
