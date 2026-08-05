import { useI18n, useLocale } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import { ModifyAppointmentInformation } from "@hacado/types";
import {
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Label,
  Spinner,
  useCurrencyFormat,
} from "@hacado/ui";
import { Gift } from "lucide-react";
import { DateTime as Luxon } from "luxon";
import React from "react";
import { useModifyAppointmentFormContext } from "./context";

const isPaymentBranch = (
  appointment: ModifyAppointmentInformation,
): boolean => {
  if (!appointment?.allowed) return false;
  if (appointment.type === "cancel" && appointment.action === "payment")
    return true;
  if (
    appointment.type === "reschedule" &&
    appointment.action === "paymentRequired"
  )
    return true;
  return false;
};

const getGiftCardsFromAppointment = (
  appointment: ModifyAppointmentInformation,
): { code: string; appliedAmount: number }[] =>
  (appointment && "giftCards" in appointment ? appointment.giftCards : []) ??
  [];

const getPaymentAmount = (
  appointment: ModifyAppointmentInformation,
): number | undefined => {
  if (!appointment?.allowed) return undefined;
  if (appointment.type === "cancel" && appointment.action === "payment")
    return appointment.paymentAmount;
  if (
    appointment.type === "reschedule" &&
    appointment.action === "paymentRequired"
  )
    return appointment.paymentAmount;
  return undefined;
};

export const ConfirmationCard: React.FC = () => {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const {
    appointment,
    type,
    newDateTime,
    confirmedByUser,
    setConfirmedByUser,
    giftCards: contextGiftCards,
    setGiftCards,
    applyGiftCards,
    timeZone,
  } = useModifyAppointmentFormContext();

  const [giftCardCode, setGiftCardCode] = React.useState("");
  const [giftCardError, setGiftCardError] = React.useState<string>();
  const [isLoadingGiftCards, setIsLoadingGiftCards] = React.useState(false);
  const [openGiftCards, setOpenGiftCards] = React.useState(false);

  const locale = useLocale();
  const paymentBranch =
    appointment?.allowed && appointment && isPaymentBranch(appointment);
  const paymentAmount = appointment ? getPaymentAmount(appointment) : undefined;
  const giftCardsRaw = contextGiftCards?.length
    ? contextGiftCards
    : appointment
      ? getGiftCardsFromAppointment(appointment)
      : [];
  const giftCards = (Array.isArray(giftCardsRaw) ? giftCardsRaw : []).map(
    (gc: { code: string; appliedAmount: number; amountLeft?: number }) => ({
      code: gc.code,
      appliedAmount: gc.appliedAmount,
      amountLeft: gc.amountLeft ?? 0,
    }),
  );
  const showPaymentSection = paymentBranch && paymentAmount != null;
  const totalGiftCardsApplied = giftCards.reduce(
    (sum: number, gc: { appliedAmount: number }) => sum + gc.appliedAmount,
    0,
  );
  const totalAfterGiftCards = Math.max(
    0,
    (paymentAmount ?? 0) - totalGiftCardsApplied,
  );

  const handleApplyGiftCard = async () => {
    if (!giftCardCode) {
      setGiftCardError(i18n("booking.giftCard.codeRequired"));
      return;
    }
    if ((contextGiftCards?.length ?? 0) >= 2) return;
    if (paymentAmount == null) return;
    const newCodes = [
      ...(contextGiftCards
        ?.map((g) => g.code)
        .filter((c) => c !== giftCardCode) ?? []),
      giftCardCode,
    ];
    try {
      setIsLoadingGiftCards(true);
      await applyGiftCards(newCodes, paymentAmount);
      setGiftCardCode("");
      setGiftCardError(undefined);
    } catch {
      setGiftCardError(i18n("booking.giftCard.error", { code: giftCardCode }));
    } finally {
      setIsLoadingGiftCards(false);
    }
  };

  const removeGiftCard = async (code: string) => {
    const newGiftCards = contextGiftCards?.filter((g) => g.code !== code) ?? [];
    if (newGiftCards.length === 0) {
      setGiftCards(undefined);
      setGiftCardError(undefined);
      return;
    }
    try {
      setIsLoadingGiftCards(true);
      await applyGiftCards(
        newGiftCards.map((g) => g.code),
        paymentAmount ?? 0,
      );
      setGiftCardError(undefined);
    } catch {
      setGiftCardError(i18n("booking.giftCard.error", { code }));
    } finally {
      setIsLoadingGiftCards(false);
    }
  };

  if (!appointment?.allowed) return null;
  return (
    <div className="relative">
      <div className="mb-3 text-center">
        <h2>{i18n(`modification.review.${type}.confirmationTitle`)}</h2>
      </div>
      <div className="flex flex-col gap-4 flex-wrap">
        <div>
          {appointment.type === "cancel" && appointment.action === "refund" ? (
            <I18nRichText
              namespace="translation"
              text={
                appointment.refundPolicy === "forfeitDeposit"
                  ? "modification.review.cancel.confirmationForfeitDepositDescription"
                  : appointment.refundPolicy === "partialRefund"
                    ? "modification.review.cancel.partialRefundDescription"
                    : "modification.review.cancel.fullRefundDescription"
              }
              args={{
                name: (appointment as any).name,
                service: (appointment as any).optionName,
                dateTime: Luxon.fromJSDate((appointment as any).dateTime)
                  .setZone(timeZone)
                  .toLocaleString(Luxon.DATETIME_FULL, {
                    locale,
                  }),
                refundPercentage: appointment.refundPercentage,
                refundAmount: currencyFormat(appointment.refundAmount),
                feesAmount: currencyFormat(appointment.feesAmount),
                refundFees: appointment.refundFees ? 1 : 0,
              }}
            />
          ) : appointment.type === "cancel" &&
            appointment.action === "payment" ? (
            <I18nRichText
              namespace="translation"
              text={
                appointment.paymentPolicy === "paymentRequired"
                  ? "modification.review.cancel.paymentPartialRequiredDescription"
                  : "modification.review.cancel.paymentFullPriceRequiredDescription"
              }
              args={{
                name: (appointment as any).name,
                service: (appointment as any).optionName,
                dateTime: Luxon.fromJSDate((appointment as any).dateTime)
                  .setZone(timeZone)
                  .toLocaleString(Luxon.DATETIME_FULL, {
                    locale,
                  }),
                amount: currencyFormat(appointment.paymentAmount),
                totalPrice: currencyFormat(appointment.price ?? 0),
              }}
            />
          ) : (
            <I18nRichText
              namespace="translation"
              text="modification.review.reschedule.confirmationDescription"
              args={{
                name: (appointment as any).name,
                service: (appointment as any).optionName,
                dateTime: Luxon.fromJSDate((appointment as any).dateTime)
                  .setZone(timeZone)
                  .toLocaleString(Luxon.DATETIME_FULL, {
                    locale,
                  }),
                newDateTime: newDateTime?.toLocaleString(Luxon.DATETIME_FULL, {
                  locale,
                }),
              }}
            />
          )}
        </div>
        {showPaymentSection && (
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground">
              {i18n("modification.payment.paymentReview")}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {i18n(`modification.review.${type}.fee`)}
              </span>
              <span className="font-medium text-foreground">
                {currencyFormat(paymentAmount ?? 0)}
              </span>
            </div>
            <Collapsible
              open={openGiftCards || (contextGiftCards?.length ?? 0) > 0}
              onOpenChange={setOpenGiftCards}
              className="w-full"
            >
              <CollapsibleTrigger className="w-full text-xs text-muted-foreground inline-flex items-center gap-2 underline">
                <Gift className="w-3 h-3" />
                {i18n("booking.giftCard.trigger")}
              </CollapsibleTrigger>
              <CollapsibleContent className="w-full">
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex flex-row gap-2">
                    <Input
                      id="modify-simple-gift-card-code"
                      className="w-full flex-1"
                      value={giftCardCode}
                      placeholder={i18n("booking.giftCard.codePlaceholder")}
                      onChange={(e) => {
                        setGiftCardCode(e.target.value);
                        setGiftCardError(undefined);
                      }}
                      disabled={
                        isLoadingGiftCards ||
                        (contextGiftCards?.length ?? 0) >= 2
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleApplyGiftCard();
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyGiftCard}
                      disabled={
                        !giftCardCode ||
                        (contextGiftCards?.length ?? 0) >= 2 ||
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
                  {(contextGiftCards ?? giftCards).map((gc) => (
                    <div
                      key={gc.code}
                      className="text-xs text-green-700 flex flex-col gap-2 rounded border border-green-200 bg-green-50 p-2"
                    >
                      <div className="flex flex-row items-center justify-between gap-1">
                        <span>
                          {gc.code}{" "}
                          {i18n("booking.giftCard.giftCardAppliedAmount", {
                            appliedAmount: currencyFormat(gc.appliedAmount),
                          })}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => removeGiftCard(gc.code)}
                        >
                          {i18n("booking.giftCard.remove")}
                        </Button>
                      </div>
                      {"amountLeft" in gc && gc.amountLeft != null && (
                        <div className="flex flex-row items-center justify-between gap-1 text-muted-foreground">
                          <span>
                            {i18n("booking.giftCard.giftCardAmountLeftLabel")}
                          </span>
                          <span className="text-green-800 font-bold">
                            {currencyFormat(gc.amountLeft)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
            {totalGiftCardsApplied > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {i18n("booking.review.price.giftCards")}
                </span>
                <span className="font-medium text-green-700">
                  {currencyFormat(-1 * totalGiftCardsApplied)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-medium border-t border-border pt-2">
              <span className="text-muted-foreground">
                {i18n("modification.payment.amountDue")}
              </span>
              <span className="text-foreground">
                {currencyFormat(totalAfterGiftCards)}
              </span>
            </div>
          </div>
        )}
        <Label className="flex flex-row gap-2 items-center text-base">
          <Checkbox
            checked={confirmedByUser}
            onCheckedChange={(e) => setConfirmedByUser(!!e)}
          />
          <div className="cursor-pointer">
            {i18n(`modification.review.${type}.confirmationCheckboxLabel`)}
          </div>
        </Label>
      </div>
    </div>
  );
};
