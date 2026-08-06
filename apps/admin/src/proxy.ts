import { chainProxy } from "./proxy-chain/chain-proxy";
import { withAuth } from "./proxy-chain/with-auth";
import { withCsp } from "./proxy-chain/with-csp";
import { withLocale } from "./proxy-chain/with-locale";
import { withLogger } from "./proxy-chain/with-logger";
import { withPolarWebhooks } from "./proxy-chain/with-polar-webhooks";
import { withSubscriptionPlanGate } from "./proxy-chain/with-subscription-plan-gate";

export const proxy = chainProxy([
  withLogger,
  withLocale,
  withPolarWebhooks,
  withAuth,
  withSubscriptionPlanGate,
  withCsp,
]);
