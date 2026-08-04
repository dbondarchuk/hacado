"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  Switch,
} from "@timelish/ui";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

type ProcessOtherMembersAppointmentsFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name?: FieldPath<T>;
  label: string;
  description: string;
  isLoading?: boolean;
};

export function ProcessOtherMembersAppointmentsField<T extends FieldValues>({
  control,
  name = "processOtherMembersAppointments" as FieldPath<T>,
  label,
  description,
  isLoading,
}: ProcessOtherMembersAppointmentsFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between gap-4 w-full rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={isLoading}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
