import { PaymentAppForms } from "@timelish/app-store/payment-forms";
import { useI18n } from "@timelish/i18n/client";
import { cn, useCurrencyFormat } from "@timelish/ui";
import { CreditCard } from "lucide-react";
import { useModifyAppointmentFormContext } from "./context";

export const PaymentCard: React.FC = () => {
  const t = useI18n("translation");
  const currencyFormat = useCurrencyFormat();

  const {
    paymentInformation: paymentForm,
    onSubmit,
    appointment,
  } = useModifyAppointmentFormContext();
  if (!paymentForm || !appointment) return null;

  const Form = PaymentAppForms[paymentForm.intent.appName];

  return (
    <div className="space-y-6 payment-card card-container">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground payment-card-title card-title">
          {t(`modification.payment.${appointment.type}.title`)}
        </h2>
        <p className="text-xs text-muted-foreground payment-card-description card-description">
          {t(`modification.payment.${appointment.type}.description`)}
        </p>
      </div>

      <div className="border rounded-lg p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {currencyFormat(paymentForm.intent.amount)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t(`modification.payment.amountDue`)}
          </p>
        </div>

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
