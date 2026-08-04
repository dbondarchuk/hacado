import { useI18n } from "@timelish/i18n/client";
import {
  Checkbox,
  FormControl,
  FormItem,
  FormLabel,
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
import { AssetPreview, AssetSelectorInput } from "@timelish/ui-admin";
import { fileNameToMimeType } from "@timelish/utils";
import { FC } from "react";
import { ControllerRenderProps } from "react-hook-form";
import { FormsFieldType } from "../../models/fields";
import { FormModel } from "../../models/form";
import {
  FormsPublicKeys,
  FormsPublicNamespace,
  formsPublicNamespace,
} from "../../translations/types";

export type FormFieldDef = FormModel["fields"][number];
export type AnswerFieldProps<T extends FormsFieldType> = {
  field: ControllerRenderProps<any, `answers.${string}`>;
  fieldDef: FormFieldDef & { type: T };
  disabled?: boolean;
};

const getOptions = (
  fieldDef: FormFieldDef & { data?: { options: { option: string }[] } },
) => {
  return fieldDef.data?.options ?? [];
};

const CheckboxField: React.FC<AnswerFieldProps<"checkbox">> = ({
  field,
  fieldDef,
  disabled,
}) => {
  return (
    <FormItem>
      <FormControl>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`answer-${fieldDef.name}`}
            checked={field.value === true}
            disabled={disabled}
            onCheckedChange={(checked) => {
              field.onChange(!!checked);
              field.onBlur();
            }}
          />
          <FormLabel
            htmlFor={`answer-${fieldDef.name}`}
            className="font-normal cursor-pointer"
          >
            {fieldDef.label}
          </FormLabel>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

const MultiLineField: React.FC<AnswerFieldProps<"multiLine">> = ({
  field,
  fieldDef,
  disabled,
}) => {
  return (
    <FormItem>
      <FormLabel>{fieldDef.label}</FormLabel>
      <FormControl>
        <Textarea autoResize {...field} disabled={disabled} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

const RadioField: React.FC<AnswerFieldProps<"radio">> = ({
  field,
  fieldDef,
  disabled,
}) => {
  const t = useI18n<FormsPublicNamespace, FormsPublicKeys>(
    formsPublicNamespace,
  );

  const options = getOptions(fieldDef);

  return (
    <FormItem>
      <FormLabel>{fieldDef.label}</FormLabel>
      <FormControl>
        <RadioGroup
          value={field.value ?? ""}
          onValueChange={(v) => {
            field.onChange(v);
            field.onBlur();
          }}
          disabled={disabled}
          className="flex flex-col gap-2"
        >
          {!fieldDef.required && (
            <div key="none" className="flex items-center gap-2">
              <RadioGroupItem value="" id={`answer-${fieldDef.name}-none`} />
              <FormLabel
                htmlFor={`answer-${fieldDef.name}-none`}
                className="font-normal cursor-pointer"
              >
                {t("responses.fields.select.noneOption")}
              </FormLabel>
            </div>
          )}
          {options.map((o) => (
            <div key={o.option} className="flex items-center gap-2">
              <RadioGroupItem
                value={o.option}
                id={`answer-${fieldDef.name}-${o.option}`}
              />
              <FormLabel
                htmlFor={`answer-${fieldDef.name}-${o.option}`}
                className="font-normal cursor-pointer"
              >
                {o.option}
              </FormLabel>
            </div>
          ))}
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

const SelectField: React.FC<AnswerFieldProps<"select">> = ({
  field,
  fieldDef,
  disabled,
}) => {
  const t = useI18n<FormsPublicNamespace, FormsPublicKeys>(
    formsPublicNamespace,
  );
  const options = getOptions(fieldDef);

  return (
    <FormItem>
      <FormLabel>{fieldDef.label}</FormLabel>
      <FormControl>
        <Select
          value={typeof field.value === "string" ? field.value : ""}
          onValueChange={(v) => {
            field.onChange(v);
            field.onBlur();
          }}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={t("responses.fields.select.placeholder")}
            />
          </SelectTrigger>
          <SelectContent>
            {!fieldDef.required && (
              <SelectItem value={null as unknown as string}>
                {t("responses.fields.select.noneOption")}
              </SelectItem>
            )}
            {options.map((o) => (
              <SelectItem key={o.option} value={o.option}>
                {o.option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

const MultiSelectField: React.FC<AnswerFieldProps<"multiSelect">> = ({
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
    field.onBlur();
  };

  const maxSelected = fieldDef.data?.maxSelected ?? undefined;

  return (
    <FormItem>
      <FormLabel>{fieldDef.label}</FormLabel>
      <FormControl>
        <div className="flex flex-col gap-2">
          {options.map((o) => {
            const isChecked = arr.includes(o.option);
            const isDisabled =
              disabled ||
              (!isChecked && !!maxSelected && arr.length >= maxSelected);

            return (
              <div key={o.option} className="flex items-center gap-2">
                <Checkbox
                  id={`answer-${fieldDef.name}-${o.option}`}
                  checked={isChecked}
                  disabled={isDisabled}
                  onCheckedChange={() => toggle(o.option)}
                />
                <FormLabel
                  htmlFor={`answer-${fieldDef.name}-${o.option}`}
                  className="font-normal cursor-pointer"
                >
                  {o.option}
                </FormLabel>
              </div>
            );
          })}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

const TextField: React.FC<AnswerFieldProps<"name" | "email" | "oneLine">> = ({
  field,
  fieldDef,
  disabled,
}) => {
  return (
    <FormItem>
      <FormLabel>{fieldDef.label}</FormLabel>
      <FormControl>
        <Input
          type={fieldDef.type === "email" ? "email" : "text"}
          {...field}
          disabled={disabled}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

const PhoneField: React.FC<AnswerFieldProps<"phone">> = ({
  field,
  fieldDef,
  disabled,
}) => {
  return (
    <FormItem>
      <FormLabel>{fieldDef.label}</FormLabel>
      <FormControl>
        <PhoneInput label={fieldDef.label} {...field} disabled={disabled} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

const FileField: React.FC<AnswerFieldProps<"file">> = ({
  field,
  fieldDef,
  disabled,
}) => {
  const mimeType = field.value ? fileNameToMimeType(field.value) : undefined;
  return (
    <FormItem>
      <FormLabel>{fieldDef.label}</FormLabel>
      <FormControl>
        {/* <Input
          type="file"
          {...field}
          value={undefined}
          disabled={disabled}
          accept={
            fieldDef.type === "file"
              ? fieldDef.data?.accept?.join(",")
              : undefined
          }
          onChange={(e) => {
            field.onChange(e.target.files?.[0]);
            field.onBlur();
          }}
        /> */}
        <div className="flex flex-col gap-4">
          <AssetSelectorInput
            value={field.value}
            onChange={(value) => {
              field.onChange(value.replace(/^\/assets\//, ""));
              field.onBlur();
            }}
            disabled={disabled}
            disabledInput
            accept={fieldDef.data?.accept?.join(",")}
          />
          {field.value && mimeType && (
            <AssetPreview
              size="md"
              asset={{
                filename: field.value.replace(/^\/assets\//, ""),
                mimeType,
                size: 0,
                uploadedAt: new Date(),
                hash: "",
                _id: "",
                organizationId: "",
              }}
            />
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

export const AnswerFields: Record<FormsFieldType, FC<AnswerFieldProps<any>>> = {
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
