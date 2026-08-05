import {
  TranslationKeys,
  useFormatter,
  useI18n,
  useLocale,
} from "@hacado/i18n/client";
import { ModifyAppointmentInformation, timeZones } from "@hacado/types";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Spinner,
  useCurrencyFormat,
} from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { AlertTriangle, Gift, X } from "lucide-react";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { useModifyAppointmentFormContext } from "./context";

const getPaymentFee = (
  appointment: NonNullable<ModifyAppointmentInformation>,
) =>
  (appointment.type === "cancel" &&
    appointment.allowed &&
    appointment.action === "payment") ||
  (appointment.type === "reschedule" &&
    appointment.allowed &&
    appointment.action === "paymentRequired")
    ? appointment.paymentAmount
    : 0;

export const ReviewCard: React.FC = () => {
  const {
    appointment,
    dateTime,
    type,
    newDateTime,
    giftCards,
    setGiftCards,
    applyGiftCards,
    timeZone,
  } = useModifyAppointmentFormContext();

  const locale = useLocale();
  const formatter = useFormatter();
  const currencyFormat = useCurrencyFormat();

  const t = useI18n("translation");

  const [openGiftCards, setOpenGiftCards] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardError, setGiftCardError] = useState<string>();
  const [isLoadingGiftCards, setIsLoadingGiftCards] = useState(false);

  const paymentFee = useMemo(
    () => (appointment ? getPaymentFee(appointment) : 0),
    [appointment],
  );

  const timeZoneInfo = useMemo(
    () =>
      timeZones.find(
        (tz) => timeZone === tz.name || tz.group.includes(timeZone),
      ),
    [timeZone],
  );
  const totalGiftCardsApplied =
    giftCards?.reduce((sum, gc) => sum + gc.appliedAmount, 0) ?? 0;
  const hasGiftCardApplied = totalGiftCardsApplied > 0;
  const totalAfterGiftCards = Math.max(0, paymentFee - totalGiftCardsApplied);

  const applyGiftCard = async () => {
    if (!giftCardCode) {
      setGiftCardError(t("booking.giftCard.codeRequired"));
      return;
    }
    if ((giftCards?.length ?? 0) >= 2) return;
    const newCodes = [
      ...(giftCards?.map((g) => g.code).filter((c) => c !== giftCardCode) ??
        []),
      giftCardCode,
    ];

    try {
      setIsLoadingGiftCards(true);
      await applyGiftCards(newCodes, paymentFee);
      setGiftCardCode("");
      setGiftCardError(undefined);
    } catch {
      setGiftCardError(t("booking.giftCard.error", { code: giftCardCode }));
    } finally {
      setIsLoadingGiftCards(false);
    }
  };

  const removeGiftCard = async (code: string) => {
    const newGiftCards = giftCards?.filter((g) => g.code !== code) ?? [];
    setGiftCards(newGiftCards);
    if (newGiftCards.length > 0) {
      try {
        setIsLoadingGiftCards(true);
        await applyGiftCards(
          newGiftCards.map((g) => g.code),
          paymentFee,
        );
      } catch {
        setGiftCardError(t("booking.giftCard.error", { code: giftCardCode }));
      } finally {
        setIsLoadingGiftCards(false);
      }
    }
    setOpenGiftCards(false);
  };

  if (type === "reschedule" && !dateTime) return null;
  if (!appointment || !appointment.allowed) return null;

  return (
    <div className="space-y-6 review-card card-container">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground review-card-title card-title">
          {t(`modification.review.${type}.title`)}
        </h2>
        <p className="text-xs text-muted-foreground review-card-description card-description">
          {t(`modification.review.${type}.description`)}
        </p>
      </div>

      {type === "cancel" && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 review-cancel-alert">
          <div className="flex items-center gap-2 text-destructive mb-3 review-cancel-alert-title">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium review-cancel-alert-title-text">
              {t("modification.review.cancel.alert.title")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground review-cancel-alert-sub-title">
            {t("modification.review.cancel.alert.subTitle")}
          </p>
          {appointment.type === "cancel" &&
            appointment.action === "refund" &&
            appointment.refundPolicy === "forfeitDeposit" && (
              <p className="text-sm text-muted-foreground review-cancel-alert-sub-title">
                {t(
                  "modification.review.cancel.alert.forfeitDepositDescription",
                )}
              </p>
            )}
        </div>
      )}

      {/* Service Summary */}
      <div className="space-y-4 text-sm review-service-summary">
        <div className="flex justify-between py-2 border-b border-border review-service-summary-item">
          <span className="text-muted-foreground review-service-summary-item-label">
            {t("modification.review.service")}
          </span>
          <span className="font-medium text-foreground review-service-summary-item-value">
            {appointment.optionName}
          </span>
        </div>
        {appointment.addonsNames && appointment.addonsNames.length > 0 && (
          <div className="flex justify-between py-2 border-b border-border review-service-summary-item">
            <span className="text-muted-foreground review-service-summary-item-label">
              {t("modification.review.addons")}
            </span>
            <span className="font-medium text-foreground review-service-summary-item-value">
              {formatter.list(appointment.addonsNames)}
            </span>
          </div>
        )}
        <div className="flex justify-between py-2 border-b border-border review-service-summary-item">
          <span className="text-muted-foreground review-service-summary-item-label">
            {t("modification.review.originalDate")}
          </span>
          <span className="font-medium text-muted-foreground line-through review-service-summary-item-value">
            {DateTime.fromJSDate(appointment.dateTime)
              .setZone(timeZone)
              .toLocaleString(DateTime.DATE_HUGE, { locale })}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-border review-service-summary-item">
          <span className="text-muted-foreground review-service-summary-item-label">
            {t("modification.review.originalTime")}
          </span>
          <span className="font-medium text-muted-foreground line-through review-service-summary-item-value">
            {DateTime.fromJSDate(appointment.dateTime)
              .setZone(timeZone)
              .toLocaleString(DateTime.TIME_SIMPLE, { locale })}
          </span>
        </div>
        {type === "reschedule" && !!newDateTime && (
          <>
            <div className="flex justify-between py-2 border-b border-border review-service-summary-item">
              <span className="text-muted-foreground review-service-summary-item-label">
                {t("modification.review.newDate")}
              </span>
              <span className="font-medium text-primary review-service-summary-item-value">
                {newDateTime.toLocaleString(DateTime.DATE_HUGE, { locale })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border review-service-summary-item">
              <span className="text-muted-foreground review-service-summary-item-label">
                {t("modification.review.newTime")}
              </span>
              <span className="font-medium text-primary review-service-summary-item-value">
                {newDateTime.toLocaleString(DateTime.TIME_SIMPLE, { locale })}
              </span>
            </div>
          </>
        )}
        <div className="flex justify-between py-2 border-b border-border review-service-summary-item review-timezone-item">
          <span className="text-muted-foreground review-service-summary-item-label inline-flex items-center gap-1.5">
            {t("modification.review.timezone" as TranslationKeys)}
          </span>
          <span className="font-medium text-foreground review-service-summary-item-value">
            {t("common.formats.timezone", {
              timezone: timeZoneInfo?.currentTimeFormat || "",
            })}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-border review-service-summary-item">
          <span className="text-muted-foreground review-service-summary-item-label">
            {t("modification.review.duration")}
          </span>
          <span className="font-medium text-foreground review-service-summary-item-value">
            {t(
              "common.formats.durationHourMinutes",
              durationToTime(appointment.duration || 0),
            )}
          </span>
        </div>
        {!!appointment.price && (
          <div className="flex justify-between py-2 border-b border-border review-service-summary-item">
            <span className="text-muted-foreground review-service-summary-item-label">
              {t("modification.review.originalPrice")}
            </span>
            <span className="font-medium text-foreground review-service-summary-item-value">
              {currencyFormat(appointment.price)}
            </span>
          </div>
        )}
        {appointment.type === "cancel" && appointment.action === "refund" && (
          <div className="flex justify-between py-2 border-b border-border review-service-summary-item">
            <span className="text-muted-foreground review-service-summary-item-label">
              {t("modification.review.cancel.refundAmount")}
            </span>
            <span className="font-medium text-destructive review-service-summary-item-value review-cancel-refund-amount">
              {currencyFormat(appointment.refundAmount)}
            </span>
          </div>
        )}
        {!!paymentFee && (
          <>
            <div className="flex justify-between py-2 border-b border-border review-service-summary-item">
              <span className="text-muted-foreground review-service-summary-item-label">
                {t(`modification.review.${type}.fee`)}
              </span>
              <span className="font-medium text-destructive review-service-summary-item-value review-cancel-payment-amount-required">
                {currencyFormat(paymentFee)}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <Collapsible
                open={openGiftCards || !!giftCards?.length}
                onOpenChange={setOpenGiftCards}
                className="w-full"
              >
                <CollapsibleTrigger className="w-full text-xs text-muted-foreground inline-flex items-center gap-2 underline">
                  <Gift className="w-3 h-3" />
                  {t("booking.giftCard.trigger")}
                </CollapsibleTrigger>
                <CollapsibleContent className="w-full">
                  <div className="mt-2 flex flex-col gap-2 items-center w-full">
                    <div className="flex flex-row items-center w-full gap-2">
                      <Input
                        id="modify-gift-card-code"
                        type="text"
                        className="w-full flex-1"
                        value={giftCardCode}
                        onChange={(e) => {
                          setGiftCardCode(e.target.value);
                          setGiftCardError(undefined);
                        }}
                        disabled={
                          isLoadingGiftCards || (giftCards?.length ?? 0) >= 2
                        }
                        placeholder={t("booking.giftCard.codePlaceholder")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") applyGiftCard();
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={applyGiftCard}
                        disabled={
                          !giftCardCode ||
                          (giftCards?.length ?? 0) >= 2 ||
                          isLoadingGiftCards
                        }
                      >
                        {isLoadingGiftCards && <Spinner />}{" "}
                        {t("common.buttons.apply")}
                      </Button>
                    </div>
                    {!!giftCardError && (
                      <div className="text-xs w-full text-left text-destructive">
                        {giftCardError}
                      </div>
                    )}
                    {giftCards?.map((giftCard) => (
                      <div
                        key={giftCard.code}
                        className="rounded-md border border-green-300 bg-green-100 text-foreground flex flex-col items-center gap-1 w-full"
                      >
                        <div className="px-2 pt-2 pb-1 flex flex-row items-center gap-2 w-full">
                          <div className="text-xs flex flex-1 justify-between items-center">
                            <div className="text-xs text-green-700 inline-flex items-center gap-2 font-medium">
                              <span>🎁</span>
                              <span>{giftCard.code}</span>
                            </div>
                            <div className="text-green-800 font-semibold">
                              {t("booking.giftCard.giftCardAppliedAmount", {
                                appliedAmount: currencyFormat(
                                  giftCard.appliedAmount,
                                ),
                              })}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="h-6 px-0 hover:bg-transparent text-green-500 hover:text-destructive"
                            onClick={() => removeGiftCard(giftCard.code)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="px-2 pb-2 pt-1 text-xs flex flex-row justify-between items-center w-full border-t border-t-green-300 text-green-500">
                          <span className="text-muted-foreground">
                            {t("booking.giftCard.giftCardAmountLeftLabel", {
                              amountLeft: currencyFormat(giftCard.amountLeft),
                            })}
                          </span>
                          <span className="text-green-800 font-bold">
                            {t("booking.giftCard.giftCardAmountLeft", {
                              amountLeft: currencyFormat(giftCard.amountLeft),
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
            {hasGiftCardApplied && (
              <div className="flex justify-between py-2 border-b border-border review-service-summary-item">
                <span className="text-muted-foreground review-service-summary-item-label">
                  {t("booking.review.price.giftCards")}
                </span>
                <span className="font-medium text-destructive review-service-summary-item-value">
                  -({currencyFormat(totalGiftCardsApplied)})
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-border review-service-summary-item">
              <span className="text-muted-foreground review-service-summary-item-label">
                {t("modification.payment.amountDue")}
              </span>
              <span className="font-medium text-foreground review-service-summary-item-value">
                {currencyFormat(totalAfterGiftCards)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* <div className="flex gap-2 items-center border border-border rounded-lg p-2 review-confirmation-checkbox-container">
        <Checkbox
          checked={confirmedByUser}
          onCheckedChange={(e) => setConfirmedByUser(!!e)}
          id="confirmedByUser"
          className="review-confirmation-checkbox"
        />
        <Label
          className="text-sm text-muted-foreground review-confirmation-checkbox-label"
          htmlFor="confirmedByUser"
        >
          {t(`modification.review.${type}.checkboxLabel`)}
        </Label>
      </div> */}
    </div>
  );
};
