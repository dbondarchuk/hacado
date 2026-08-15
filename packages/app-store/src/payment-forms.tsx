import { PaymentAppFormProps } from "@hacado/types";
import type { ReactNode } from "react";
import { PAYPAL_APP_NAME } from "./apps/paypal/const";
import { PaypalForm } from "./apps/paypal/form";
import { SQUARE_APP_NAME } from "./apps/square/const";
import { SquareForm } from "./apps/square/form";
import { STRIPE_APP_NAME } from "./apps/stripe/const";
import { StripeForm } from "./apps/stripe/form";

export const PaymentAppForms: Record<
  string,
  (props: PaymentAppFormProps<any>) => ReactNode
> = {
  [PAYPAL_APP_NAME]: (props) => <PaypalForm {...props} />,
  [SQUARE_APP_NAME]: (props) => <SquareForm {...props} />,
  [STRIPE_APP_NAME]: (props) => <StripeForm {...props} />,
};
