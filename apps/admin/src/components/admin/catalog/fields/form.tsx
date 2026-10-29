"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { PlateMarkdownEditor } from "@hacado/rte";
import {
  DatabaseId,
  fieldTypes,
  fileFieldAcceptItemSchema,
  getFieldSchemaWithUniqueCheck,
  ServiceFieldUpdateModel,
} from "@hacado/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Combobox,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
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
  toastPromise,
  useDebounceCacheFn,
} from "@hacado/ui";
import { SaveButton, Sortable, SwitchCardFormItem } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useFieldArray, useForm, useFormState } from "react-hook-form";
import * as z from "zod";
import { SelectFieldOptionCard } from "./select-field-option-card";

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
  const [value, setValue] = React.useState<keyof typeof fileTypes | undefined>(
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
          <SelectValue placeholder={t("catalog.fields.form.fileTypes")} />
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
        {t("catalog.fields.form.addOption")}
      </Button>
    </div>
  );
};

export const ServiceFieldForm: React.FC<{
  initialData?: ServiceFieldUpdateModel & Partial<DatabaseId>;
}> = ({ initialData }) => {
  const t = useI18n("admin");

  const cachedUniqueNameCheck = useDebounceCacheFn(
    adminApi.fields.checkFieldUniqueName,
    300,
  );

  const formSchema = getFieldSchemaWithUniqueCheck(
    (name) => cachedUniqueNameCheck(name, initialData?._id),
    "fields.name.unique",
  );

  type FormValues = z.infer<typeof formSchema>;

  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData || {
      type: "oneLine",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      const fn = async () => {
        if (!initialData?._id) {
          const { _id } = await adminApi.fields.createField(data);
          router.push(`/dashboard/catalog/fields/${_id}`);
        } else {
          await adminApi.fields.updateField(initialData._id, data);

          router.refresh();
        }
      };

      await toastPromise(fn(), {
        success: t("catalog.fields.form.toasts.changesSaved"),
        error: t("catalog.fields.form.toasts.requestError"),
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const {
    fields: selectOptionsFields,
    append: appendSelectOption,
    remove: removeSelectOption,
    swap: swapSelectOptions,
  } = useFieldArray({
    control: form.control,
    name: `data.options`,
  });

  const sortSelectOptions = (activeId: string, overId: string) => {
    const activeIndex = selectOptionsFields.findIndex((x) => x.id === activeId);

    const overIndex = selectOptionsFields.findIndex((x) => x.id === overId);

    if (activeIndex < 0 || overIndex < 0) return;

    swapSelectOptions(activeIndex, overIndex);
  };

  const addNewSelectOption = () => {
    appendSelectOption({
      option: "",
    });

    form.trigger("data.options");
  };

  const optionsFormState = useFormState({
    control: form.control,
    name: "data.options",
  });
  const selectOptionsState = form.getFieldState(
    "data.options",
    optionsFormState,
  );
  const selectOptionsIds = selectOptionsFields.map((x) => x.id);

  const fieldType = form.watch("type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("catalog.fields.form.details")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("catalog.fields.form.name")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder={t("catalog.fields.form.namePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("catalog.fields.form.nameTooltip")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data.label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("catalog.fields.form.label")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder={t("catalog.fields.form.labelPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("catalog.fields.form.labelTooltip")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabelWithRequiredIndicator required>
                      {t("catalog.fields.form.type")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <Combobox
                        disabled={loading}
                        className="flex w-full font-normal text-lg"
                        values={fieldTypes.map((type) => ({
                          value: type,
                          label: t(`common.labels.fieldType.${type}`),
                        }))}
                        searchLabel={t("catalog.fields.form.typePlaceholder")}
                        value={field.value}
                        onItemSelect={(item) => {
                          field.onChange(item);
                          field.onBlur();
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("catalog.fields.form.typeTooltip")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data.description"
                render={({ field }) => (
                  <FormItem className="min-w-0 md:col-span-2">
                    <FormLabel>
                      {t("catalog.fields.form.description")}
                    </FormLabel>
                    <FormControl>
                      <PlateMarkdownEditor
                        className="bg-background px-4 sm:px-4 pb-24"
                        disabled={loading}
                        value={field.value}
                        onChange={(v) => {
                          field.onChange(v);
                          field.onBlur();
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("catalog.fields.form.descriptionTooltip")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <FormField
            control={form.control}
            name="required"
            render={({ field }) => (
              <SwitchCardFormItem
                label={t("catalog.fields.form.required")}
                description={t("catalog.fields.form.requiredTooltip")}
                checked={!!field.value}
                disabled={loading}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  field.onBlur();
                }}
              />
            )}
          />
          {fieldType === "file" && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("catalog.fields.form.fileSettings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="data.maxSizeMb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("catalog.fields.form.maxSizeMbLabel")}
                      </FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput>
                            <Input
                              disabled={loading}
                              placeholder={t(
                                "catalog.fields.form.maxSizeMbPlaceholder",
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
                      <FormDescription>
                        {t("catalog.fields.form.maxSizeMbTooltip")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data.accept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("catalog.fields.form.acceptedFilesLabel")}
                      </FormLabel>
                      <FormControl>
                        <TagInput
                          {...field}
                          readOnly
                          placeholder={t(
                            "catalog.fields.form.acceptedFilesPlaceholder",
                          )}
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(e);
                            field.onBlur();
                          }}
                          tagValidator={fileFieldAcceptItemSchema}
                          addItemTemplate={FileTypePickerTag}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("catalog.fields.form.acceptedFilesTooltip")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}
          {fieldType === "select" && (
            <Sortable
              title={t("catalog.fields.form.optionsTitle")}
              ids={selectOptionsIds}
              onSort={sortSelectOptions}
              onAdd={addNewSelectOption}
              required
              invalid={{
                isInvalid: selectOptionsState.invalid,
                message: selectOptionsState.error?.message,
              }}
            >
              <div className="flex flex-grow flex-col gap-4">
                {selectOptionsFields.map((item, index) => {
                  return (
                    <SelectFieldOptionCard
                      form={form}
                      item={item}
                      key={item.id}
                      name={`data.options.${index}`}
                      disabled={loading}
                      remove={() => {
                        removeSelectOption(index);
                        void form.trigger("data.options");
                      }}
                    />
                  );
                })}
              </div>
            </Sortable>
          )}
        </div>
        <SaveButton form={form} />
      </form>
    </Form>
  );
};
