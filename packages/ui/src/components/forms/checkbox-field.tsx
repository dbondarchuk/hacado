import { FormControl, FormField } from "../form";

import { WithLabelFieldData } from "@hacado/types";
import { FieldValues } from "react-hook-form";
import { Checkbox } from "../checkbox";
import { FormFieldDescription } from "./form-field-description";
import { FormFieldErrorMessage } from "./form-field-error-message";
import { FormFieldLabel } from "./form-field-label";
import { getFieldName, IFormFieldProps } from "./form-field.types";

export const CheckboxField: <T extends FieldValues>(
  p: IFormFieldProps<T, WithLabelFieldData>,
) => React.ReactElement<IFormFieldProps<T, WithLabelFieldData>> = (props) => (
  <FormField
    control={props.control}
    name={getFieldName(props)}
    render={({ field }) => (
      <div className="flex flex-row items-center gap-3 mt-5">
        <div>
          <FormControl>
            <Checkbox
              id={`field-${getFieldName(props)}`}
              checked={field.value}
              disabled={field.disabled || props.disabled}
              onCheckedChange={(e) => {
                field.onChange(e);
                field.onBlur();
                props.afterChange?.(e);
              }}
            />
          </FormControl>
        </div>
        <div className="flex flex-col gap-1 leading-none">
          <FormFieldLabel
            label={props.data.label}
            required={props.required}
            className="mt-0"
            htmlFor={`field-${getFieldName(props)}`}
          />
          <FormFieldDescription description={props.data?.description} />
          <FormFieldErrorMessage />
        </div>
      </div>
    )}
  />
);
