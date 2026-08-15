import { FormControl, FormField, FormItem } from "../form";
import { Textarea } from "../textarea";

import { WithLabelFieldData } from "@hacado/types";
import { FieldValues } from "react-hook-form";
import { FormFieldDescription } from "./form-field-description";
import { FormFieldErrorMessage } from "./form-field-error-message";
import { FormFieldLabel } from "./form-field-label";
import { getFieldName, IFormFieldProps } from "./form-field.types";

export const MultiLineField: <T extends FieldValues>(
  p: IFormFieldProps<T, WithLabelFieldData>,
) => React.ReactElement<IFormFieldProps<T, WithLabelFieldData>> = (props) => (
  <FormField
    control={props.control}
    name={getFieldName(props)}
    render={({ field }) => (
      <FormItem>
        <FormFieldLabel label={props.data.label} required={props.required} />
        <FormControl>
          <Textarea
            {...field}
            placeholder="Type your response here"
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
