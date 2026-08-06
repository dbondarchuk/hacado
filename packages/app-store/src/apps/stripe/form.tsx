"use client";

import { clientApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { PaymentAppFormProps } from "@hacado/types";
import { Button, Spinner, toast } from "@hacado/ui";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type StripeElementsOptions,
  type StripePaymentElementOptions,
} from "@stripe/stripe-js";
import React from "react";
import { StripeFormProps } from "./models";
import {
  stripePublicNamespace,
  type StripePublicKeys,
  type StripePublicNamespace,
} from "./translations/types";

function StripePayButton({
  intentId,
  appId,
  onSuccess,
  label,
  disabled,
}: {
  intentId: string;
  appId: string;
  onSuccess: () => void;
  label: string;
  disabled: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = React.useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) {
      return;
    }
    setIsPaying(true);
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setIsPaying(false);
      return;
    }
    const returnUrl =
      typeof window !== "undefined" ? window.location.href : undefined;
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl ?? "https://localhost",
      },
      redirect: "if_required",
    });
    if (error) {
      setIsPaying(false);
      return;
    }
    try {
      const data = await clientApi.apps.callAppApi<{
        success?: boolean;
        error?: string;
      }>({
        appId,
        path: "confirm-payment",
        method: "POST",
        body: { paymentIntentId: intentId },
      });
      if (!data?.success) {
        throw new Error(data?.error ?? "payment_failed");
      }
      onSuccess();
    } catch (e) {
      console.error(e);
      setIsPaying(false);
      return;
    }
    setIsPaying(false);
  };

  return (
    <div className="relative w-full">
      <Button
        type="button"
        className="w-full"
        disabled={disabled || !stripe || isPaying}
        onClick={handlePay}
      >
        {isPaying ? <Spinner /> : label}
      </Button>
      {isPaying && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/50" />
      )}
    </div>
  );
}

export const StripeForm: React.FC<PaymentAppFormProps<StripeFormProps>> = ({
  publishableKey,
  stripeAccountId,
  intent,
  onSubmit,
  className,
}) => {
  const t = useI18n<StripePublicNamespace, StripePublicKeys>(
    stripePublicNamespace,
  );
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  /** Connect: platform publishable key + `stripeAccount` so the PI `client_secret` resolves. */
  const stripePromise = React.useMemo(
    () =>
      loadStripe(publishableKey, {
        stripeAccount: stripeAccountId,
      }),
    [publishableKey, stripeAccountId],
  );

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await clientApi.apps.callAppApi<{
          clientSecret?: string;
          error?: string;
        }>({
          appId: intent.appId,
          path: "create-payment-intent",
          method: "POST",
          body: { paymentIntentId: intent._id },
        });
        if (cancelled) {
          return;
        }
        if (!res?.clientSecret) {
          setLoadError(res?.error ?? "missing_client_secret");
          return;
        }
        setClientSecret(res.clientSecret);
      } catch (e) {
        if (!cancelled) {
          setLoadError("create_intent_failed");
        }
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [intent._id, intent.appId, intent.amount]);

  const returnFrom3dsRef = React.useRef(false);
  /** After 3D Secure, Stripe returns with `redirect_status` on the same URL. */
  React.useEffect(() => {
    if (typeof window === "undefined" || returnFrom3dsRef.current) {
      return;
    }
    const p = new URLSearchParams(window.location.search);
    if (p.get("redirect_status") !== "succeeded") {
      return;
    }
    if (!p.get("payment_intent") || !intent._id) {
      return;
    }
    returnFrom3dsRef.current = true;
    void (async () => {
      try {
        const data = await clientApi.apps.callAppApi<{
          success?: boolean;
        }>({
          appId: intent.appId,
          path: "confirm-payment",
          method: "POST",
          body: { paymentIntentId: intent._id },
        });
        if (data?.success) {
          onSubmit();
          const url = new URL(window.location.href);
          url.search = "";
          window.history.replaceState({}, "", url.toString());
        }
      } catch (e) {
        console.error(e);
        returnFrom3dsRef.current = false;
      }
    })();
  }, [intent._id, intent.appId, onSubmit]);

  const options: StripeElementsOptions = React.useMemo(
    () => ({
      clientSecret: clientSecret ?? undefined,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "hsl(var(--primary))",
        },
      },
    }),
    [clientSecret],
  );

  /** Google Pay / Apple Pay in the Payment Element (requires HTTPS in production). */
  const paymentElementOptions = React.useMemo(
    (): StripePaymentElementOptions => ({
      wallets: {
        googlePay: "auto",
        applePay: "auto",
      },
    }),
    [],
  );

  React.useEffect(() => {
    if (loadError) {
      toast.error(t("toast.payment_failed"), {
        description: t("toast.payment_failed_description"),
      });
    }
  }, [loadError, t]);

  if (loadError || !clientSecret) {
    return (
      <div className={className}>
        <div className="flex min-h-[120px] items-center justify-center">
          {!loadError ? <Spinner /> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Elements
        key={`${intent._id}-${intent.amount}-${stripeAccountId}-${clientSecret}`}
        stripe={stripePromise}
        options={options}
      >
        <div className="flex flex-col gap-4">
          <PaymentElement options={paymentElementOptions} />
          <StripePayButton
            intentId={intent._id}
            appId={intent.appId}
            label={t("form.payButton")}
            disabled={!clientSecret}
            onSuccess={onSubmit}
          />
        </div>
      </Elements>
    </div>
  );
};
