import type { Customer, ISmsConsentService } from "@hacado/types";
import { normalizeToE164 } from "@hacado/utils";

export const customerConsentPhone = (
  customer: Pick<Customer, "phone" | "knownPhones">,
  requested?: string | null,
): string | null => {
  const allowed = [customer.phone, ...(customer.knownPhones ?? [])]
    .map((phone) => normalizeToE164(phone ?? ""))
    .filter((phone): phone is string => Boolean(phone));
  const phone = requested
    ? normalizeToE164(requested)
    : customer.phone
      ? normalizeToE164(customer.phone)
      : null;

  if (!phone || !allowed.includes(phone)) {
    return null;
  }

  return phone;
};

export const ensureCustomerSmsConsent = async (input: {
  getCustomer: (id: string) => Promise<Customer | null>;
  smsConsentService: ISmsConsentService;
  customerId: string;
  to: string;
  attest?: boolean;
  ip?: string;
}): Promise<
  { ok: true } | { ok: false; status: number; code: string; error: string }
> => {
  const customer = await input.getCustomer(input.customerId);
  if (!customer) {
    return {
      ok: false,
      status: 404,
      code: "customer_not_found",
      error: "Customer not found",
    };
  }

  const phone = customerConsentPhone(customer, input.to);
  if (!phone) {
    return {
      ok: false,
      status: 400,
      code: "phone_not_found",
      error: "Phone does not belong to this customer",
    };
  }

  if (input.attest) {
    await input.smsConsentService.recordCustomerSmsConsent({
      phone,
      consented: true,
      source: "owner_attested",
      ip: input.ip,
    });
  }

  const allowed =
    await input.smsConsentService.hasActiveCustomerSmsConsent(phone);
  if (!allowed) {
    return {
      ok: false,
      status: 400,
      code: "sms_consent_required",
      error: "SMS consent is required",
    };
  }

  return { ok: true };
};
