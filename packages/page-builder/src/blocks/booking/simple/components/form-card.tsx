"use client";
import {
  ApplyDiscountRequest,
  AppointmentFields,
  getFields,
} from "@hacado/types";

import React, { useEffect, useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Button,
  Form,
  FormItem,
  Input,
  Label,
  Spinner,
  cn,
  useCurrencyFormat,
  usePrevious,
} from "@hacado/ui";

import { clientApi } from "@hacado/api-sdk";
import { TranslationKeys, useI18n } from "@hacado/i18n/client";
import { fieldSchemaMapper, fieldsComponentMap } from "@hacado/ui";
import { deepEqual } from "@hacado/utils";
import { DateTime as Luxon } from "luxon";
import { CardWithAppointmentInformation } from "./card-with-info";
import { useScheduleContext } from "./context";

export const FormCard: React.FC = () => {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const {
    appointmentOption,
    selectedAddons,
    dateTime,
    fields: propsFields,
    setFields,
    formFields,
    discount,
    showPromoCode,
    setDiscount,
    discountAmount,
    setIsFormValid,
    basePrice,
    price,
    giftCards,
    setGiftCards,
    applyGiftCards,
  } = useScheduleContext();

  if (!dateTime) return null;

  const [promoCode, setPromoCode] = React.useState(discount?.code ?? "");
  const [promoCodeError, setPromoCodeError] = React.useState<TranslationKeys>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [giftCardCode, setGiftCardCode] = React.useState("");
  const [giftCardError, setGiftCardError] = React.useState<string>();
  const [isLoadingGiftCards, setIsLoadingGiftCards] = React.useState(false);

  const fields = getFields(formFields);

  const formSchema = useMemo(
    () =>
      z.object(
        fields.reduce(
          (prev, field) => {
            prev[field.name] = fieldSchemaMapper(field);
            return prev;
          },
          {} as { [field: string]: z.ZodType },
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
  React.useEffect(() => {
    if (!deepEqual(values, previousValues)) {
      setFields(values as AppointmentFields);
    }
  }, [values]);

  const isFormValid = form.formState.isValid;
  React.useEffect(() => {
    setIsFormValid(isFormValid);
  }, [isFormValid]);

  const applyPromoCode = async () => {
    if (!promoCode || !dateTime) {
      setPromoCodeError(undefined);
      return;
    }

    setIsLoading(true);

    try {
      const request = {
        code: promoCode,
        optionId: appointmentOption._id,
        addons: selectedAddons?.map((addon) => addon._id),
        dateTime: Luxon.fromObject(
          {
            year: dateTime.date.getFullYear(),
            month: dateTime.date.getMonth() + 1,
            day: dateTime.date.getDate(),
            hour: dateTime.time.hour,
            minute: dateTime.time.minute,
            second: 0,
          },
          { zone: dateTime.timeZone },
        )
          .toUTC()
          .toJSDate(),
        name: (form.getValues("name") as string) || "",
        email: (form.getValues("email") as string) || "",
        phone: (form.getValues("phone") as string) || "",
      } satisfies ApplyDiscountRequest;

      const data = await clientApi.discounts.applyDiscount(request);
      setDiscount(data);
      setPromoCodeError(undefined);
    } catch (e) {
      console.error(e);

      setPromoCodeError("booking.promoCode.errorInvalid");

      setDiscount(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyGiftCard = async () => {
    if (!giftCardCode) {
      setGiftCardError(i18n("booking.giftCard.codeRequired"));
      return;
    }

    const newCodes = [
      ...(giftCards
        ?.map((giftCard) => giftCard.code)
        .filter((code) => code !== giftCardCode) || []),
      giftCardCode,
    ];

    try {
      setIsLoadingGiftCards(true);
      await applyGiftCards(newCodes, price);
      setGiftCardCode("");
      setGiftCardError(undefined);
    } catch {
      setGiftCardError(
        i18n("booking.giftCard.error", {
          code: giftCardCode,
        }),
      );
    } finally {
      setIsLoadingGiftCards(false);
    }
  };

  const removeGiftCard = async (code: string) => {
    const newGiftCards = giftCards?.filter((gc) => gc.code !== code) || [];
    const codes = newGiftCards.map((gc) => gc.code);
    if (codes.length === 0) {
      setGiftCardError(undefined);
      setGiftCards([]);
      return;
    }

    try {
      setIsLoadingGiftCards(true);
      await applyGiftCards(codes, basePrice);
      setGiftCardError(undefined);
    } catch {
      setGiftCardError(
        i18n("booking.giftCard.error", {
          code,
        }),
      );
    } finally {
      setIsLoadingGiftCards(false);
    }
  };

  const fieldsMap = useMemo(
    () =>
      fieldsComponentMap(undefined, () => {
        setDiscount(undefined);
        setPromoCode("");
        setPromoCodeError(undefined);
      }),
    [setDiscount, setPromoCode, setPromoCodeError],
  );

  useEffect(() => {
    if (!price || !giftCards?.length) return;
    (async () => {
      try {
        await applyGiftCards(
          giftCards.map((giftCard) => giftCard.code),
          price,
        );
      } catch (e) {
        console.error(e);
      } finally {
      }
    })();
  }, [price]);

  return (
    <Form {...form}>
      <form onSubmit={() => {}} className="space-y-8">
        <CardWithAppointmentInformation title="common.labels.formTitle">
          <div className="flex flex-col gap-2">
            {fields.map((field) => (
              <React.Fragment key={field.name}>
                {fieldsMap[field.type](field, form.control)}
              </React.Fragment>
            ))}

            {showPromoCode && !!basePrice && (
              <FormItem>
                <Label htmlFor="promo-code" className="text-sm font-medium">
                  {i18n("common.labels.formPromoCode")}
                </Label>
                <div className="flex flex-row gap-2">
                  <Input
                    className="w-full flex-1"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setPromoCodeError(undefined);

                      setDiscount(undefined);
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => applyPromoCode()}
                    disabled={!promoCode}
                  >
                    {isLoading && <Spinner />} {i18n("common.buttons.apply")}
                  </Button>
                </div>
                <p
                  className={cn(
                    "text-xs font-medium",
                    promoCodeError ? "text-destructive" : "text-green-700",
                  )}
                >
                  {!!promoCodeError && i18n(promoCodeError)}
                  {discount &&
                    i18n("booking.promoCode.successMessage", {
                      code: discount.code,
                      discount: currencyFormat(discountAmount),
                    })}
                </p>
              </FormItem>
            )}
            {!!basePrice && (
              <FormItem>
                <Label htmlFor="gift-card-code" className="text-sm font-medium">
                  {i18n("booking.giftCard.trigger")}
                </Label>
                <div className="flex flex-row gap-2">
                  <Input
                    id="gift-card-code"
                    className="w-full flex-1"
                    value={giftCardCode}
                    placeholder={i18n("booking.giftCard.codePlaceholder")}
                    onChange={(e) => {
                      setGiftCardCode(e.target.value);
                      setGiftCardError(undefined);
                    }}
                    disabled={
                      isLoadingGiftCards || (giftCards?.length || 0) >= 2
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleApplyGiftCard();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyGiftCard}
                    disabled={
                      !giftCardCode ||
                      (giftCards?.length || 0) >= 2 ||
                      isLoadingGiftCards
                    }
                  >
                    {isLoadingGiftCards && <Spinner />}{" "}
                    {i18n("common.buttons.apply")}
                  </Button>
                </div>
                {!!giftCardError && (
                  <p className="text-xs font-medium text-destructive">
                    {giftCardError}
                  </p>
                )}
                {giftCards?.map((giftCard) => (
                  <div
                    key={giftCard.code}
                    className="text-xs text-green-700 flex flex-col gap-2"
                  >
                    <div className="flex flex-row items-center justify-between gap-1">
                      <span>
                        {giftCard.code}{" "}
                        {i18n("booking.giftCard.giftCardAppliedAmount", {
                          appliedAmount: currencyFormat(giftCard.appliedAmount),
                        })}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => removeGiftCard(giftCard.code)}
                      >
                        {i18n("booking.giftCard.remove")}
                      </Button>
                    </div>
                    <div className="flex flex-row items-center justify-between gap-1">
                      <span className="text-muted-foreground">
                        {i18n("booking.giftCard.giftCardAmountLeftLabel")}
                      </span>
                      <span className="text-green-800 font-bold">
                        {currencyFormat(giftCard.amountLeft)}
                      </span>
                    </div>
                  </div>
                ))}
              </FormItem>
            )}
          </div>
        </CardWithAppointmentInformation>
      </form>
    </Form>
  );
};
