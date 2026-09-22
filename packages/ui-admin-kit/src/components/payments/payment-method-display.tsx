import { AvailableApps } from "@hacado/app-store";
import { AllKeys } from "@hacado/i18n";
import { PaymentMethod } from "@hacado/types";
import { CircleDollarSign, CreditCard, Gift, Link2 } from "lucide-react";

export const getPaymentMethod = (
  method: PaymentMethod,
  appName?: string,
): AllKeys => {
  if (method === "payment-link" && appName) {
    return (
      AvailableApps[appName]?.displayName ??
      ("admin.common.labels.paymentMethod.payment-link" satisfies AllKeys)
    );
  }

  if (method === "payment-link") {
    return "admin.common.labels.paymentMethod.payment-link";
  }

  return method === "online" && appName
    ? AvailableApps[appName]?.displayName
    : method === "gift-card"
      ? "admin.payment.methods.giftCard"
      : method === "cash"
        ? "admin.payment.methods.cash"
        : "admin.payment.methods.card";
};

export const getPaymentMethodIcon = (
  method: PaymentMethod,
  appName?: string,
) => {
  if (method === "payment-link") {
    if (appName) {
      const Icon = AvailableApps[appName]?.Logo ?? Link2;
      return <Icon className="size-6" />;
    }

    return <Link2 className="size-6" />;
  }

  const Icon =
    method === "online" && appName
      ? AvailableApps[appName]?.Logo
      : method === "gift-card"
        ? Gift
        : method === "cash"
          ? CircleDollarSign
          : CreditCard;

  return <Icon className="size-6" />;
};
