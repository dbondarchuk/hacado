import { useI18n } from "@hacado/i18n/client";
import { PlateMarkdownEditor } from "@hacado/rte";
import { fileFieldAcceptItemSchema } from "@hacado/types";
import {
  BooleanSelect,
  Button,
  Combobox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TagInput,
} from "@hacado/ui";
import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import {
  defaultMultiLineLength,
  defaultOneLineLength,
  formSchemaBase,
  formsFieldTypes,
} from "../../models";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { SelectField } from "./select/select-field";

const fileTypes = {
  "image/*": "Images",
  "video/*": "Videos",
  "audio/*": "Audios",
  ".doc,.docx,.pdf": "Documents",
};

const FileTypePickerTag = ({
  onAdd,
}: {
  onAdd: (value: string | string[]) => void;
}) => {
  const t = useI18n("admin");
  const [value, setValue] = useState<keyof typeof fileTypes | undefined>(
    "image/*",
  );

  return (
    <div className="flex flex-col gap-2 p-3">
      <Select
        value={value}
        onValueChange={(value) => {
          setValue(value as keyof typeof fileTypes);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("services.fields.form.fileTypes")} />
        </SelectTrigger>
        <SelectContent side="bottom">
          {Object.entries(fileTypes).map(([step, label]) => (
            <SelectItem key={step} value={step}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="default"
        className="w-full"
        onClick={() => {
          if (!value) return;

          onAdd(value.split(","));
        }}
      >
        {t("services.fields.form.addOption")}
      </Button>
    </div>
  );
};

export const FormFieldEditor: React.FC<{
  form: UseFormReturn<z.infer<typeof formSchemaBase>>;
  name: `fields.${number}`;
  disabled?: boolean;
}> = ({ form, name: fieldName, disabled }) => {
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  const field = form.watch(fieldName);
  const fieldMaxLength =
    "data" in field && "maxLength" in field.data
      ? field.data?.maxLength
      : undefined;
  const fieldType = field.type;

  useEffect(() => {
    if (fieldType === "oneLine" || fieldType === "multiLine") {
      const maxLength =
        fieldType === "oneLine" ? defaultOneLineLength : defaultMultiLineLength;
      if (
        (fieldType === "oneLine" && fieldMaxLength == defaultMultiLineLength) ||
        (fieldType === "multiLine" && fieldMaxLength == defaultOneLineLength)
      ) {
        form.setValue(`${fieldName}.data.maxLength`, maxLength);
      }
    }
  }, [fieldType, form, fieldName, fieldMaxLength]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        <FormField
          control={form.control}
          name={`${fieldName}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("form.fields.name.label")}{" "}
                <InfoTooltip>{t("form.fields.name.description")}</InfoTooltip>
              </FormLabel>

              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder={t("form.fields.name.placeholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${fieldName}.label`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("form.fields.label.label")}{" "}
                <InfoTooltip>{t("form.fields.label.description")}</InfoTooltip>
              </FormLabel>
              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder={t("form.fields.label.placeholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${fieldName}.type`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("form.fields.type.label")}{" "}
                <InfoTooltip>{t("form.fields.type.description")}</InfoTooltip>
              </FormLabel>
              <FormControl>
                <Combobox
                  disabled={disabled}
                  className="flex w-full font-normal text-base"
                  values={formsFieldTypes.map((type) => ({
                    value: type,
                    label: t(`form.fields.type.labels.${type}`),
                  }))}
                  searchLabel={t("form.fields.type.placeholder")}
                  value={field.value}
                  onItemSelect={(item) => {
                    field.onChange(item);
                    field.onBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${fieldName}.required`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("form.fields.required.label")}{" "}
                <InfoTooltip>
                  {t("form.fields.required.description")}
                </InfoTooltip>
              </FormLabel>
              <FormControl>
                <BooleanSelect
                  value={field.value ?? false}
                  disabled={disabled}
                  onValueChange={(value) => {
                    field.onChange(value);
                    field.onBlur();
                  }}
                  className="w-full"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      {fieldType === "file" && (
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
          <FormField
            control={form.control}
            name={`${fieldName}.data.maxSizeMb`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("form.fields.file.maxSizeMb.label")}{" "}
                  <InfoTooltip>
                    {t("form.fields.file.maxSizeMb.description")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupInput>
                      <Input
                        disabled={disabled}
                        placeholder={t(
                          "form.fields.file.maxSizeMb.placeholder",
                        )}
                        type="number"
                        className={InputGroupInputClasses()}
                        {...field}
                      />
                    </InputGroupInput>
                    <InputGroupAddon className={InputGroupAddonClasses()}>
                      MB
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`${fieldName}.data.accept`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("form.fields.file.accept.label")}{" "}
                  <InfoTooltip>
                    {t("form.fields.file.accept.description")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <TagInput
                    {...field}
                    readOnly
                    placeholder={t("form.fields.file.accept.placeholder")}
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e);
                      field.onBlur();
                    }}
                    tagValidator={fileFieldAcceptItemSchema}
                    addItemTemplate={FileTypePickerTag}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
      {(fieldType === "select" ||
        fieldType === "radio" ||
        fieldType === "multiSelect") && (
        <SelectField form={form} name={fieldName} disabled={disabled} />
      )}
      {fieldType === "multiSelect" && (
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
          <FormField
            control={form.control}
            name={`${fieldName}.data.minSelected`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("form.fields.multiSelect.minSelected.label")}
                  <InfoTooltip>
                    {t("form.fields.multiSelect.minSelected.description")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupInput>
                      <Input
                        disabled={disabled}
                        placeholder={t(
                          "form.fields.multiSelect.minSelected.placeholder",
                        )}
                        type="number"
                        className={InputGroupInputClasses()}
                        {...field}
                      />
                    </InputGroupInput>
                    <InputGroupAddon className={InputGroupAddonClasses()}>
                      {t("form.fields.multiSelect.choices")}
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${fieldName}.data.maxSelected`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("form.fields.multiSelect.maxSelected.label")}
                  <InfoTooltip>
                    {t("form.fields.multiSelect.maxSelected.description")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupInput>
                      <Input
                        disabled={disabled}
                        placeholder={t(
                          "form.fields.multiSelect.maxSelected.placeholder",
                        )}
                        type="number"
                        className={InputGroupInputClasses()}
                        {...field}
                      />
                    </InputGroupInput>
                    <InputGroupAddon className={InputGroupAddonClasses()}>
                      {t("form.fields.multiSelect.choices")}
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
      {(fieldType === "oneLine" || fieldType === "multiLine") && (
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
          <FormField
            control={form.control}
            name={`${fieldName}.data.minLength`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("form.fields.text.minLength.label")}
                  <InfoTooltip>
                    {t("form.fields.text.minLength.description")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupInput>
                      <Input
                        disabled={disabled}
                        placeholder={t(
                          "form.fields.text.minLength.placeholder",
                        )}
                        type="number"
                        className={InputGroupInputClasses()}
                        {...field}
                      />
                    </InputGroupInput>
                    <InputGroupAddon className={InputGroupAddonClasses()}>
                      {t("form.fields.text.characters")}
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${fieldName}.data.maxLength`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("form.fields.text.maxLength.label")}
                  <InfoTooltip>
                    {fieldType === "oneLine"
                      ? t("form.fields.text.maxLength.oneLineDescription")
                      : t("form.fields.text.maxLength.multiLineDescription")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupInput>
                      <Input
                        disabled={disabled}
                        placeholder={t(
                          "form.fields.text.maxLength.placeholder",
                        )}
                        type="number"
                        className={InputGroupInputClasses()}
                        {...field}
                      />
                    </InputGroupInput>
                    <InputGroupAddon className={InputGroupAddonClasses()}>
                      {t("form.fields.text.characters")}
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
      <FormField
        control={form.control}
        name={`${fieldName}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("form.fields.description.label")}{" "}
              <InfoTooltip>
                {t("form.fields.description.description")}
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <PlateMarkdownEditor
                className="bg-background px-4 sm:px-4 pb-24"
                disabled={disabled}
                value={field.value}
                onChange={(v) => {
                  field.onChange(v);
                  field.onBlur();
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
