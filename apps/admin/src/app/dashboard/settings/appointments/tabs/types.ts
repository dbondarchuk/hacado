import { BookingConfiguration } from "@hacado/types";
import { UseFormReturn } from "react-hook-form";

export type TabProps = {
  form: UseFormReturn<BookingConfiguration>;
  disabled?: boolean;
  /** Studio plan (or equivalent) — show multi-user booking settings. */
  showTeamSettings?: boolean;
};
