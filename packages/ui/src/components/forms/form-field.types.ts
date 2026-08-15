import { FieldData } from "@hacado/types";
import { Control, FieldPath, FieldValues } from "react-hook-form";

export type IFormFieldProps<
  T extends FieldValues,
  TData extends Record<string, any> = any,
> = FieldData<TData> & {
  control: Control<T, any>;
  name: FieldPath<T>;
  namespace?: string;
  disabled?: boolean;
  afterChange?: (value: any) => void;
};

export const getFieldName = <T extends FieldValues>({
  name,
  namespace,
}: IFormFieldProps<T>): FieldPath<T> =>
  [namespace, name].filter((x) => !!x).join(".") as FieldPath<T>;
