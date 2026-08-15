"use client";

import { adminApi } from "@hacado/api-sdk";
import { BaseAllKeys, useI18n } from "@hacado/i18n/client";
import {
  getGiftCardSchemaWithUniqueCheck,
  GiftCard,
  InPersonPaymentMethod,
  inPersonPaymentMethod,
} from "@hacado/types";
import {
  Button,
  cn,
  DateTimePicker,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
  toastPromise,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  use12HourFormat,
  useCurrencySymbol,
  useDebounceCacheFn,
} from "@hacado/ui";
import { CustomerSelector, SaveButton } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Dices } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const expiryDate = DateTime.now().plus({ days: 365 }).endOf("day").toJSDate();
const minDate = DateTime.now().plus({ days: 1 }).startOf("day").toJSDate();

// Generate a random code like XXX-XXX-XXX
const generateGiftCardCode = () => {
  return (
    Math.random().toString(36).substring(2, 5).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 5).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 5).toUpperCase()
  );
};

const defaultCode = generateGiftCardCode();

export const GiftCardForm: React.FC<{
  initialData?: GiftCard;
}> = ({ initialData }) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();
  const uses12HourFormat = use12HourFormat();

  const cachedGiftCardCodeCheck = useDebounceCacheFn(
    adminApi.giftCards.checkGiftCardCodeUnique,
    300,
  );

  const formSchema = useMemo(() => {
    let schema = getGiftCardSchemaWithUniqueCheck(
      (code) => cachedGiftCardCodeCheck(code, initialData?._id),
      "validation.giftCard.code.unique" satisfies BaseAllKeys,
      !initialData?._id,
    );

    if (!initialData?._id) {
      return schema.extend({
        paymentMethod: z.enum(inPersonPaymentMethod, {
          error: "validation.giftCard.paymentMethod.required",
        }),
      });
    }

    return schema;
  }, [cachedGiftCardCodeCheck, initialData?._id]);

  type FormValues = z.infer<typeof formSchema> & {
    paymentMethod?: string;
  };

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData || {
      code: defaultCode,
      amount: 50,
      expiresAt: expiryDate,
      paymentMethod: "cash",
    },
  });

  const disableAmountUpdate = useMemo(() => {
    return !!initialData?._id; //&& !!initialData.payments?.length;
  }, [initialData?._id]);

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      const fn = async () => {
        if (!initialData?._id) {
          if (!("paymentMethod" in data)) {
            throw new Error("Payment method is required");
          }

          const payment = await adminApi.payments.addInstore({
            amount: data.amount,
            description: "giftCard",
            type: "payment",
            method: data.paymentMethod as InPersonPaymentMethod,
            paidAt: new Date(),
            customerId: data.customerId,
            disableUpdate: true,
          });

          const newData = {
            ...data,
            paymentId: payment._id,
          };

          const { _id } = await adminApi.giftCards.createGiftCard(newData);
          router.push(`/dashboard/services/gift-cards`);
        } else {
          await adminApi.giftCards.updateGiftCard(initialData._id, {
            ...data,
            paymentId: initialData.paymentId,
          });

          router.refresh();
        }
      };

      await toastPromise(fn(), {
        success: t(
          initialData?._id
            ? "services.giftCards.form.toasts.changesSaved"
            : "services.giftCards.form.toasts.created",
        ),
        error: t("services.giftCards.form.toasts.requestError"),
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8">
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("services.giftCards.form.code.label")}{" "}
                  <InfoTooltip>
                    {t("services.giftCards.form.code.generateTooltip")}
                  </InfoTooltip>
                </FormLabel>

                <FormControl>
                  <InputGroup>
                    <InputGroupAddon>
                      <TooltipResponsive>
                        <TooltipResponsiveTrigger
                          className={cn(
                            InputGroupAddonClasses({ variant: "prefix" }),
                            "px-2",
                          )}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={loading || !!initialData?._id}
                            onClick={() => {
                              field.onChange(generateGiftCardCode());
                              field.onBlur();
                              form.trigger("code");
                            }}
                          >
                            <Dices />
                          </Button>
                        </TooltipResponsiveTrigger>
                        <TooltipResponsiveContent>
                          {t("services.giftCards.form.code.tooltip")}
                        </TooltipResponsiveContent>
                      </TooltipResponsive>
                    </InputGroupAddon>
                    <InputGroupInput>
                      <Input
                        disabled={loading || !!initialData?._id}
                        placeholder={t(
                          "services.giftCards.form.code.placeholder",
                        )}
                        className={cn(
                          InputGroupInputClasses(),
                          InputGroupInputClasses({ variant: "prefix" }),
                          "flex-1",
                        )}
                        {...field}
                      />
                    </InputGroupInput>
                    <InputGroupAddon>
                      <TooltipResponsive>
                        <TooltipResponsiveTrigger
                          className={cn(InputGroupAddonClasses(), "px-2")}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!field.value}
                            onClick={() => {
                              navigator.clipboard.writeText(field.value);
                              toast.success(
                                t("services.giftCards.form.code.copied"),
                              );
                            }}
                          >
                            <Copy />
                          </Button>
                        </TooltipResponsiveTrigger>
                        <TooltipResponsiveContent>
                          {t(
                            "services.giftCards.form.code.copyToClipboardTooltip",
                          )}
                        </TooltipResponsiveContent>
                      </TooltipResponsive>
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("services.giftCards.form.amount.label")}
                </FormLabel>
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
                        disabled={loading || disableAmountUpdate}
                        placeholder={t(
                          "services.giftCards.form.amount.placeholder",
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
          <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("services.giftCards.form.expiresAt.label")}{" "}
                  <InfoTooltip>
                    <p>{t("services.giftCards.form.expiresAt.tooltip")}</p>
                    <p>{t("common.optional")}</p>
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <DateTimePicker
                    disabled={loading}
                    clearable
                    use12HourFormat={uses12HourFormat}
                    min={minDate}
                    {...field}
                    onChange={(date) => {
                      field.onChange(date ?? null);
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
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("services.giftCards.form.customerId.label")}
                  <InfoTooltip>
                    {t("services.giftCards.form.customerId.tooltip")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <CustomerSelector
                    onItemSelect={(customerId) => {
                      field.onChange(customerId);
                      field.onBlur();
                    }}
                    value={field.value}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!initialData?._id && (
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("services.giftCards.form.paymentMethod.label")}
                    <InfoTooltip>
                      {t("services.giftCards.form.paymentMethod.tooltip")}
                    </InfoTooltip>
                  </FormLabel>
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
                        <SelectValue
                          placeholder={t(
                            "payment.addUpdatePayment.form.method.label",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {inPersonPaymentMethod.map((type) => (
                          <SelectItem value={type} key={type}>
                            {t(`payment.addUpdatePayment.form.method.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <SaveButton form={form} />
      </form>
    </Form>
  );
};
