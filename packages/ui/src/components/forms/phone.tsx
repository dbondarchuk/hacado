import React from "react";
import { FormControl, FormField, FormItem } from "../form";
import { PhoneInput } from "../phone-input";

import { FieldValues } from "react-hook-form";
import { getFieldName, IFormFieldProps } from "./form-field.types";

import { useI18n } from "@timelish/i18n/client";
import { WithLabelFieldData } from "@timelish/types";
import { FormFieldDescription } from "./form-field-description";
import { FormFieldErrorMessage } from "./form-field-error-message";
import { FormFieldLabel } from "./form-field-label";

export const PhoneField: <T extends FieldValues>(
  p: IFormFieldProps<T, WithLabelFieldData>,
) => React.ReactElement<IFormFieldProps<T, WithLabelFieldData>> = (props) => {
  const i18n = useI18n("translation");
  return (
    <FormField
      control={props.control}
      name={getFieldName(props)}
      render={({ field }) => (
        <FormItem>
          <FormFieldLabel
            label={props.data?.label || "common.labels.formPhone"}
            required={props.required}
          />
          <FormControl>
            <PhoneInput
              {...field}
              label={i18n("common.labels.formPhone")}
              disabled={field.disabled || props.disabled}
              onChange={(e) => {
                field.onChange(e);
                props.afterChange?.(e.target.value);
              }}
            />
          </FormControl>
          <FormFieldDescription description={props.data?.description} />
          <FormFieldErrorMessage />
        </FormItem>
      )}
    />
  );
};
