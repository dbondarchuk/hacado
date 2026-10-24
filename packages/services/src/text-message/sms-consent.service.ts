import type { Language } from "@hacado/i18n";
import type {
  CustomerSmsConsentStatus,
  ISmsConsentService,
  SmsConsentWrite,
} from "@hacado/types";
import { normalizeToE164 } from "@hacado/utils";
import { BaseService } from "../services/base.service";
import { classifyInboundSmsKeyword } from "./compliance";
import { getInboundSmsKeywordReply } from "./messages";
import { SmsStore } from "./sms-store";

export class SmsConsentService
  extends BaseService
  implements ISmsConsentService
{
  constructor(
    organizationId: string,
    private readonly smsStore: SmsStore = new SmsStore(),
  ) {
    super("SmsConsentService", organizationId);
  }

  public async recordCustomerSmsConsent(input: SmsConsentWrite): Promise<void> {
    const phone = normalizeToE164(input.phone);
    if (!phone) {
      return;
    }

    await this.smsStore.recordConsent({
      organizationId: this.organizationId,
      phone,
      consented: input.consented,
      source: input.source,
      ip: input.ip,
    });
  }

  public async hasActiveCustomerSmsConsent(phone: string): Promise<boolean> {
    const normalized = normalizeToE164(phone);
    if (!normalized) {
      return false;
    }

    if (await this.smsStore.isOptedOut(normalized)) {
      return false;
    }

    return this.smsStore.latestConsent(this.organizationId, normalized);
  }

  public async getCustomerSmsConsentStatus(
    phone: string,
  ): Promise<CustomerSmsConsentStatus> {
    const normalized = normalizeToE164(phone);
    if (!normalized) {
      return { consented: false, optedOut: false };
    }

    const [consented, optedOut] = await Promise.all([
      this.smsStore.latestConsent(this.organizationId, normalized),
      this.smsStore.isOptedOut(normalized),
    ]);

    return { consented, optedOut };
  }

  public async handleInboundSmsKeyword(
    phone: string,
    message: string,
    language: Language = "en",
  ): Promise<string | null> {
    const normalized = normalizeToE164(phone);
    const keyword = classifyInboundSmsKeyword(message);
    if (!normalized || !keyword) {
      return null;
    }

    if (keyword === "stop") {
      await this.smsStore.optOut(normalized, "stop");
    } else if (keyword === "start") {
      await this.smsStore.clearOptOut(normalized);
    }

    return getInboundSmsKeywordReply(keyword, language);
  }
}
