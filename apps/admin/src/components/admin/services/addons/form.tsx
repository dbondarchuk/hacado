"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { PlateMarkdownEditor } from "@hacado/rte";
import {
  AppointmentAddonUpdateModel,
  DatabaseId,
  getAppointmentAddonSchemaWithUniqueCheck,
  normalizeAddonStaffOverrides,
  WithDatabaseId,
} from "@hacado/types";
import {
  DurationInput,
  Form,
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
  toastPromise,
  useCurrencySymbol,
  useDebounceCacheFn,
} from "@hacado/ui";
import { SaveButton, Sortable } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import * as z from "zod";
import { FieldSelectCard } from "../field-select-card";
import { StaffOverrides } from "./staff-overrides";

export const AddonForm: React.FC<{
  initialData?: AppointmentAddonUpdateModel & Partial<DatabaseId>;
}> = ({ initialData }) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();

  const cachedUniqueNameCheck = useDebounceCacheFn(
    adminApi.serviceAddons.checkServiceAddonUniqueName,
    300,
  );

  const formSchema = getAppointmentAddonSchemaWithUniqueCheck(
    (name) => cachedUniqueNameCheck(name, initialData?._id),
    "services.addons.nameUnique",
  );

  type FormValues = z.infer<typeof formSchema>;

  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData || {},
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      const payload = {
        ...data,
        staff: normalizeAddonStaffOverrides(data.staff),
      };

      const fn = async () => {
        if (!initialData?._id) {
          const { _id } =
            await adminApi.serviceAddons.createServiceAddon(payload);
          router.push(`/dashboard/services/addons/${_id}`);
        } else {
          await adminApi.serviceAddons.updateServiceAddon(
            initialData._id,
            payload,
          );

          router.refresh();
        }
      };

      await toastPromise(fn(), {
        success: t("services.addons.form.toasts.changesSaved"),
        error: t("services.addons.form.toasts.requestError"),
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const {
    fields: fieldsFields,
    append: appendField,
    remove: removeField,
    swap: swapFields,
    update: updateField,
  } = useFieldArray({
    control: form.control,
    name: "fields",
    keyName: "fields_id",
  });

  const fieldsFieldsIds = fieldsFields.map((x) => x.fields_id);

  const sortFields = (activeId: string, overId: string) => {
    const activeIndex = fieldsFields.findIndex((x) => x.fields_id === activeId);

    const overIndex = fieldsFields.findIndex((x) => x.fields_id === overId);

    if (activeIndex < 0 || overIndex < 0) return;

    swapFields(activeIndex, overIndex);
  };

  const addNewField = () => {
    appendField({
      id: "",
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full min-w-0 space-y-8"
      >
        <div className="flex min-w-0 flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("services.addons.form.name")}</FormLabel>

                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder={t("services.addons.form.namePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("services.addons.form.duration")}</FormLabel>
                  <FormControl>
                    <DurationInput {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("services.addons.form.price")}</FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupAddon
                        className={InputGroupAddonClasses({
                          variant: "prefix",
                        })}
                      >
                        {currencySymbol}
                      </InputGroupAddon>
                      <InputGroupInput>
                        <Input
                          disabled={loading}
                          placeholder={t(
                            "services.addons.form.pricePlaceholder",
                          )}
                          type="number"
                          className={InputGroupInputClasses({
                            variant: "prefix",
                          })}
                          {...field}
                        />
                      </InputGroupInput>
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="min-w-0">
                <FormLabel>
                  {t("services.addons.form.description")}{" "}
                  <InfoTooltip>
                    {t("services.addons.form.descriptionTooltip")}
                  </InfoTooltip>
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
                <FormMessage />
              </FormItem>
            )}
          />
          <Sortable
            title={t("services.addons.form.fields")}
            ids={fieldsFieldsIds}
            onSort={sortFields}
            onAdd={addNewField}
          >
            <div className="flex flex-grow flex-col gap-4">
              {fieldsFields.map((item, index) => {
                return (
                  <FieldSelectCard
                    form={form}
                    type="addon"
                    item={item as WithDatabaseId<any>}
                    key={(item as WithDatabaseId<any>).id}
                    name={`fields.${index}`}
                    disabled={loading}
                    remove={() => removeField(index)}
                    excludeIds={form
                      .getValues("fields")
                      ?.filter(
                        ({ id }) =>
                          id !== form.getValues(`fields.${index}`)?.id,
                      )
                      .map(({ id }) => id)}
                  />
                );
              })}
            </div>
          </Sortable>
        </div>
        <StaffOverrides form={form} disabled={loading} />
        <SaveButton form={form} />
      </form>
    </Form>
  );
};
