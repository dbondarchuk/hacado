import { FormControl, FormField, FormItem } from "../form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

import { FieldOptionsData, WithLabelFieldData } from "@hacado/types";
import { FieldValues } from "react-hook-form";
import { FormFieldLabel } from "./form-field-label";
import { getFieldName, IFormFieldProps } from "./form-field.types";

import { FormFieldDescription } from "./form-field-description";
import { FormFieldErrorMessage } from "./form-field-error-message";

export const SelectField: <T extends FieldValues>(
  p: IFormFieldProps<T, WithLabelFieldData & FieldOptionsData>,
) => React.ReactElement<
  IFormFieldProps<T, WithLabelFieldData & FieldOptionsData>
> = (props) => (
  <FormField
    control={props.control}
    name={getFieldName(props)}
    render={({ field }) => (
      <FormItem>
        <FormFieldLabel label={props.data.label} required={props.required} />
        <FormControl>
          <Select
            onValueChange={(e) => {
              field.onChange(e);
              field.onBlur();
              props.afterChange?.(e);
            }}
            defaultValue={field.value}
            disabled={field.disabled || props.disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Please select the option" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {/* @ts-ignore-error Clear value */}
              <SelectItem value={null}>Not selected</SelectItem>
              {props.data.options.map(({ option }) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormControl>
        <FormFieldDescription description={props.data?.description} />
        <FormFieldErrorMessage />
      </FormItem>
    )}
  />
);
