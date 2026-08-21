import { useI18n } from "@hacado/i18n/client";
import { AppointmentFields, getFields } from "@hacado/types";
import {
  fieldSchemaMapper,
  fieldsComponentMap,
  Form,
  usePrevious,
} from "@hacado/ui";
import { deepEqual } from "@hacado/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useScheduleContext } from "./context";

export const FormCard: React.FC = () => {
  const i18n = useI18n("translation");

  const {
    fields: propsFields,
    setFields,
    formFields,
    setDiscount,
    setIsFormValid,
  } = useScheduleContext();

  const fields = getFields(formFields);

  const formSchema = useMemo(
    () =>
      z.object(
        fields.reduce(
          (prev, field) => {
            prev[field.name] = fieldSchemaMapper(field);
            return prev;
          },
          {} as { [field: string]: z.ZodType<any, any> },
        ),
      ),
    [fields],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: propsFields,
  });

  const values = form.watch();
  const previousValues = usePrevious(values, values);
  useEffect(() => {
    if (!deepEqual(values, previousValues)) {
      setFields({
        ...(values as AppointmentFields),
        name: propsFields.name,
        email: propsFields.email,
        phone: propsFields.phone,
      });
    }
  }, [values]);

  const isFormValid = form.formState.isValid;
  React.useEffect(() => {
    setIsFormValid(isFormValid);
  }, [isFormValid]);

  const fieldsMap = useMemo(
    () =>
      fieldsComponentMap(undefined, () => {
        setDiscount(undefined);
      }),
    [setDiscount],
  );

  return (
    <div className="space-y-6 form-card card-container">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground form-card-title card-title">
          {i18n("booking.form.title")}
        </h2>
        <p className="text-xs text-muted-foreground form-card-description card-description">
          {i18n("booking.form.description")}
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={() => {}}
          className="space-y-2 form-card-form form-card-form-fields"
        >
          <div className="flex flex-col gap-4 form-card-form-fields">
            {fields.map((field) => (
              <React.Fragment key={field.name}>
                {fieldsMap[field.type](
                  field,
                  form.control,
                  field.name === "name" ||
                    field.name === "email" ||
                    field.name === "phone",
                )}
              </React.Fragment>
            ))}
          </div>
        </form>
      </Form>
    </div>
  );
};
