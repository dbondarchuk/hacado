import { chainProxy } from "./proxy-chain/chain-proxy";
import { withCsp } from "./proxy-chain/with-csp";
import { withLocale } from "./proxy-chain/with-locale";
import { withLogger } from "./proxy-chain/with-logger";
import { withOrganizationId } from "./proxy-chain/with-organization-id";

export const proxy = chainProxy([
  withLogger,
  withOrganizationId,
  withLocale,
  withCsp,
]);
