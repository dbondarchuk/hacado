import { FormControl, FormField, FormItem } from "../form";
import { Input } from "../input";

import { FieldFileData, WithLabelFieldData } from "@hacado/types";
import { FieldValues } from "react-hook-form";
import { FormFieldDescription } from "./form-field-description";
import { FormFieldErrorMessage } from "./form-field-error-message";
import { FormFieldLabel } from "./form-field-label";
import { getFieldName, IFormFieldProps } from "./form-field.types";

export const FileField: <T extends FieldValues>(
  p: IFormFieldProps<T, WithLabelFieldData & FieldFileData>,
) => React.ReactElement<
  IFormFieldProps<T, WithLabelFieldData & FieldFileData>
> = (props) => {
  return (
    <FormField
      control={props.control}
      name={getFieldName(props)}
      render={({ field: { value, ...field } }) => (
        <FormItem>
          <FormFieldLabel label={props.data.label} required={props.required} />
          <FormControl>
            <Input
              {...field}
              placeholder="Please select file"
              type="file"
              accept={props.data.accept?.join(",")}
              onChange={(event) => {
                field.onChange(event.target?.files?.[0]);
                field.onBlur();
                props.afterChange?.(event.target?.files?.[0]);
              }}
              disabled={field.disabled || props.disabled}
            />
          </FormControl>
          <FormFieldDescription description={props.data?.description} />
          <FormFieldErrorMessage />
        </FormItem>
      )}
    />
  );
};
