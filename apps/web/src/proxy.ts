import { chainProxy } from "./proxy-chain/chain-proxy";
import { withCsp } from "./proxy-chain/with-csp";
import { withLocale } from "./proxy-chain/with-locale";
import { withLogger } from "./proxy-chain/with-logger";
import { withOrganizationId } from "./proxy-chain/with-organization-id";
import { withStaticFallthroughGuard } from "./proxy-chain/with-static-fallthrough-guard";

export const proxy = chainProxy([
  withStaticFallthroughGuard,
  withLogger,
  withOrganizationId,
  withLocale,
  withCsp,
]);
