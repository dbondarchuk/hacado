"use client";

import { adminApi } from "@hacado/api-sdk";
import { BaseAllKeys, useI18n } from "@hacado/i18n/client";
import { Payment, PaymentSummary } from "@hacado/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  toastPromise,
} from "@hacado/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const resendSchema = z.object({
  channel: z.enum(["email", "sms"]),
  to: z
    .string()
    .min(1, "validation.payments.to.required" satisfies BaseAllKeys),
});

type ResendFormValues = z.infer<typeof resendSchema>;

export type ResendPaymentLinkDialogProps = {
  payment: Payment | PaymentSummary;
  children: React.ReactNode;
  onSuccess?: (payment: Payment) => void;
};

export const ResendPaymentLinkDialog = ({
  payment,
  children,
  onSuccess,
}: ResendPaymentLinkDialogProps) => {
  const t = useI18n("admin");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailDestinations, setEmailDestinations] = useState<string[]>([]);
  const [phoneDestinations, setPhoneDestinations] = useState<string[]>([]);

  const form = useForm<ResendFormValues>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      channel: "email",
      to: "",
    },
    mode: "all",
  });

  const channel = form.watch("channel");
  const destinations =
    channel === "email" ? emailDestinations : phoneDestinations;

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    adminApi.customers
      .getCustomer(payment.customerId)
      .then((customer) => {
        if (cancelled) {
          return;
        }

        const emails = [
          ...new Set(
            [customer.email, ...(customer.knownEmails ?? [])].filter(Boolean),
          ),
        ] as string[];
        const phones = [
          ...new Set(
            [customer.phone, ...(customer.knownPhones ?? [])].filter(Boolean),
          ),
        ] as string[];

        setEmailDestinations(emails);
        setPhoneDestinations(phones);

        const preferredChannel =
          emails.length > 0 ? "email" : phones.length > 0 ? "sms" : "email";
        const preferredDestinations =
          preferredChannel === "email" ? emails : phones;
        const preferredTo =
          (preferredChannel === "email"
            ? "sentToEmail" in payment
              ? payment.sentToEmail
              : undefined
            : "sentToPhone" in payment
              ? payment.sentToPhone
              : undefined) ||
          preferredDestinations[0] ||
          "";

        form.reset({
          channel: preferredChannel,
          to: preferredTo,
        });
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [open, payment, form]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (destinations.length === 1) {
      form.setValue("to", destinations[0], { shouldValidate: true });
    } else if (destinations.length === 0) {
      form.setValue("to", "", { shouldValidate: true });
    } else if (!destinations.includes(form.getValues("to"))) {
      form.setValue("to", destinations[0] ?? "", { shouldValidate: true });
    }
  }, [channel, destinations, form, open]);

  const canSubmit = useMemo(
    () => destinations.length > 0 && !loading,
    [destinations.length, loading],
  );

  const onDialogOpenChange = (next: boolean) => {
    if (!next && loading) {
      return;
    }

    setOpen(next);
  };

  const onSubmit = async (data: ResendFormValues) => {
    try {
      setLoading(true);
      const result = await toastPromise(
        adminApi.payments.resendPaymentLink(payment._id, data),
        {
          success: t("common.toasts.saved"),
          error: t("common.toasts.error"),
        },
      );

      setOpen(false);
      onSuccess?.(result.payment);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("payment.card.resendLink")}</DialogTitle>
          <DialogDescription>
            {t("payment.card.resendLinkDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-2"
          >
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("payment.card.sendVia")}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="email"
                          disabled={emailDestinations.length === 0}
                        >
                          {t("payment.addUpdatePayment.form.channel.email")}
                        </SelectItem>
                        <SelectItem
                          value="sms"
                          disabled={phoneDestinations.length === 0}
                        >
                          {t("payment.addUpdatePayment.form.channel.sms")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("payment.card.destination")}</FormLabel>
                  <FormControl>
                    {destinations.length > 1 ? (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          field.onBlur();
                        }}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {destinations.map((destination) => (
                            <SelectItem value={destination} key={destination}>
                              {destination}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        {...field}
                        value={destinations[0] ?? ""}
                        disabled
                        readOnly
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onDialogOpenChange(false)}>
            {t("common.buttons.close")}
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            onClick={form.handleSubmit(onSubmit)}
          >
            {loading ? <Spinner /> : null}
            {t("payment.card.resendLink")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
