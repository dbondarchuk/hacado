import * as activities from "./activities";
import * as appointments from "./appointments";
import * as apps from "./apps";
import * as assets from "./assets";
import * as billing from "./billing";
import * as booking from "./booking";
import * as calendar from "./calendar";
import * as communicationLogs from "./communication-logs";
import * as communications from "./communications";
import * as configuration from "./configuration";
import * as customers from "./customers";
import * as discounts from "./discounts";
import * as giftCards from "./gift-cards";
import * as organization from "./organization";
import * as pageFooters from "./page-footers";
import * as pageHeaders from "./page-headers";
import * as pages from "./pages";
import * as payments from "./payments";
export type { ListPaymentsParams } from "./payments";
export { PaymentsExportError } from "./payments";
import * as schedule from "./schedule";
import * as serviceAddons from "./service-addons";
import * as serviceFields from "./service-fields";
import * as serviceOptions from "./service-options";
import * as syncedPayments from "./synced-payments";
import * as teams from "./teams";
import * as templates from "./templates";
import * as users from "./users";

export const adminApi = {
  billing,
  calendar,
  activities,
  appointments,
  assets,
  payments,
  communications,
  communicationLogs,
  templates,
  discounts,
  pages,
  pageHeaders,
  pageFooters,
  customers,
  teams,
  serviceAddons,
  serviceFields,
  serviceOptions,
  schedule,
  apps,
  configuration,
  giftCards,
  organization,
  users,
  booking,
  syncedPayments,
};

export * from "./utils";
