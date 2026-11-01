export type PaypalOrder = {
  /** The date and time, in [Internet date and time format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional seconds are optional. Note: The regular expression provides guidance but does not reject all invalid dates. */
  create_time?: string;
  /** The date and time, in [Internet date and time format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional seconds are optional. Note: The regular expression provides guidance but does not reject all invalid dates. */
  update_time?: string;
  /** The ID of the order. */
  id?: string;
  /** The intent to either capture payment immediately or authorize a payment for an order after order creation. */
  intent?: CheckoutPaymentIntent;
  payer?: Payer;
  /** An array of purchase units. Each purchase unit establishes a contract between a customer and merchant. Each purchase unit represents either a full or partial order that the customer intends to purchase from the merchant. */
  purchase_units?: PurchaseUnit[];
  /** The order status. */
  status?: OrderStatus;
};

export interface Payer {
  /** The internationalized email address. Note: Up to 64 characters are allowed before and 255 characters are allowed after the @ sign. However, the generally accepted maximum length for an email address is 254 characters. The pattern verifies that an unquoted @ sign exists. */
  email_address?: string;
  /** The account identifier for a PayPal account. */
  payer_id?: string;
  /** The name of the party. */
  name?: Name;
  /** The phone information. */
  phone?: PhoneWithType;
  /** The stand-alone date, in [Internet date and time format](https://tools.ietf.org/html/rfc3339#section-5.6). To represent special legal values, such as a date of birth, you should use dates with no associated time or time-zone data. Whenever possible, use the standard `date_time` type. This regular expression does not validate all dates. For example, February 31 is valid and nothing is known about leap years. */
  birth_date?: string;
  /** The portable international postal address. Maps to [AddressValidationMetadata](https://github.com/googlei18n/libaddressinput/wiki/AddressValidationMetadata) and HTML 5.1 [Autofilling form controls: the autocomplete attribute](https://www.w3.org/TR/html51/sec-forms.html#autofilling-form-controls-the-autocomplete-attribute). */
  address?: Address;
}

export interface Address {
  /** The first line of the address, such as number and street, for example, `173 Drury Lane`. Needed for data entry, and Compliance and Risk checks. This field needs to pass the full address. */
  address_line_1?: string;
  /** The second line of the address, for example, a suite or apartment number. */
  address_line_2?: string;
  /** A city, town, or village. Smaller than `admin_area_level_1`. */
  admin_area_2?: string;
  /** The highest-level sub-division in a country, which is usually a province, state, or ISO-3166-2 subdivision. This data is formatted for postal delivery, for example, `CA` and not `California`. Value, by country, is: UK. A county. US. A state. Canada. A province. Japan. A prefecture. Switzerland. A *kanton*. */
  admin_area_1?: string;
  /** The postal code, which is the ZIP code or equivalent. Typically required for countries with a postal code or an equivalent. See [postal code](https://en.wikipedia.org/wiki/Postal_code). */
  postal_code?: string;
  /** The [2-character ISO 3166-1 code](/api/rest/reference/country-codes/) that identifies the country or region. Note: The country code for Great Britain is GB and not UK as used in the top-level domain names for that country. Use the `C2` country code for China worldwide for comparable uncontrolled price (CUP) method, bank card, and cross-border transactions. */
  country_code: string;
}

/** The name of the party. */
export interface Name {
  /** When the party is a person, the party's given, or first, name. */
  given_name?: string;
  /** When the party is a person, the party's surname or family name. Also known as the last name. Required when the party is a person. Use also to store multiple surnames including the matronymic, or mother's, surname. */
  surname?: string;
}

export interface PhoneWithType {
  /** The phone type. */
  phone_type?: PhoneType;
  /** The phone number in its canonical international [E.164 numbering plan format](https://www.itu.int/rec/T-REC-E.164/en). */
  phone_number: PhoneNumber;
}

export enum PhoneType {
  Fax = "FAX",
  Home = "HOME",
  Mobile = "MOBILE",
  Other = "OTHER",
  Pager = "PAGER",
}

export interface PhoneNumber {
  /** The national number, in its canonical international [E.164 numbering plan format](https://www.itu.int/rec/T-REC-E.164/en). The combined length of the country calling code (CC) and the national number must not be greater than 15 digits. The national number consists of a national destination code (NDC) and subscriber number (SN). */
  national_number: string;
}

export enum CheckoutPaymentIntent {
  Capture = "CAPTURE",
  Authorize = "AUTHORIZE",
}

export enum OrderStatus {
  Created = "CREATED",
  Saved = "SAVED",
  Approved = "APPROVED",
  Voided = "VOIDED",
  Completed = "COMPLETED",
  PayerActionRequired = "PAYER_ACTION_REQUIRED",
}

export interface PurchaseUnit {
  /** The API caller-provided external ID for the purchase unit. Required for multiple purchase units when you must update the order through `PATCH`. If you omit this value and the order contains only one purchase unit, PayPal sets this value to `default`. Note: If there are multiple purchase units, reference_id is required for each purchase unit. */
  reference_id?: string;
  /** The total order amount with an optional breakdown that provides details, such as the total item amount, total tax amount, shipping, handling, insurance, and discounts, if any. If you specify `amount.breakdown`, the amount equals `item_total` plus `tax_total` plus `shipping` plus `handling` plus `insurance` minus `shipping_discount` minus discount. The amount must be a positive number. For listed of supported currencies and decimal precision, see the PayPal REST APIs Currency Codes. */
  amount?: Money;
  /** The API caller-provided external invoice ID for this order. */
  invoice_id?: string;
  /** The PayPal-generated ID for the purchase unit. This ID appears in both the payer's transaction history and the emails that the payer receives. In addition, this ID is available in transaction and settlement reports that merchants and API callers can use to reconcile transactions. This ID is only available when an order is saved by calling v2/checkout/orders/id/save. */
  id?: string;
  /** The collection of payments, or transactions, for a purchase unit in an order. For example, authorized payments, captured payments, and refunds. */
  payments?: PaymentCollection;
}

export interface PaymentCollection {
  /** An array of authorized payments for a purchase unit. A purchase unit can have zero or more authorized payments. */
  authorizations?: AuthorizationWithAdditionalData[];
  /** An array of captured payments for a purchase unit. A purchase unit can have zero or more captured payments. */
  captures?: OrdersCapture[];
  /** An array of refunds for a purchase unit. A purchase unit can have zero or more refunds. */
  refunds?: Refund[];
}

/** A captured payment. */
export interface OrdersCapture {
  /** The status of the captured payment. */
  status?: CaptureStatus;
  /** The PayPal-generated ID for the captured payment. */
  id?: string;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  amount?: Money;
  /** The API caller-provided external invoice number for this order. Appears in both the payer's transaction history and the emails that the payer receives. */
  invoiceId?: string;
  /** The API caller-provided external ID. Used to reconcile API caller-initiated transactions with PayPal transactions. Appears in transaction and settlement reports. */
  custom_id?: string;
  /** The date and time, in [Internet date and time format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional seconds are optional. Note: The regular expression provides guidance but does not reject all invalid dates. */
  create_time?: string;
  /** The date and time, in [Internet date and time format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional seconds are optional. Note: The regular expression provides guidance but does not reject all invalid dates. */
  update_time?: string;
  /** The breakdown of the seller receivable amount. */
  seller_receivable_breakdown?: SellerReceivableBreakdown;
  supplementary_data?: {
    related_ids?: {
      order_id?: string;
      authorization_id?: string;
    };
  };
  links?: Array<{
    href?: string;
    rel?: string;
    method?: string;
  }>;
}

export interface SellerReceivableBreakdown {
  /** The amount for this captured payment in the currency of the transaction. */
  gross_amount?: Money;
  /** The net amount that the payee receives for this captured payment in their PayPal account. The net amount is computed as gross_amount minus the paypal_fee minus the platform_fees. */
  net_amount?: Money;
  /** The applicable fee for this captured payment in the currency of the transaction. */
  paypal_fee?: Money;
  /** The applicable fee for this captured payment in the currency of the transaction. */
  platform_fees?: {
    amount: Money;
    payee: {
      email_address: string;
      merchant_id: string;
    };
  }[];
}

/** The authorization with additional payment details, such as risk assessment and processor response. These details are populated only for certain payment methods. */
export interface AuthorizationWithAdditionalData {
  /** The status for the authorized payment. */
  status?: AuthorizationStatus;
  /** The PayPal-generated ID for the authorized payment. */
  id?: string;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  amount?: Money;
  /** The API caller-provided external invoice number for this order. Appears in both the payer's transaction history and the emails that the payer receives. */
  invoice_id?: string;
  /** The API caller-provided external ID. Used to reconcile API caller-initiated transactions with PayPal transactions. Appears in transaction and settlement reports. */
  custom_id?: string;
  /** The date and time, in [Internet date and time format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional seconds are optional. Note: The regular expression provides guidance but does not reject all invalid dates. */
  expiration_time?: string;
  /** The date and time, in [Internet date and time format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional seconds are optional. Note: The regular expression provides guidance but does not reject all invalid dates. */
  create_time?: string;
  /** The date and time, in [Internet date and time format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional seconds are optional. Note: The regular expression provides guidance but does not reject all invalid dates. */
  update_time?: string;
}

/**
 * Enum for AuthorizationStatus
 */
export enum AuthorizationStatus {
  Created = "CREATED",
  Captured = "CAPTURED",
  Denied = "DENIED",
  PartiallyCaptured = "PARTIALLY_CAPTURED",
  Voided = "VOIDED",
  Pending = "PENDING",
}

/** The currency and amount for a financial transaction, such as a balance or payment due. */
export interface Money {
  /** The [three-character ISO-4217 currency code](/api/rest/reference/currency-codes/) that identifies the currency. */
  currency_code: string;
  /** The value, which might be: An integer for currencies like `JPY` that are not typically fractional. A decimal fraction for currencies like `TND` that are subdivided into thousandths. For the required number of decimal places for a currency code, see [Currency Codes](/api/rest/reference/currency-codes/). */
  value: string;
}

export enum RefundStatus {
  Cancelled = "CANCELLED",
  Failed = "FAILED",
  Pending = "PENDING",
  Completed = "COMPLETED",
}

/** The refund information. */
export interface Refund {
  /** The status of the refund. */
  status?: RefundStatus;
  /** The PayPal-generated ID for the refund. */
  id?: string;
  /** The currency and amount for a financial transaction, such as a balance or payment due. */
  amount?: Money;
  /** The API caller-provided external invoice number for this order. Appears in both the payer's transaction history and the emails that the payer receives. */
  invoice_id?: string;
  /** The API caller-provided external ID. Used to reconcile API caller-initiated transactions with PayPal transactions. Appears in transaction and settlement reports. */
  custom_id?: string;
  /** The date and time, in [Internet date and time format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional seconds are optional. Note: The regular expression provides guidance but does not reject all invalid dates. */
  create_time?: string;
  /** The date and time, in [Internet date and time format](https://tools.ietf.org/html/rfc3339#section-5.6). Seconds are required while fractional seconds are optional. Note: The regular expression provides guidance but does not reject all invalid dates. */
  update_time?: string;
}

export enum CaptureStatus {
  Completed = "COMPLETED",
  Declined = "DECLINED",
  PartiallyRefunded = "PARTIALLY_REFUNDED",
  Pending = "PENDING",
  Refunded = "REFUNDED",
  Failed = "FAILED",
}
