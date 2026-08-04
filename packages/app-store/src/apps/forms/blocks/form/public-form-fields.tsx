"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  Checkbox,
  FormControl,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
  Input,
  PhoneInput,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@timelish/ui";
import React from "react";
import { ControllerRenderProps } from "react-hook-form";
import { FormModel } from "../../models";
import { FormsFieldType } from "../../models/fields";
import {
  FormsPublicKeys,
  FormsPublicNamespace,
  formsPublicNamespace,
} from "../../translations/types";

export type FormFieldDef = FormModel["fields"][number];
export type PublicFieldProps<T extends FormsFieldType = FormsFieldType> = {
  field: ControllerRenderProps<any, `answers.${string}`>;
  fieldDef: FormFieldDef & { type: T };
  disabled?: boolean;
};

const getOptions = (
  fieldDef: FormFieldDef & { data?: { options: { option: string }[] } },
) => fieldDef.data?.options ?? [];

const CheckboxField: React.FC<PublicFieldProps<"checkbox">> = ({
  field,
  fieldDef,
  disabled,
}) => (
  <FormItem
    className={`forms-form-item forms-checkbox-field forms-field-${fieldDef.name}`}
  >
    <FormControl
      className={`forms-form-control forms-checkbox-control forms-field-${fieldDef.name}-control`}
    >
      <div
        className={`flex items-center gap-2 forms-checkbox-content forms-field-${fieldDef.name}-content`}
      >
        <Checkbox
          id={`form-field-${fieldDef.name}`}
          checked={field.value === true}
          onCheckedChange={(v) => field.onChange(!!v)}
          className={`forms-checkbox-input forms-field-${fieldDef.name}-input`}
          disabled={disabled}
        />
        <FormLabelWithRequiredIndicator
          required={fieldDef.required}
          htmlFor={`form-field-${fieldDef.name}`}
          className={`forms-label forms-checkbox-label ${fieldDef.required ? "forms-label-required" : ""} forms-field-${fieldDef.name}-label`}
        >
          {fieldDef.label}
        </FormLabelWithRequiredIndicator>
      </div>
    </FormControl>
    <FormMessage
      className={`forms-form-message forms-checkbox-message forms-field-${fieldDef.name}-message`}
    />
  </FormItem>
);

const TextField: React.FC<PublicFieldProps<"name" | "email" | "oneLine">> = ({
  field,
  fieldDef,
  disabled,
}) => (
  <FormItem
    className={`forms-form-item forms-text-field forms-field-${fieldDef.name}`}
  >
    <FormLabelWithRequiredIndicator
      required={fieldDef.required}
      className={`forms-label forms-text-label ${fieldDef.required ? "forms-label-required" : ""} forms-field-${fieldDef.name}-label`}
    >
      {fieldDef.label}
    </FormLabelWithRequiredIndicator>
    <FormControl
      className={`forms-form-control forms-text-control forms-field-${fieldDef.name}-control`}
    >
      <Input
        type={fieldDef.type === "email" ? "email" : "text"}
        {...field}
        className={`forms-text-input forms-field-${fieldDef.name}-input`}
        disabled={disabled}
      />
    </FormControl>
    <FormMessage
      className={`forms-form-message forms-text-message forms-field-${fieldDef.name}-message`}
    />
  </FormItem>
);

const MultiLineField: React.FC<PublicFieldProps<"multiLine">> = ({
  field,
  fieldDef,
  disabled,
}) => (
  <FormItem
    className={`forms-form-item forms-multiLine-field forms-field-${fieldDef.name}`}
  >
    <FormLabelWithRequiredIndicator
      required={fieldDef.required}
      className={`forms-label forms-multiLine-label ${fieldDef.required ? "forms-label-required" : ""} forms-field-${fieldDef.name}-label`}
    >
      {fieldDef.label}
    </FormLabelWithRequiredIndicator>
    <FormControl
      className={`forms-form-control forms-multiLine-control forms-field-${fieldDef.name}-control`}
    >
      <Textarea
        {...field}
        className={`forms-multiLine-input forms-field-${fieldDef.name}-input`}
        disabled={disabled}
      />
    </FormControl>
    <FormMessage
      className={`forms-form-message forms-multiLine-message forms-field-${fieldDef.name}-message`}
    />
  </FormItem>
);

const PhoneField: React.FC<PublicFieldProps<"phone">> = ({
  field,
  fieldDef,
  disabled,
}) => (
  <FormItem
    className={`forms-form-item forms-phone-field forms-field-${fieldDef.name}`}
  >
    <FormLabelWithRequiredIndicator
      required={fieldDef.required}
      className={`forms-label forms-phone-label ${fieldDef.required ? "forms-label-required" : ""} forms-field-${fieldDef.name}-label`}
    >
      {fieldDef.label}
    </FormLabelWithRequiredIndicator>
    <FormControl
      className={`forms-form-control forms-phone-control forms-field-${fieldDef.name}-control`}
    >
      <PhoneInput
        label={fieldDef.label}
        {...field}
        className={`forms-phone-input forms-field-${fieldDef.name}-input`}
        disabled={disabled}
      />
    </FormControl>
    <FormMessage
      className={`forms-form-message forms-phone-message forms-field-${fieldDef.name}-message`}
    />
  </FormItem>
);

const SelectField: React.FC<PublicFieldProps<"select">> = ({
  field,
  fieldDef,
  disabled,
}) => {
  const t = useI18n<FormsPublicNamespace, FormsPublicKeys>(
    formsPublicNamespace,
  );
  const options = getOptions(fieldDef);
  return (
    <FormItem
      className={`forms-form-item forms-select-field forms-field-${fieldDef.name}`}
    >
      <FormLabelWithRequiredIndicator
        required={fieldDef.required}
        className={`forms-label forms-select-label ${fieldDef.required ? "forms-label-required" : ""} forms-field-${fieldDef.name}-label`}
      >
        {fieldDef.label}
      </FormLabelWithRequiredIndicator>
      <Select
        value={(field.value as string) ?? ""}
        onValueChange={field.onChange}
        disabled={disabled}
      >
        <FormControl
          className={`forms-form-control forms-select-control forms-field-${fieldDef.name}-control`}
        >
          <SelectTrigger
            className={`forms-select-trigger forms-field-${fieldDef.name}-trigger`}
          >
            <SelectValue
              placeholder={t("responses.fields.select.placeholder")}
              className={`forms-select-value forms-field-${fieldDef.name}-value`}
            />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {!fieldDef.required && (
            <SelectItem value={null as unknown as string}>
              {t("responses.fields.select.noneOption")}
            </SelectItem>
          )}
          {options.map((o) => (
            <SelectItem
              key={o.option}
              value={o.option}
              className={`forms-select-item forms-select-${fieldDef.name}-item forms-field-${fieldDef.name}-item-${o.option.toLowerCase().replace(/\s/g, "-")}`}
            >
              {o.option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage
        className={`forms-form-message forms-select-message forms-field-${fieldDef.name}-message`}
      />
    </FormItem>
  );
};

const RadioField: React.FC<PublicFieldProps<"radio">> = ({
  field,
  fieldDef,
  disabled,
}) => {
  const t = useI18n<FormsPublicNamespace, FormsPublicKeys>(
    formsPublicNamespace,
  );
  const options = getOptions(fieldDef);
  return (
    <FormItem
      className={`forms-form-item forms-radio-field forms-field-${fieldDef.name}`}
    >
      <FormLabelWithRequiredIndicator
        required={fieldDef.required}
        className={`forms-label forms-radio-label ${fieldDef.required ? "forms-label-required" : ""} forms-field-${fieldDef.name}-label`}
      >
        {fieldDef.label}
      </FormLabelWithRequiredIndicator>
      <FormControl
        className={`forms-form-control forms-radio-control forms-field-${fieldDef.name}-control`}
      >
        <RadioGroup
          value={(field.value as string) ?? ""}
          onValueChange={field.onChange}
          className={`flex flex-col gap-2 forms-radio-content forms-field-${fieldDef.name}-content`}
          disabled={disabled}
        >
          {!fieldDef.required && (
            <div
              className={`flex items-center gap-2 forms-radio-content forms-field-${fieldDef.name}-content`}
            >
              <RadioGroupItem
                value=""
                id={`${fieldDef.name}-none`}
                className={`forms-radio-item forms-field-${fieldDef.name}-item forms-field-${fieldDef.name}-item-none`}
                disabled={disabled}
              />
              <FormLabel
                htmlFor={`${fieldDef.name}-none`}
                className={`font-normal forms-label forms-radio-label-none forms-field-${fieldDef.name}-label forms-field-${fieldDef.name}-label-none`}
              >
                {t("responses.fields.select.noneOption")}
              </FormLabel>
            </div>
          )}
          {options.map((o) => (
            <div
              key={o.option}
              className={`flex items-center gap-2 forms-radio-content forms-field-${fieldDef.name}-content`}
            >
              <RadioGroupItem
                value={o.option}
                id={`${fieldDef.name}-${o.option}`}
                className={`forms-radio-item forms-field-${fieldDef.name}-item forms-field-${fieldDef.name}-item-${o.option.toLowerCase().replace(/\s/g, "-")}`}
                disabled={disabled}
              />
              <FormLabel
                htmlFor={`${fieldDef.name}-${o.option}`}
                className={`font-normal forms-label forms-radio-label forms-field-${fieldDef.name}-label forms-field-${fieldDef.name}-label-${o.option.toLowerCase().replace(/\s/g, "-")}`}
              >
                {o.option}
              </FormLabel>
            </div>
          ))}
        </RadioGroup>
      </FormControl>
      <FormMessage
        className={`forms-form-message forms-radio-message forms-field-${fieldDef.name}-message`}
      />
    </FormItem>
  );
};

const MultiSelectField: React.FC<PublicFieldProps<"multiSelect">> = ({
  field,
  fieldDef,
  disabled,
}) => {
  const options = getOptions(fieldDef);
  const arr: string[] = Array.isArray(field.value) ? field.value : [];
  const toggle = (option: string) => {
    const next = arr.includes(option)
      ? arr.filter((x) => x !== option)
      : [...arr, option];
    field.onChange(next);
  };
  const maxSelected = (fieldDef.data as { maxSelected?: number })?.maxSelected;
  return (
    <FormItem
      className={`forms-form-item forms-multiSelect-field forms-field-${fieldDef.name}`}
    >
      <FormLabelWithRequiredIndicator
        required={fieldDef.required}
        className={`forms-label forms-multiSelect-label ${fieldDef.required ? "forms-label-required" : ""} forms-field-${fieldDef.name}-label`}
      >
        {fieldDef.label}
      </FormLabelWithRequiredIndicator>
      <FormControl
        className={`forms-form-control forms-multiSelect-control forms-field-${fieldDef.name}-control`}
      >
        <div
          className={`flex flex-col gap-2 forms-multiSelect-content forms-field-${fieldDef.name}-content`}
        >
          {options.map((o, index) => {
            const isChecked = arr.includes(o.option);
            const isDisabled =
              disabled ||
              (!isChecked && !!maxSelected && arr.length >= maxSelected);
            return (
              <div key={o.option} className="flex items-center gap-2">
                <Checkbox
                  id={`${fieldDef.name}-${index}`}
                  checked={isChecked}
                  disabled={isDisabled}
                  onCheckedChange={() => toggle(o.option)}
                  className={`forms-multiSelect-option forms-field-${fieldDef.name}-option forms-field-${fieldDef.name}-option-${o.option.toLowerCase().replace(/\s/g, "-")}`}
                />
                <FormLabel
                  htmlFor={`${fieldDef.name}-${index}`}
                  className={`font-normal forms-label forms-multiSelect-label forms-field-${fieldDef.name}-label forms-field-${fieldDef.name}-label-${o.option.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {o.option}
                </FormLabel>
              </div>
            );
          })}
        </div>
      </FormControl>
      <FormMessage
        className={`forms-form-message forms-multiSelect-message forms-field-${fieldDef.name}-message`}
      />
    </FormItem>
  );
};

const FileField: React.FC<PublicFieldProps<"file">> = ({
  field,
  fieldDef,
  disabled,
}) => {
  const data = fieldDef.data as { accept?: string[]; maxSizeMb?: number };
  const accept = data?.accept?.join(",");
  return (
    <FormItem
      className={`forms-form-item forms-file-field forms-field-${fieldDef.name}`}
    >
      <FormLabelWithRequiredIndicator
        required={fieldDef.required}
        htmlFor={fieldDef.name}
        className={`forms-label forms-file-label ${fieldDef.required ? "forms-label-required" : ""} forms-field-${fieldDef.name}-label`}
      >
        {fieldDef.label}
      </FormLabelWithRequiredIndicator>
      <FormControl
        className={`forms-form-control forms-file-control forms-field-${fieldDef.name}-control`}
      >
        <Input
          type="file"
          id={fieldDef.name}
          name={fieldDef.name}
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            field.onChange(file ?? null);
          }}
          ref={field.ref}
          className={`forms-file-input forms-field-${fieldDef.name}-input`}
          disabled={disabled}
        />
      </FormControl>
      <FormMessage
        className={`forms-form-message forms-file-message forms-field-${fieldDef.name}-message`}
      />
    </FormItem>
  );
};

const PublicFieldComponents: Record<
  FormsFieldType,
  React.FC<PublicFieldProps<any>>
> = {
  checkbox: CheckboxField,
  multiLine: MultiLineField,
  radio: RadioField,
  select: SelectField,
  multiSelect: MultiSelectField,
  oneLine: TextField,
  file: FileField,
  name: TextField,
  email: TextField,
  phone: PhoneField,
};

export function getPublicFieldComponent(
  type: FormsFieldType,
): React.FC<PublicFieldProps<any>> {
  return PublicFieldComponents[type] ?? TextField;
}
