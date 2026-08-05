import { clientApi } from "@hacado/api-sdk";
import { TranslationKeys, useI18n, useLocale } from "@hacado/i18n/client";
import { ApplyDiscountRequest, timeZones } from "@hacado/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Checkbox,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Markdown,
  Spinner,
  useCurrencyFormat,
} from "@hacado/ui";
import { durationToTime, template } from "@hacado/utils";
import { TimeZone } from "@vvo/tzdb";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Gift,
  Globe2,
  TicketPercent,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { useScheduleContext } from "./context";

export const ReviewCard: React.FC = () => {
  const {
    selectedAppointmentOption,
    selectedAddons,
    selectedMember,
    duplicateAppointmentDoNotAllowScheduling,
    closestDuplicateAppointment,
    confirmDuplicateAppointment,
    setConfirmDuplicateAppointment,
    dateTime,
    fields,
    formFields,
    discount,
    setDiscount,
    showPromoCode,
    basePrice,
    discountAmount,
    price,
    duration,
    giftCards,
    setGiftCards,
    applyGiftCards,
  } = useScheduleContext();

  const locale = useLocale();

  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();

  if (!selectedAppointmentOption || !dateTime || !fields?.name) return null;

  let timeZone: TimeZone | undefined = timeZones.find((tz) => {
    return (
      dateTime.timeZone === tz.name || tz.group.includes(dateTime.timeZone)
    );
  });
  if (!timeZone) {
    const defaultZone = DateTime.now().zoneName;
    timeZone = timeZones.find((tz) => {
      return defaultZone === tz.name || tz.group.includes(defaultZone || "");
    });
  }

  const [openGiftCards, setOpenGiftCards] = useState(false);
  const [openPromoCode, setOpenPromoCode] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardError, setGiftCardError] = useState<string>();
  const [isLoadingGiftCards, setIsLoadingGiftCards] = useState(false);

  const [promoCode, setPromoCode] = useState(discount?.code ?? "");
  const [promoCodeError, setPromoCodeError] = useState<TranslationKeys>();
  const [isLoadingPromoCode, setIsLoadingPromoCode] = useState(false);

  const totalGiftCardsApplied =
    giftCards?.reduce((sum, giftCard) => sum + giftCard.appliedAmount, 0) || 0;
  const hasGiftCardApplied = totalGiftCardsApplied > 0;
  const totalAfterGiftCards = Math.max(0, price - totalGiftCardsApplied);

  const applyPromoCode = async () => {
    if (!promoCode || !dateTime || !selectedAppointmentOption) {
      setPromoCodeError(undefined);
      return;
    }

    setIsLoadingPromoCode(true);

    try {
      const request = {
        code: promoCode,
        optionId: selectedAppointmentOption._id,
        addons: selectedAddons?.map((addon) => addon._id),
        dateTime: DateTime.fromObject(
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
        name: fields.name || "",
        email: fields.email || "",
        phone: fields.phone || "",
      } satisfies ApplyDiscountRequest;

      const data = await clientApi.discounts.applyDiscount(request);

      setDiscount(data);
      setPromoCodeError(undefined);
    } catch (e) {
      console.error(e);

      setPromoCodeError("booking.promoCode.errorInvalid");

      setDiscount(undefined);
    } finally {
      setIsLoadingPromoCode(false);
    }
  };

  const applyGiftCard = async () => {
    if (!giftCardCode) {
      setGiftCardError(i18n("booking.giftCard.codeRequired"));
      return;
    }

    if ((giftCards?.length || 0) >= 2) {
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
      const data = await applyGiftCards(newCodes, price);

      setGiftCardCode("");
      setGiftCardError(undefined);
    } catch (error) {
      console.error(error);
      setGiftCardError(i18n("booking.giftCard.error", { code: giftCardCode }));
    } finally {
      setIsLoadingGiftCards(false);
    }
  };

  const removeGiftCard = async (code: string) => {
    const newGiftCards =
      giftCards?.filter((giftCard) => giftCard.code !== code) || [];
    setGiftCards(newGiftCards);

    if (!!newGiftCards.length) {
      try {
        await applyGiftCards(
          newGiftCards.map((giftCard) => giftCard.code),
          price,
        );
      } catch (error) {
        console.error(error);
        setGiftCardError(
          i18n("booking.giftCard.error", { code: giftCardCode }),
        );
      }
    }

    setOpenGiftCards(false);
  };

  useEffect(() => {
    const fn = async () => {
      if (!price || !giftCards?.length) return;

      try {
        setIsLoadingGiftCards(true);
        const data = await applyGiftCards(
          giftCards?.map((giftCard) => giftCard.code) || [],
          price,
        );

        setGiftCardError(undefined);
      } catch (error) {
        console.error(error);
        setGiftCardError(
          i18n("booking.giftCard.error", { code: giftCardCode }),
        );
      } finally {
        setIsLoadingGiftCards(false);
      }
    };

    fn();
  }, [price]);

  const { name, email, phone, ...restFields } = fields;
  const shouldShowTotals = !!basePrice;
  const servicePrice =
    selectedAppointmentOption.durationType === "fixed"
      ? (selectedMember?.effectivePrice ?? selectedAppointmentOption.price)
      : (selectedMember?.effectivePrice ??
        selectedAppointmentOption.pricePerHour);
  const serviceDuration =
    selectedAppointmentOption.durationType === "fixed"
      ? (selectedMember?.effectiveDuration ??
        selectedAppointmentOption.duration)
      : undefined;
  return (
    <div className="space-y-6 review-card card-container">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground review-card-title card-title">
          {i18n("booking.review.title")}
        </h2>
        <p className="text-xs text-muted-foreground review-card-description card-description">
          {i18n("booking.review.description")}
        </p>
      </div>

      {/* Duplicate Warning */}
      {selectedAppointmentOption.duplicateAppointmentCheck?.enabled &&
        closestDuplicateAppointment && (
          <div
            className={cn(
              "border-2 rounded-lg p-4",
              duplicateAppointmentDoNotAllowScheduling
                ? "border-destructive bg-destructive/90 dark:bg-destructive/90 text-destructive-foreground"
                : "border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300",
            )}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={cn("w-5 h-5 mt-0.5 shrink-0")} />
              <div className="flex-1">
                <h4
                  className={cn(
                    "font-semibold text-sm",
                    duplicateAppointmentDoNotAllowScheduling,
                  )}
                >
                  {i18n("booking.review.duplicate.title")}
                </h4>
                <p
                  className={cn(
                    "text-xs text-muted-foreground",
                    duplicateAppointmentDoNotAllowScheduling
                      ? "text-destructive-foreground"
                      : "",
                  )}
                >
                  {i18n("booking.review.duplicate.description")}
                </p>
                <Markdown
                  markdown={template(
                    selectedAppointmentOption.duplicateAppointmentCheck.message,
                    {
                      date: closestDuplicateAppointment.toLocaleString(
                        DateTime.DATETIME_FULL,
                      ),
                      name: fields.name,
                      service: selectedAppointmentOption.name,
                      days: selectedAppointmentOption.duplicateAppointmentCheck
                        .days,
                    },
                  )}
                  prose="simple"
                  className="text-xs mt-2 [&_p]:my-0.5 [&_p]:leading-6"
                />
                {closestDuplicateAppointment && (
                  <p className="text-xs mt-2">
                    {i18n("booking.review.duplicate.closestAppointment")}
                    {closestDuplicateAppointment.toLocaleString(
                      DateTime.DATETIME_FULL,
                      { locale },
                    )}
                  </p>
                )}
                {!duplicateAppointmentDoNotAllowScheduling && (
                  <div className="mt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={confirmDuplicateAppointment}
                        onCheckedChange={(e) =>
                          setConfirmDuplicateAppointment(!!e)
                        }
                        className={cn(
                          "w-4 h-4 rounded",
                          duplicateAppointmentDoNotAllowScheduling
                            ? "border-destructive-foreground bg-destructive-foreground/10"
                            : "border-amber-500",
                        )}
                      />
                      <span className="text-xs font-medium">
                        {i18n("booking.review.duplicate.confirm")}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Service Summary */}
      <div className="border rounded-lg p-4 space-y-4 review-service-summary">
        <div className="flex items-start justify-between review-service-summary-content">
          <div>
            <h3 className="text-sm font-semibold text-foreground review-service-summary-title">
              {selectedAppointmentOption.name}
            </h3>
            <Markdown
              markdown={selectedAppointmentOption.description}
              prose="simple"
              className="text-xs text-muted-foreground [&_p]:my-0.5 [&_p]:leading-6 review-service-summary-description"
            />
          </div>
          {selectedAppointmentOption.durationType === "fixed" &&
            (!!servicePrice || !!serviceDuration) && (
              <div className="text-right shrink-0 review-service-summary-price">
                {!!servicePrice && (
                  <p className="text-xs font-semibold text-foreground review-service-summary-price-amount">
                    {currencyFormat(servicePrice)}
                  </p>
                )}
                {!!serviceDuration && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end review-service-summary-price-duration">
                    <Clock className="w-3 h-3" />{" "}
                    {i18n(
                      "common.formats.durationHourMin",
                      durationToTime(serviceDuration),
                    )}
                  </p>
                )}
              </div>
            )}
          {selectedAppointmentOption.durationType === "flexible" &&
            !!servicePrice && (
              <div className="text-right shrink-0 review-service-summary-price">
                <p className="text-xs font-semibold text-foreground review-service-summary-price-amount">
                  {i18n("booking.option.price_per_hour", {
                    price: currencyFormat(servicePrice),
                  })}
                </p>
              </div>
            )}
        </div>

        {selectedMember && (
          <div className="border-t pt-4 review-specialist">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 review-specialist-title">
              {i18n("booking.review.specialist.title")}
            </h4>
            <div className="flex items-center gap-3 review-specialist-content">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage
                  src={selectedMember.member.image ?? undefined}
                  alt={selectedMember.member.name}
                />
                <AvatarFallback>
                  {selectedMember.member.name?.charAt(0)?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground review-specialist-name">
                {selectedMember.member.name}
              </span>
            </div>
          </div>
        )}

        {/* Add-ons */}
        {selectedAddons.length > 0 && (
          <div className="border-t pt-4 review-addons">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 review-addons-title">
              {i18n("booking.review.addons.title")}
            </h4>
            {selectedAddons.map((addon) => (
              <div
                key={addon._id}
                className="flex items-center justify-between py-1 review-addons-item"
              >
                <span className="text-xs text-foreground review-addons-name">
                  {addon.name}
                </span>
                {(!!addon.price || !!addon.duration) && (
                  <div className="text-right shrink-0 review-addons-price">
                    {!!addon.price && (
                      <span className="text-xs font-medium text-foreground">
                        +{currencyFormat(addon.price || 0)}
                      </span>
                    )}
                    {!!addon.duration && (
                      <span className="text-xs text-muted-foreground ml-2 review-addons-duration">
                        +
                        {i18n(
                          "common.formats.durationHourMin",
                          durationToTime(addon.duration),
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Date & Time */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2 review-date-title">
            {i18n("booking.review.date.title")}
          </h4>
          <div className="mb-2 flex items-center gap-2 text-foreground text-xs review-date-content">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="review-date-date">
              {DateTime.fromJSDate(dateTime.date)
                .set({ hour: dateTime.time.hour, minute: dateTime.time.minute })
                .setZone(dateTime.timeZone)
                .toLocaleString(DateTime.DATETIME_FULL, { locale })}
            </span>
          </div>
          <div className="mb-2 flex items-center gap-2 text-foreground text-xs review-timezone-content">
            <Globe2 className="w-4 h-4 text-muted-foreground" />
            <span className="review-date-timezone">
              {i18n("common.formats.timezone", {
                timezone: timeZone?.currentTimeFormat || "",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-foreground text-xs review-duration-content">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="review-date-duration">
              {i18n("booking.review.date.duration", {
                duration: i18n(
                  "common.formats.durationHourMin",
                  durationToTime(duration || 0),
                ),
              })}
            </span>
          </div>
        </div>

        {/* Contact Details */}
        <div className="border-t pt-4 review-contact-details">
          <h4 className="text-sm font-medium text-muted-foreground mb-2 review-contact-details-title">
            {i18n("booking.review.contact.title")}
          </h4>
          <div className="space-y-1 text-xs">
            <p className="text-foreground review-contact-details-name">
              <span className="font-medium">
                {i18n("booking.review.contact.name", { name })}
              </span>
            </p>
            <p className="text-muted-foreground review-contact-details-email">
              {i18n("booking.review.contact.email", { email })}
            </p>
            {phone && (
              <p className="text-muted-foreground review-contact-details-phone">
                {i18n("booking.review.contact.phone", { phone })}
              </p>
            )}
            {Object.entries(restFields)
              .map(([key, value]) => {
                const field = formFields.find((field) => field.name === key);
                return {
                  key,
                  value:
                    typeof value === "boolean"
                      ? value
                        ? i18n("booking.review.contact.yes")
                        : i18n("booking.review.contact.no")
                      : value,
                  label: field?.data?.label ?? key,
                  type: field?.type,
                };
              })
              .filter(
                ({ type, value }) =>
                  type !== "file" && (type === "checkbox" || !!value),
              )
              .map(({ key, value, label }) => (
                <p
                  className="text-muted-foreground review-contact-details-other"
                  key={key}
                >
                  {i18n("booking.review.contact.other", {
                    label,
                    value,
                  })}
                </p>
              ))}
          </div>
        </div>

        {/* Total */}
        {shouldShowTotals && (
          <div className="border-t pt-4 review-total">
            <div className="flex items-center justify-between review-total-content text-xs">
              <div>
                <p className="font-semibold text-foreground review-total-title">
                  {i18n("booking.review.price.original")}
                </p>
              </div>
              <p className="font-bold text-foreground review-total-amount">
                {currencyFormat(basePrice)}
              </p>
            </div>
            {showPromoCode && !!basePrice && (
              <div className="flex items-center justify-between review-total-promo-code">
                <Collapsible
                  open={openPromoCode || !!promoCode}
                  onOpenChange={setOpenPromoCode}
                  className="w-full"
                >
                  <CollapsibleTrigger className="w-full text-xs text-muted-foreground inline-flex  items-center gap-2 underline review-total-gift-cards-title">
                    <TicketPercent className="w-3 h-3" />{" "}
                    {i18n("booking.promoCode.trigger")}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="w-full">
                    <div className="my-3 space-y-1 review-total-promo">
                      <div className="flex flex-row gap-2 review-total-promo-container">
                        <Input
                          className="w-full flex-1 review-total-promo-input"
                          value={promoCode}
                          placeholder={i18n(
                            "booking.promoCode.codePlaceholder",
                          )}
                          onChange={(e) => {
                            setPromoCode(e.target.value);
                            setPromoCodeError(undefined);

                            setDiscount(undefined);
                          }}
                          disabled={isLoadingPromoCode}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              applyPromoCode();
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          className="review-total-promo-button"
                          onClick={applyPromoCode}
                          disabled={!promoCode || isLoadingPromoCode}
                        >
                          {isLoadingPromoCode && <Spinner />}{" "}
                          {i18n("booking.promoCode.apply")}
                        </Button>
                      </div>
                      <p
                        className={cn(
                          "text-xs font-medium review-total-promo-code-message",
                          promoCodeError
                            ? "text-destructive review-total-promo-code-message-error"
                            : "text-green-700 review-total-promo-code-message-success",
                        )}
                      >
                        {!!promoCodeError && i18n(promoCodeError)}
                        {discount &&
                          !promoCodeError &&
                          i18n("booking.promoCode.success", {
                            code: discount.code,
                            discount: currencyFormat(discountAmount),
                          })}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
            {!!basePrice && (
              <div className="flex items-center justify-between mb-2 review-total-gift-cards">
                <Collapsible
                  open={openGiftCards || !!giftCards?.length}
                  onOpenChange={setOpenGiftCards}
                  className="w-full"
                >
                  <CollapsibleTrigger className="w-full text-xs text-muted-foreground inline-flex items-center gap-2 underline review-total-gift-cards-title">
                    <Gift className="w-3 h-3" />{" "}
                    {i18n("booking.giftCard.trigger")}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="w-full">
                    <div className="mt-2 flex flex-col gap-2 items-center w-full review-total-gift-cards-content">
                      <div className="flex flex-row items-center w-full gap-2 review-total-gift-cards-input-container">
                        <Input
                          id="gift-card-code"
                          type="text"
                          className="w-full flex-1 form-card-promo-code-input"
                          value={giftCardCode}
                          onChange={(e) => {
                            setGiftCardCode(e.target.value);
                            setGiftCardError(undefined);
                          }}
                          disabled={
                            isLoadingGiftCards || (giftCards?.length || 0) >= 2
                          }
                          placeholder={i18n("booking.giftCard.codePlaceholder")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              applyGiftCard();
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          className="form-card-promo-code-button"
                          onClick={applyGiftCard}
                          disabled={
                            !giftCardCode || (giftCards?.length || 0) >= 2
                          }
                        >
                          {isLoadingGiftCards && <Spinner />}{" "}
                          {i18n("common.buttons.apply")}
                        </Button>
                      </div>
                      {!!giftCardError && (
                        <div className="text-xs w-full text-left text-destructive review-total-gift-cards-error">
                          {giftCardError}
                        </div>
                      )}
                      {giftCards?.map((giftCard) => (
                        <div
                          key={giftCard.code}
                          className="rounded-md border border-green-300 bg-green-100 text-foreground flex flex-col items-center gap-1 w-full review-total-gift-cards-item"
                        >
                          <div className="px-2 pt-2 pb-1 flex flex-row items-center gap-2 w-full">
                            <div className="text-xs flex flex-1 justify-between items-center review-total-gift-cards-item-code">
                              <div className="text-xs text-green-700 inline-flex items-center gap-2 font-medium review-total-gift-cards-item-code">
                                <div className="flex items-center gap-2">
                                  {/* <Gift className="size-4" /> */}
                                  <div>🎁</div>
                                  <div>{giftCard.code}</div>
                                </div>
                                <div className="text-green-800 font-semibold">
                                  {i18n(
                                    "booking.giftCard.giftCardAppliedAmount",
                                    {
                                      appliedAmount: currencyFormat(
                                        giftCard.appliedAmount,
                                      ),
                                    },
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-6 px-0 hover:bg-transparent text-green-500 hover:text-destructive focus:bg-transparent focus:text-destructive active:bg-transparent active:text-destructive review-total-gift-cards-item-button"
                              onClick={() => removeGiftCard(giftCard.code)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="px-2 pb-2 pt-1 text-xs flex flex-row justify-between items-center w-full border-t border-t-green-300 text-green-500 review-total-gift-cards-item-amount-left">
                            <div className="text-muted-foreground">
                              {i18n(
                                "booking.giftCard.giftCardAmountLeftLabel",
                                {
                                  amountLeft: currencyFormat(
                                    giftCard.amountLeft,
                                  ),
                                },
                              )}
                            </div>
                            <div className="text-green-800 font-bold">
                              {i18n("booking.giftCard.giftCardAmountLeft", {
                                amountLeft: currencyFormat(giftCard.amountLeft),
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
            {discount && (
              <>
                <div className="flex items-center justify-between review-total-content text-xs">
                  <div>
                    <p className="font-semibold text-foreground review-total-title">
                      {i18n("booking.review.price.discount")}
                    </p>
                  </div>
                  <p className="font-bold text-destructive review-total-amount">
                    {currencyFormat(-1 * discountAmount)}
                  </p>
                </div>
              </>
            )}
            {hasGiftCardApplied && (
              <div className="flex items-center justify-between review-total-content text-xs">
                <div>
                  <p className="font-semibold text-foreground review-total-title">
                    {i18n("booking.review.price.giftCards")}
                  </p>
                </div>
                <p className="font-bold text-destructive review-total-amount">
                  {currencyFormat(-1 * totalGiftCardsApplied)}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between review-total-content">
              <div>
                <p className="font-semibold text-foreground review-total-title">
                  {i18n("booking.review.price.total")}
                </p>
              </div>
              <p className="text-lg font-bold text-foreground review-total-amount">
                {currencyFormat(totalAfterGiftCards)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
