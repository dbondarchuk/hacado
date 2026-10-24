import type { CustomerSmsConsentStatus } from "../customers/list";

export type SmsConsentWrite = {
  phone: string;
  consented: boolean;
  source: "web_form" | "owner_attested";
  ip?: string;
};

export interface ISmsConsentService {
  recordCustomerSmsConsent(input: SmsConsentWrite): Promise<void>;
  hasActiveCustomerSmsConsent(phone: string): Promise<boolean>;
  getCustomerSmsConsentStatus(phone: string): Promise<CustomerSmsConsentStatus>;
}
