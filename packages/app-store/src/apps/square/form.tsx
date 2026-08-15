"use client";

import { clientApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { PaymentAppFormProps } from "@hacado/types";
import { Spinner, toast, useConfig, useCurrency } from "@hacado/ui";
import { formatAmountString } from "@hacado/utils";
import React from "react";
import {
  ApplePay,
  CreditCard,
  GooglePay,
  PaymentForm,
} from "react-square-web-payments-sdk";
import { SquareFormProps } from "./models";
import {
  SquarePublicKeys,
  SquarePublicNamespace,
  squarePublicNamespace,
} from "./translations/types";

/** Matches Square Web Payments SDK tokenize result (see `react-square-web-payments-sdk` / `@square/web-sdk`). */
type SquareTokenizeResult = {
  status: string;
  token?: string;
  errors?: unknown[];
};

/** Shape expected by Square Web Payments `createPaymentRequest` (Google Pay). */
type SquarePaymentRequestOptions = {
  countryCode: string;
  currencyCode: string;
  total: { amount: string; label: string };
};

/** Aligns Square SDK pay button with `@hacado/ui` primary button (CSS variables). */
const squarePrimaryPayButtonCss = {
  width: "100%",
  minHeight: "2.5rem",
  padding: "0 2rem",
  border: "none",
  borderRadius: "var(--radius, 0.375rem)",
  backgroundColor: "hsl(var(--primary))",
  color: "hsl(var(--primary-foreground))",
  fontSize: "1.125rem",
  lineHeight: "1.75rem",
  fontWeight: 500,
  cursor: "pointer",
  transition:
    "background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease",
  "&:hover": {
    backgroundColor: "hsl(var(--primary) / 0.9)",
  },
  "&:focus-visible": {
    outline: "2px solid hsl(var(--ring))",
    outlineOffset: "2px",
  },
  "&:disabled": {
    cursor: "not-allowed",
    opacity: 0.5,
  },
} as const;

export const SquareForm: React.FC<PaymentAppFormProps<SquareFormProps>> = ({
  applicationId,
  locationId,
  isSandbox: _isSandbox,
  intent,
  onSubmit,
  className,
}) => {
  const t = useI18n<SquarePublicNamespace, SquarePublicKeys>(
    squarePublicNamespace,
  );
  const config = useConfig();
  const currencyCode = useCurrency();

  const [isPaying, setIsPaying] = React.useState(false);

  const cardContainerId = React.useMemo(
    () => `rswps-card-${intent._id.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [intent._id],
  );

  const googlePayContainerId = React.useMemo(
    () => `rswps-google-pay-${intent._id.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [intent._id],
  );

  const createPaymentRequest =
    React.useCallback((): SquarePaymentRequestOptions => {
      return {
        countryCode: config.country,
        currencyCode: currencyCode,
        total: {
          amount: formatAmountString(intent.amount),
          label: t("form.totalLabel"),
        },
      };
    }, [config.country, currencyCode, intent.amount, t]);

  const cardTokenizeResponseReceived = React.useCallback(
    async (tokenResult: SquareTokenizeResult) => {
      if (tokenResult.status !== "OK" || !tokenResult.token) {
        toast.error(t("toast.payment_failed"), {
          description: t("toast.payment_failed_description"),
        });
        return;
      }
      setIsPaying(true);
      try {
        const data = await clientApi.apps.callAppApi<{
          success?: boolean;
          error?: string;
        }>({
          appId: intent.appId,
          path: "pay",
          method: "POST",
          body: {
            paymentIntentId: intent._id,
            sourceId: tokenResult.token,
          },
        });

        if (!data?.success) {
          throw new Error(data?.error ?? "payment_failed");
        }

        onSubmit();
      } catch (e: unknown) {
        console.error(e);
        toast.error(t("toast.payment_failed"), {
          description: t("toast.payment_failed_description"),
        });
      } finally {
        setIsPaying(false);
      }
    },
    [intent.appId, intent._id, onSubmit, t],
  );

  const formId = intent._id.replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <div className={className}>
      <PaymentForm
        key={`square-payment-${intent._id}-${intent.amount}`}
        applicationId={applicationId}
        locationId={locationId}
        createPaymentRequest={createPaymentRequest}
        cardTokenizeResponseReceived={cardTokenizeResponseReceived}
        formProps={{
          "aria-label": t("form.payButton"),
          id: `rswps-form-${formId}`,
          className: "w-full relative flex flex-col gap-4",
        }}
      >
        <GooglePay
          id={googlePayContainerId}
          buttonSizeMode="fill"
          buttonType="long"
        />
        <ApplePay />
        <div className="items-center flex my-px text-center">
          <div className="bg-muted flex-1 h-px mx-2" />
          <span className="text-sm text-muted-foreground uppercase">
            {t("form.or")}
          </span>
          <div className="bg-muted flex-1 h-px mx-2" />
        </div>
        <CreditCard
          id={cardContainerId}
          buttonProps={{
            children: t("form.payButton"),
            css: squarePrimaryPayButtonCss,
          }}
        />
        {isPaying && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/50">
            <Spinner />
          </div>
        )}
      </PaymentForm>
    </div>
  );
};
