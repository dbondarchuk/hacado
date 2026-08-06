import * as apps from "./apps";
import * as availability from "./availability";
import * as booking from "./booking";
import * as customerAuth from "./customer-auth";
import * as discounts from "./discounts";
import * as giftCards from "./gift-cards";
import * as payments from "./payments";

export const clientApi = {
  availability,
  booking,
  customerAuth,
  discounts,
  giftCards,
  payments,
  apps,
};

export * from "../booking-submit-error";
export * from "./utils";
