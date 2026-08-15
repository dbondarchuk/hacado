import { CustomerTabInjectorApp } from "@hacado/types";
import { FORMS_APP_NAME } from "../apps/forms/const";
import { FormsCustomerTabInjector } from "../apps/forms/customer-tab-injector";
import { WAITLIST_APP_NAME } from "../apps/waitlist/const";
import { WaitlistCustomerTabInjector } from "../apps/waitlist/customer-tab-injector";

export const CustomerTabInjectorApps: Record<string, CustomerTabInjectorApp> = {
  [FORMS_APP_NAME]: FormsCustomerTabInjector,
  [WAITLIST_APP_NAME]: WaitlistCustomerTabInjector,
};
