"use client";

import { useI18n } from "@hacado/i18n/client";
import { zPhone } from "@hacado/types";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  PhoneInput,
  Spinner,
} from "@hacado/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const phoneSchema = z.object({ phone: zPhone });

export type CompleteProfilePhoneValues = z.infer<typeof phoneSchema>;

export function CompleteProfilePhoneStep({
  disabled,
  onBack,
  onContinue,
}: {
  disabled?: boolean;
  onBack: () => void;
  onContinue: (data: CompleteProfilePhoneValues) => void;
}) {
  const t = useI18n("admin");
  const form = useForm<CompleteProfilePhoneValues>({
    resolver: zodResolver(phoneSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: { phone: undefined },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onContinue)}
        className="w-full space-y-2"
      >
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.signUp.phone")}</FormLabel>
              <FormControl>
                <PhoneInput
                  label={t("auth.signUp.phone")}
                  disabled={disabled}
                  {...field}
                  onChange={(event) => {
                    field.onChange(event.target.value);
                    field.onBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={disabled}
            onClick={onBack}
          >
            {t("auth.signUp.back")}
          </Button>
          <Button disabled={disabled} className="w-full" type="submit">
            {disabled && <Spinner />}
            {t("auth.completeProfile.submit")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
