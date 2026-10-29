import { clientApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppointmentFields, getFields } from "@hacado/types";
import {
  AppointmentSmsConsent,
  appointmentSmsConsentKind,
  fieldSchemaMapper,
  fieldsComponentMap,
  Form,
  useSmsConsentState,
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
    isCustomerPackageLocked,
    smsText,
  } = useScheduleContext();

  const fields = getFields(formFields);
  const [smsConsent, setSmsConsent] = useSmsConsentState(
    propsFields.smsConsent,
  );

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

  const lockContact = isCustomerPackageLocked;
  const values = form.watch();
  useEffect(() => {
    const next = {
      ...(values as AppointmentFields),
      ...(lockContact
        ? {
            name: propsFields.name,
            email: propsFields.email,
            phone: propsFields.phone,
          }
        : {}),
      smsConsent: appointmentSmsConsentKind(smsText) ? smsConsent : undefined,
    };

    if (!deepEqual(next, propsFields)) {
      setFields(next);
    }
  }, [values, smsConsent, propsFields, smsText, lockContact]);

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
                  lockContact &&
                    (field.name === "name" ||
                      field.name === "email" ||
                      field.name === "phone"),
                )}
                {field.name === "email" && (
                  <p className="text-xs text-muted-foreground">
                    {i18n("booking.form.emailNotice")}
                  </p>
                )}
                {field.name === "phone" && (
                  <AppointmentSmsConsent
                    id="waitlist-booking-sms-consent"
                    offer={smsText}
                    phone={String(
                      (form.watch() as AppointmentFields).phone ?? "",
                    )}
                    profilePhone={propsFields.phone}
                    profileConsent={propsFields.smsConsent === true}
                    checked={smsConsent}
                    onCheckedChange={setSmsConsent}
                    lookup={async (phone) => {
                      const result =
                        await clientApi.booking.getSmsConsent(phone);
                      return result.consented === true;
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </form>
      </Form>
    </div>
  );
};
