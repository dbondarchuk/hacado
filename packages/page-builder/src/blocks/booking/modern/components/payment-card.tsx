import { PaymentAppForms } from "@hacado/app-store/payment-forms";
import { useI18n } from "@hacado/i18n/client";
import { cn, useCurrencyFormat } from "@hacado/ui";
import { formatAmount } from "@hacado/utils";
import { CreditCard } from "lucide-react";
import { useScheduleContext } from "./context";

export const PaymentCard: React.FC = () => {
  const t = useI18n("translation");
  const currencyFormat = useCurrencyFormat();

  const {
    paymentInformation: paymentForm,
    onSubmit,
    price,
    basePrice,
    discountAmount,
  } = useScheduleContext();
  if (!paymentForm || !price) return null;

  const Form = PaymentAppForms[paymentForm.intent.appName];

  const isFullPayment = paymentForm.amountTotal === price;
  const percentage = formatAmount((paymentForm.amountTotal / price) * 100);
  const remainingBalance =
    price - paymentForm.intent.amount - paymentForm.amountPaid;

  return (
    <div className="space-y-6 payment-card card-container">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground payment-card-title card-title">
          {t(
            isFullPayment
              ? "booking.payment.fullPaymentRequiredTitle"
              : "booking.payment.depositRequiredTitle",
          )}
        </h2>
        <p className="text-xs text-muted-foreground payment-card-description card-description">
          {t(
            isFullPayment
              ? "booking.payment.fullPaymentRequiredDescription"
              : paymentForm.isFixedAmount
                ? "booking.payment.fixedAmountRequiredDescription"
                : "booking.payment.depositRequiredDescription",
            {
              percentage,
              amount: currencyFormat(paymentForm.amountTotal),
            },
          )}
        </p>
      </div>

      <div className="border rounded-lg p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {currencyFormat(paymentForm.amount)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("booking.payment.amount.deposit")}
          </p>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs payment-card-service-total">
            <span className="text-muted-foreground payment-card-service-total-label">
              {t("booking.payment.subtotal")}
            </span>
            <span className="text-foreground payment-card-service-total-amount">
              {currencyFormat(basePrice)}
            </span>
          </div>
          {!!discountAmount && (
            <div className="flex justify-between text-xs payment-card-service-total">
              <span className="text-muted-foreground payment-card-service-total-label">
                {t("booking.payment.discount")}
              </span>
              <span className="text-destructive payment-card-service-total-amount">
                {currencyFormat(-1 * discountAmount)}
              </span>
            </div>
          )}
          {!!paymentForm.giftCards?.length && (
            <div className="flex justify-between text-xs payment-card-service-total">
              <span className="text-muted-foreground payment-card-service-total-label">
                {t("booking.payment.giftCards")}
              </span>
              <span className="text-destructive payment-card-service-total-amount">
                {currencyFormat(
                  -1 *
                    paymentForm.giftCards.reduce(
                      (acc, giftCard) => acc + giftCard.amountApplied,
                      0,
                    ),
                )}
              </span>
            </div>
          )}
          <div className="border-b pb-2" />
          <div className="flex justify-between text-sm payment-card-service-total">
            <span className="text-muted-foreground payment-card-service-total-label">
              {t("booking.payment.total")}
            </span>
            <span className="text-foreground payment-card-service-total-amount">
              {currencyFormat(price - paymentForm.amountPaid)}
            </span>
          </div>
          <div className="flex justify-between text-sm payment-card-deposit">
            <span className="text-muted-foreground payment-card-deposit-label">
              {t(
                isFullPayment
                  ? "booking.payment.fullPayment"
                  : "booking.payment.deposit",
              )}
            </span>
            <span className="text-foreground payment-card-deposit-amount">
              {currencyFormat(paymentForm.intent.amount)}
            </span>
          </div>
          <div className="border-t pt-4 flex justify-between text-sm">
            <span className="font-medium text-foreground payment-card-remaining-balance-label">
              {t("booking.payment.remainingBalance")}
            </span>
            <span className="font-semibold text-foreground payment-card-remaining-balance-amount">
              {currencyFormat(remainingBalance)}
            </span>
          </div>
        </div>

        {!isFullPayment && (
          <p className="text-xs text-muted-foreground mb-4">
            {t("booking.payment.remainingBalanceDescription", {
              remainingBalance: currencyFormat(remainingBalance),
            })}
          </p>
        )}

        <Form
          {...paymentForm.formProps}
          intent={paymentForm.intent}
          onSubmit={onSubmit}
          className={cn(
            "payment-card-form payment-form",
            paymentForm.formProps?.className,
          )}
        />
      </div>
    </div>
  );
};
