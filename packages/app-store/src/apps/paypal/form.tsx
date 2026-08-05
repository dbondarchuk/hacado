"use client";

import GooglePayButton from "@google-pay/button-react";
import {
  PayPalButtons,
  PayPalCardFieldsProvider,
  PayPalCVVField,
  PayPalExpiryField,
  PayPalNameField,
  PayPalNumberField,
  PayPalScriptProvider,
  ReactPayPalScriptOptions,
  usePayPalCardFields,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { clientApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { PaymentAppFormProps } from "@hacado/types";
import { Button, Spinner, toast, useConfig, useCurrency } from "@hacado/ui";
import { formatAmountString } from "@hacado/utils";
import React from "react";
import { PaypalLogo } from "./logo";
import { PaypalFormProps } from "./models";
import {
  PaypalPublicKeys,
  PaypalPublicNamespace,
  paypalPublicNamespace,
} from "./translations/types";
import { PaypalOrder } from "./types";

interface PaypalGooglePayConfig {
  allowedPaymentMethods: google.payments.api.PaymentMethodSpecification[];
  merchantInfo: google.payments.api.MerchantInfo;
}

interface PaypalApplePayConfig {
  isEligible: boolean;
  merchantCountry: string;
  supportedNetworks: string[];
  merchantCapabilities: ApplePayJS.ApplePayMerchantCapability[];
}

declare module "@paypal/paypal-js" {
  interface PayPalNamespace {
    Googlepay?: () => {
      config: () => Promise<PaypalGooglePayConfig>;
      confirmOrder: (options: {
        orderId: string;
        paymentMethodData: google.payments.api.PaymentData["paymentMethodData"];
      }) => Promise<{ status: string }>;
    };
    Applepay?: () => {
      config: () => Promise<PaypalApplePayConfig>;
      validateMerchant: (options: {
        validationUrl: string;
        displayName: string;
      }) => Promise<{ merchantSession: unknown }>;
      confirmOrder: (options: {
        orderId: string;
        token: ApplePayJS.ApplePayPaymentToken;
        billingContact?: ApplePayJS.ApplePayPaymentContact;
        shippingContact?: ApplePayJS.ApplePayPaymentContact;
      }) => Promise<unknown>;
    };
  }
}

const ApplePaySection: React.FC<{
  intent: PaymentAppFormProps<PaypalFormProps>["intent"];
  onSubmit: () => void;
  t: ReturnType<typeof useI18n<PaypalPublicNamespace, PaypalPublicKeys>>;
}> = ({ intent, onSubmit, t }) => {
  const [{ isResolved }] = usePayPalScriptReducer();
  const [isAvailable, setIsAvailable] = React.useState(false);
  const [applePayConfig, setApplePayConfig] =
    React.useState<PaypalApplePayConfig | null>(null);
  const currency = useCurrency();
  const orgConfig = useConfig();

  React.useEffect(() => {
    if (!isResolved || !window.paypal?.Applepay) return;
    if (
      typeof ApplePaySession === "undefined" ||
      !ApplePaySession.canMakePayments()
    )
      return;

    window.paypal
      .Applepay()
      .config()
      .then((cfg) => {
        if (cfg.isEligible) {
          setApplePayConfig(cfg);
          setIsAvailable(true);
        }
      })
      .catch(() => {});
  }, [isResolved]);

  const handleClick = React.useCallback(() => {
    if (!applePayConfig || !window.paypal?.Applepay) return;

    const paymentRequest: ApplePayJS.ApplePayPaymentRequest = {
      countryCode: applePayConfig.merchantCountry,
      currencyCode: currency,
      merchantCapabilities: applePayConfig.merchantCapabilities,
      supportedNetworks: applePayConfig.supportedNetworks,
      requiredBillingContactFields: ["postalAddress", "name"],
      total: {
        label: (orgConfig as any).businessName ?? "Checkout",
        type: "final",
        amount: formatAmountString(intent.amount),
      },
    };

    const session = new ApplePaySession(3, paymentRequest);

    session.onvalidatemerchant = async (event) => {
      try {
        const { merchantSession } = await window.paypal!
          .Applepay!().validateMerchant({
          validationUrl: event.validationURL,
          displayName: (orgConfig as any).businessName ?? "Checkout",
        });
        session.completeMerchantValidation(merchantSession);
      } catch (err) {
        console.error("Apple Pay merchant validation failed", err);
        session.abort();
      }
    };

    session.onpaymentauthorized = async (event) => {
      let sheetCompleted = false;
      try {
        const orderData = await clientApi.apps.callAppApi<{
          id: string;
          debug_id?: string;
          details?: { issue: string; description: string }[];
        }>({
          appId: intent.appId,
          path: "orders",
          method: "POST",
          body: { paymentIntentId: intent._id },
        });

        if (!orderData.id) {
          const errorDetail = orderData?.details?.[0];
          throw new Error(
            errorDetail
              ? `${errorDetail.issue} ${errorDetail.description}`
              : "Failed to create order",
          );
        }

        await window.paypal!.Applepay!().confirmOrder({
          orderId: orderData.id,
          token: event.payment.token,
          billingContact: event.payment.billingContact,
          shippingContact: event.payment.shippingContact,
        });

        // Dismiss the sheet before the capture call so Apple Pay doesn't time out
        session.completePayment(ApplePaySession.STATUS_SUCCESS);
        sheetCompleted = true;

        const captureData = await clientApi.apps.callAppApi<PaypalOrder>({
          appId: intent.appId,
          path: "orders/capture",
          method: "POST",
          body: { orderId: orderData.id, paymentIntentId: intent._id },
        });

        const transaction =
          captureData?.purchase_units?.[0]?.payments?.captures?.[0] ||
          captureData?.purchase_units?.[0]?.payments?.authorizations?.[0];

        if (
          captureData.status !== "COMPLETED" ||
          !transaction ||
          transaction.status !== "COMPLETED"
        ) {
          throw new Error(JSON.stringify(captureData));
        }

        onSubmit();
      } catch (err) {
        console.error("Apple Pay payment failed", err);
        if (!sheetCompleted) {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
        }
        toast.error(t("toast.payment_failed"), {
          description: t("toast.payment_failed_description"),
        });
      }
    };

    session.begin();
  }, [applePayConfig, currency, orgConfig, intent, onSubmit, t]);

  if (!isAvailable) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* <div className="items-center flex my-px text-center">
        <div className="bg-muted flex-1 h-px mx-2" />
        <span className="text-sm text-muted-foreground uppercase">
          {t("form.ui.or")}
        </span>
        <div className="bg-muted flex-1 h-px mx-2" />
      </div> */}
      <button
        type="button"
        onClick={handleClick}
        style={{
          WebkitAppearance: "-apple-pay-button" as any,
          height: "2.5rem",
          width: "100%",
          cursor: "pointer",
          border: "none",
        }}
      />
    </div>
  );
};

const GooglePaySection: React.FC<{
  intent: PaymentAppFormProps<PaypalFormProps>["intent"];
  onSubmit: () => void;
  isSandbox: boolean;
  t: ReturnType<typeof useI18n<PaypalPublicNamespace, PaypalPublicKeys>>;
}> = ({ intent, onSubmit, isSandbox, t }) => {
  const [{ isResolved }] = usePayPalScriptReducer();
  const [googlePayConfig, setGooglePayConfig] =
    React.useState<PaypalGooglePayConfig | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const currency = useCurrency();
  const config = useConfig();

  React.useEffect(() => {
    if (!isResolved || !window.paypal?.Googlepay) return;
    window.paypal
      .Googlepay()
      .config()
      .then(setGooglePayConfig)
      .catch(() => {});
  }, [isResolved]);

  const handlePaymentAuthorized = React.useCallback(
    async (
      paymentData: google.payments.api.PaymentData,
    ): Promise<google.payments.api.PaymentAuthorizationResult> => {
      try {
        const orderData = await clientApi.apps.callAppApi<{
          id: string;
          debug_id?: string;
          details?: { issue: string; description: string }[];
        }>({
          appId: intent.appId,
          path: "orders",
          method: "POST",
          body: { paymentIntentId: intent._id },
        });

        if (!orderData.id) {
          const errorDetail = orderData?.details?.[0];
          throw new Error(
            errorDetail
              ? `${errorDetail.issue} ${errorDetail.description}`
              : "Failed to create order",
          );
        }

        const { status } = await window.paypal!.Googlepay!().confirmOrder({
          orderId: orderData.id,
          paymentMethodData: paymentData.paymentMethodData,
        });

        if (status !== "APPROVED") {
          throw new Error(`Unexpected payment status: ${status}`);
        }

        const captureData = await clientApi.apps.callAppApi<PaypalOrder>({
          appId: intent.appId,
          path: "orders/capture",
          method: "POST",
          body: { orderId: orderData.id, paymentIntentId: intent._id },
        });

        const transaction =
          captureData?.purchase_units?.[0]?.payments?.captures?.[0] ||
          captureData?.purchase_units?.[0]?.payments?.authorizations?.[0];

        if (
          captureData.status !== "COMPLETED" ||
          !transaction ||
          transaction.status !== "COMPLETED"
        ) {
          throw new Error(JSON.stringify(captureData));
        }

        onSubmit();
        return { transactionState: "SUCCESS" };
      } catch (error) {
        console.error("Google Pay payment failed", error);
        toast.error(t("toast.payment_failed"), {
          description: t("toast.payment_failed_description"),
        });
        return {
          transactionState: "ERROR",
          error: {
            reason: "OTHER_ERROR",
            intent: "PAYMENT_AUTHORIZATION",
            message: t("toast.payment_failed"),
          },
        };
      }
    },
    [intent, onSubmit, t],
  );

  if (!googlePayConfig) return null;

  const paymentRequest: google.payments.api.PaymentDataRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: googlePayConfig.allowedPaymentMethods,
    merchantInfo: googlePayConfig.merchantInfo,
    callbackIntents: ["PAYMENT_AUTHORIZATION"],
    transactionInfo: {
      totalPriceStatus: "FINAL",
      totalPrice: formatAmountString(intent.amount),
      currencyCode: currency,
      countryCode: config.country,
    },
  };

  return (
    <div className={isVisible ? undefined : "contents"}>
      {/* {isVisible && (
        <div className="items-center flex my-px text-center">
          <div className="bg-muted flex-1 h-px mx-2" />
          <span className="text-sm text-muted-foreground uppercase">
            {t("form.ui.or")}
          </span>
          <div className="bg-muted flex-1 h-px mx-2" />
        </div>
      )} */}
      <GooglePayButton
        className="w-full"
        environment={isSandbox ? "TEST" : "PRODUCTION"}
        paymentRequest={paymentRequest}
        onPaymentAuthorized={handlePaymentAuthorized}
        onReadyToPayChange={({ isReadyToPay }) => setIsVisible(isReadyToPay)}
        buttonSizeMode="fill"
        buttonType="pay"
      />
    </div>
  );
};

const SubmitPayment: React.FC<{
  isPaying: boolean;
  setIsPaying: (val: boolean) => void;
  billingAddress: any;
}> = ({ isPaying, setIsPaying, billingAddress }) => {
  const { cardFieldsForm } = usePayPalCardFields();
  const t = useI18n<PaypalPublicNamespace, PaypalPublicKeys>(
    paypalPublicNamespace,
  );

  const handleClick = async () => {
    if (!cardFieldsForm) {
      const childErrorMessage = t("form.cardFieldsProviderError");
      throw new Error(childErrorMessage);
    }

    const formState = await cardFieldsForm.getState();

    if (!formState.isFormValid) {
      // return alert("The payment form is invalid");
      return;
    }

    setIsPaying(true);

    cardFieldsForm.submit().finally(() => {
      setIsPaying(false);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="w-full text-lg"
        size="lg"
        onClick={handleClick}
        disabled={isPaying}
      >
        {isPaying && <Spinner />} <PaypalLogo /> {t("form.ui.payButton")}
      </Button>
      {}
    </div>
  );
};

export const PaypalForm: React.FC<PaymentAppFormProps<PaypalFormProps>> = ({
  clientId,
  buttonStyle,
  intent,
  onSubmit,
  isSandbox,
  enableApplePay,
  enableGooglePay,
}) => {
  const t = useI18n<PaypalPublicNamespace, PaypalPublicKeys>(
    paypalPublicNamespace,
  );

  const [isPaying, setIsPaying] = React.useState(false);
  const currency = useCurrency();

  const enabledFunding = [enableApplePay ? "applepay" : null]
    .filter(Boolean)
    .join(",");

  const components: ReactPayPalScriptOptions["components"] = [
    "buttons",
    ...(enableApplePay ? (["applepay"] as const) : []),
    ...(enableGooglePay ? (["googlepay"] as const) : []),
    "card-fields",
  ];

  const initialOptions: ReactPayPalScriptOptions = {
    clientId,
    ...(enabledFunding ? { enableFunding: enabledFunding } : {}),
    disableFunding: "paylater",
    buyerCountry: isSandbox ? "US" : undefined,
    currency: currency,
    components,
  };

  const [billingAddress, setBillingAddress] = React.useState({
    addressLine1: "",
    addressLine2: "",
    adminArea1: "",
    adminArea2: "",
    countryCode: "",
    postalCode: "",
  });

  const handleBillingAddressChange = (field: string, value: string) => {
    setBillingAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const createOrder = async () => {
    try {
      const orderData = await clientApi.apps.callAppApi<{
        id: string;
        debug_id?: string;
        details?: {
          issue: string;
          description: string;
        }[];
      }>({
        appId: intent.appId,
        path: "orders",
        method: "POST",
        body: {
          paymentIntentId: intent._id,
        },
      });

      if (orderData.id) {
        return orderData.id;
      } else {
        const errorDetail = orderData?.details?.[0];
        const errorMessage = errorDetail
          ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
          : JSON.stringify(orderData);

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error(error);
      return `Could not initiate PayPal Checkout...${error}`;
    }
  };

  const onApprove = async (
    data: Parameters<
      NonNullable<React.ComponentProps<typeof PayPalButtons>["onApprove"]>
    >[0],
  ) => {
    try {
      const orderData = await clientApi.apps.callAppApi<PaypalOrder>({
        appId: intent.appId,
        path: "orders/capture",
        method: "POST",
        body: {
          orderId: data.orderID,
          paymentIntentId: intent._id,
        },
      });

      // Three cases to handle:
      //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
      //   (2) Other non-recoverable errors -> Show a failure message
      //   (3) Successful transaction -> Show confirmation or thank you message

      const transaction =
        orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
        orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];

      const status = orderData.status;

      if (
        status !== "COMPLETED" ||
        !transaction ||
        transaction.status !== "COMPLETED"
      ) {
        throw new Error(JSON.stringify(orderData));
      } else {
        onSubmit();
      }
    } catch (error) {
      console.error(`Payment has failed`, error);
      toast.error(t("toast.payment_failed"), {
        description: t("toast.payment_failed_description"),
      });
    }
  };

  function onError(error: any) {
    console.error(`Payment has failed`, error);
    toast.error(t("toast.payment_failed"), {
      description: t("toast.payment_failed_description"),
    });
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          createOrder={createOrder}
          onApprove={(data) => onApprove(data)}
          onError={onError}
          style={{
            ...buttonStyle,
            disableMaxWidth: true,
          }}
          className="flex flex-col gap-2"
        />

        {enableApplePay && (
          <ApplePaySection intent={intent} onSubmit={onSubmit} t={t} />
        )}

        {enableGooglePay && (
          <GooglePaySection
            intent={intent}
            onSubmit={onSubmit}
            isSandbox={isSandbox}
            t={t}
          />
        )}

        <div className="items-center flex my-px text-center">
          <div className="bg-muted flex-1 h-px mx-2" />
          <span className="text-sm text-muted-foreground uppercase">
            {t("form.ui.or")}
          </span>
          <div className="bg-muted flex-1 h-px mx-2" />
        </div>

        <PayPalCardFieldsProvider
          createOrder={createOrder}
          onApprove={(data) => onApprove(data)}
          onError={onError}
          style={{
            input: {
              "font-size": "0.875rem",
              "line-height": "1.25rem",
              // @ts-ignore it's there
              height: "2rem",
            },
          }}
        >
          <PayPalNameField />
          <PayPalNumberField style={{}} />
          <PayPalExpiryField style={{}} />
          <PayPalCVVField style={{}} />
          {/* <input
            type="text"
            id="card-billing-address-line-2"
            name="card-billing-address-line-2"
            placeholder="Address line 1"
            onChange={(e) =>
              handleBillingAddressChange("addressLine1", e.target.value)
            }
          />
          <input
            type="text"
            id="card-billing-address-line-2"
            name="card-billing-address-line-2"
            placeholder="Address line 2"
            onChange={(e) =>
              handleBillingAddressChange("addressLine2", e.target.value)
            }
          />
          <input
            type="text"
            id="card-billing-address-admin-area-line-1"
            name="card-billing-address-admin-area-line-1"
            placeholder="Admin area line 1"
            onChange={(e) =>
              handleBillingAddressChange("adminArea1", e.target.value)
            }
          />
          <input
            type="text"
            id="card-billing-address-admin-area-line-2"
            name="card-billing-address-admin-area-line-2"
            placeholder="Admin area line 2"
            onChange={(e) =>
              handleBillingAddressChange("adminArea2", e.target.value)
            }
          />
          <input
            type="text"
            id="card-billing-address-country-code"
            name="card-billing-address-country-code"
            placeholder="Country code"
            onChange={(e) =>
              handleBillingAddressChange("countryCode", e.target.value)
            }
          />
          <input
            type="text"
            id="card-billing-address-postal-code"
            name="card-billing-address-postal-code"
            placeholder="Postal/zip code"
            onChange={(e) =>
              handleBillingAddressChange("postalCode", e.target.value)
            }
          /> */}
          {/* Custom client component to handle card fields submission */}
          <SubmitPayment
            isPaying={isPaying}
            setIsPaying={setIsPaying}
            billingAddress={billingAddress}
          />
        </PayPalCardFieldsProvider>
      </PayPalScriptProvider>
    </div>
  );
};
