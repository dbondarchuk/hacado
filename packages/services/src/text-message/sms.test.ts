import { appendSharedPoolSuffix, isSmsEnabled, template } from "@hacado/utils";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendRatesSentence,
  appendStopFooter,
  appointmentSkipsSmsConsent,
  canSendCustomerSms,
  classifyInboundSmsKeyword,
  latestConsentAllowsSms,
  prepareTextbeltSmsBody,
  shouldRecordOwnerAttestation,
  shouldSkipDuplicateSend,
  SMS_RATES_SENTENCE,
  SMS_STOP_FOOTER,
} from "./compliance";
import { createDefaultTextMessageSender, getSmsProvider } from "./factory";
import { getInboundSmsKeywordReply } from "./messages";
import { countSmsSegments } from "./segments";
import { resolveSender } from "./telnyx/sender";
import {
  buildTollFreeVerificationBody,
  getUnverifiedSmsProvider,
  mapTelnyxVerificationStatus,
  readVerificationWebhook,
  resolvePlatformSmsRoute,
} from "./verification";

const confirmedEn =
  "{{config.name}}: {{#customerName}}Hi {{customerName}}, your{{/customerName}}{{^customerName}}Your{{/customerName}} {{service.name}} is confirmed for {{dateTime.sms}}.{{#manageLink}} Manage: {{manageLink}}{{/manageLink}}";
const confirmedUk =
  "{{config.name}}: {{#customerName}}Привіт, {{customerName}}, ваш{{/customerName}}{{^customerName}}Ваш{{/customerName}} {{service.name}} підтверджено на {{dateTime.sms}}.";
const reminderEn =
  "This is a reminder for {{service.name}} {{#dateTime.isTomorrow}}tomorrow, {{/dateTime.isTomorrow}}{{^dateTime.isTomorrow}}on {{/dateTime.isTomorrow}}{{dateTime.sms}}.";

const senderConfig = {
  fromNumber: "+18005550199",
  messagingProfileId: "profile",
};

describe("built-in SMS copy and segments", () => {
  it("renders the confirmation with the business, service, and time", () => {
    const body = template(
      confirmedEn,
      {
        config: { name: "Ada Salon" },
        customerName: "Jessica",
        service: { name: "Cut" },
        dateTime: { sms: "Fri, Oct 17, 3:00 PM" },
        manageLink: "https://hacado.me/s/abc",
      },
      true,
    );

    assert.match(body, /Ada Salon/);
    assert.match(body, /Hi Jessica/);
    assert.match(body, /Cut/);
    assert.match(body, /Fri, Oct 17, 3:00 PM/);
    assert.match(body, /https:\/\/hacado.me\/s\/abc/);
  });

  it("omits the greeting when the appointment has no name", () => {
    const body = template(
      confirmedEn,
      {
        config: { name: "Ada Salon" },
        service: { name: "Cut" },
        dateTime: { sms: "Fri, Oct 17, 3:00 PM" },
      },
      true,
    );

    assert.match(body, /^Ada Salon: Your Cut/);
    assert.equal(body.includes("Hi "), false);
  });

  it("counts GSM-7 and Ukrainian (UCS-2) segments", () => {
    assert.equal(countSmsSegments("a".repeat(160)), 1);
    assert.equal(countSmsSegments("a".repeat(161)), 2);
    assert.equal(countSmsSegments("ї".repeat(70)), 1);
    assert.equal(countSmsSegments("ї".repeat(71)), 2);
    const ukrainian = template(
      confirmedUk,
      {
        config: { name: "Салон" },
        service: { name: "Стрижка" },
        dateTime: { sms: "пт, 17 жовт., 15:00" },
      },
      true,
    );
    assert.equal(countSmsSegments(ukrainian) >= 1, true);
    assert.equal(/[А-яІіЇїЄє]/.test(ukrainian), true);
  });
});

describe("SMS reminder date wording", () => {
  it("says tomorrow and keeps the weekday when the visit is the next day", () => {
    const body = template(
      reminderEn,
      {
        service: { name: "Cut" },
        dateTime: {
          sms: "Wed, Oct 21, 2:00 PM",
          isTomorrow: true,
        },
      },
      true,
    );

    assert.equal(
      body,
      "This is a reminder for Cut tomorrow, Wed, Oct 21, 2:00 PM.",
    );
  });

  it("uses on plus the weekday when the visit is later", () => {
    const body = template(
      reminderEn,
      {
        service: { name: "Cut" },
        dateTime: {
          sms: "Mon, Oct 26, 2:00 PM",
          isTomorrow: false,
        },
      },
      true,
    );

    assert.equal(body, "This is a reminder for Cut on Mon, Oct 26, 2:00 PM.");
  });
});

describe("platform compliance footer", () => {
  const body = "Ada Salon confirmed Cut on Oct 17, 3:00 PM.";

  it("adds the rates sentence and STOP footer on the first customer text", () => {
    const first = appendStopFooter(appendRatesSentence(body));
    assert.match(
      first,
      new RegExp(SMS_RATES_SENTENCE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
    assert.equal(first.trimEnd().endsWith(SMS_STOP_FOOTER), true);
    assert.ok(
      first.indexOf(SMS_RATES_SENTENCE) < first.indexOf(SMS_STOP_FOOTER),
    );
  });

  it("adds only the STOP footer on the next text", () => {
    const next = appendStopFooter(body);
    assert.equal(next.includes(SMS_RATES_SENTENCE), false);
    assert.equal(next.trimEnd().endsWith(SMS_STOP_FOOTER), true);
  });
});

describe("resolveSender", () => {
  it("returns the toll-free sender for a US number", () => {
    const resolved = resolveSender("+14155552671", senderConfig);
    assert.deepEqual(resolved, {
      from: senderConfig.fromNumber,
      messagingProfileId: senderConfig.messagingProfileId,
    });
  });

  it("skips a number outside the supported countries", () => {
    const resolved = resolveSender("+442071234567", senderConfig);
    assert.deepEqual(resolved, {
      skipped: true,
      reason: "SMS not supported yet",
    });
  });
});

describe("SMS enable switch", () => {
  it("sends only when the switch is on", () => {
    assert.equal(isSmsEnabled(true), true);
    assert.equal(isSmsEnabled(undefined), false);
    assert.equal(isSmsEnabled(false), false);
  });
});

describe("SMS consent", () => {
  it("does not treat a later unchecked visit as consent", () => {
    const records = [
      { consented: true, createdAt: new Date("2026-10-01") },
      { consented: false, createdAt: new Date("2026-10-17") },
    ];
    assert.equal(latestConsentAllowsSms(records), false);
    assert.deepEqual(
      canSendCustomerSms({
        requireConsent: true,
        latestConsent: false,
        optedOut: false,
      }),
      { ok: false, reason: "no consent" },
    );
  });

  it("skips consent only for appointments created before the cutoff", () => {
    const cutoff = "2026-10-25T15:00:00.000Z";
    assert.equal(
      appointmentSkipsSmsConsent(new Date("2026-10-25T14:59:59.000Z"), cutoff),
      true,
    );
    assert.equal(
      appointmentSkipsSmsConsent(new Date("2026-10-25T15:00:00.000Z"), cutoff),
      false,
    );
    assert.equal(
      appointmentSkipsSmsConsent(new Date("2026-10-25T16:00:00.000Z"), cutoff),
      false,
    );
    assert.equal(
      appointmentSkipsSmsConsent(
        new Date("2026-10-24T23:00:00.000Z"),
        "2026-10-25",
      ),
      true,
    );
    assert.equal(
      appointmentSkipsSmsConsent(
        new Date("2026-10-25T00:00:00.000Z"),
        "2026-10-25",
      ),
      false,
    );
    assert.equal(appointmentSkipsSmsConsent(new Date(), undefined), false);
    assert.equal(appointmentSkipsSmsConsent(new Date(), ""), false);
    assert.equal(appointmentSkipsSmsConsent(new Date(), "not-a-date"), false);
    assert.equal(appointmentSkipsSmsConsent(undefined, cutoff), false);
  });

  it("lets STOP override a checked box", () => {
    assert.deepEqual(
      canSendCustomerSms({
        requireConsent: true,
        latestConsent: true,
        optedOut: true,
      }),
      { ok: false, reason: "opted out" },
    );
  });

  it("handles STOP, HELP, and START before any reply handler", () => {
    assert.equal(classifyInboundSmsKeyword(" stop "), "stop");
    assert.equal(classifyInboundSmsKeyword("UNSUBSCRIBE"), "stop");
    assert.equal(classifyInboundSmsKeyword("start"), "start");
    assert.equal(classifyInboundSmsKeyword("YES"), "start");
    assert.equal(classifyInboundSmsKeyword("help"), "help");
    assert.equal(classifyInboundSmsKeyword("see you then"), null);
    assert.match(getInboundSmsKeywordReply("stop", "en"), /START/);
    assert.match(getInboundSmsKeywordReply("start", "en"), /STOP/);
    assert.match(getInboundSmsKeywordReply("help", "en"), /support@hacado.com/);
  });

  it("records owner attestation only when the box is checked", () => {
    assert.equal(shouldRecordOwnerAttestation(true), true);
    assert.equal(shouldRecordOwnerAttestation(false), false);
  });
});

describe("Textbelt link stripping", () => {
  it("keeps an appointment text and drops the manage link", () => {
    const prepared = prepareTextbeltSmsBody(
      "Ada Salon: Hi Jessica, your Cut is confirmed for Fri, Oct 17, 3:00 PM. Manage: https://ada.hacado.me/my-cabinet",
    );

    assert.deepEqual(prepared, {
      send: true,
      message:
        "Ada Salon: Hi Jessica, your Cut is confirmed for Fri, Oct 17, 3:00 PM.",
    });
  });

  it("keeps a waitlist opening and drops the booking link", () => {
    const prepared = prepareTextbeltSmsBody(
      "Ada Salon: Hi Jessica, there is an opening for Cut on Sat, Oct 24, 2:00 PM. Book: https://ada.hacado.me/book",
    );

    assert.deepEqual(prepared, {
      send: true,
      message:
        "Ada Salon: Hi Jessica, there is an opening for Cut on Sat, Oct 24, 2:00 PM.",
    });
  });

  it("skips a payment text that is only the link", () => {
    const prepared = prepareTextbeltSmsBody(
      "Ada Salon: Hi Jessica, here is your payment link: https://ada.hacado.me/payment?id=abc",
    );

    assert.deepEqual(prepared, {
      send: false,
      reason: "message had only a link",
    });
  });

  it("leaves a text without a link unchanged", () => {
    const body =
      "Ada Salon: Hi Jessica, you were removed from the waitlist for Cut.";
    assert.deepEqual(prepareTextbeltSmsBody(body), {
      send: true,
      message: body,
    });
  });

  it("keeps a follow-up and drops a review link", () => {
    const prepared = prepareTextbeltSmsBody(
      "Thanks for visiting Ada Salon. Leave a review: www.ada.example/review",
    );

    assert.deepEqual(prepared, {
      send: true,
      message: "Thanks for visiting Ada Salon.",
    });
  });
});

describe("SMS provider", () => {
  it("defaults to telnyx and accepts textbelt", () => {
    assert.equal(getSmsProvider(""), "telnyx");
    assert.equal(getSmsProvider("  Telnyx "), "telnyx");
    assert.equal(getSmsProvider("textbelt"), "textbelt");
  });

  it("rejects an unknown provider", () => {
    assert.throws(() => getSmsProvider("twilio"), /Unsupported SMS_PROVIDER/);
  });

  it("builds the sender named by SMS_PROVIDER", () => {
    const previous = process.env.SMS_PROVIDER;
    try {
      process.env.SMS_PROVIDER = "textbelt";
      assert.equal(
        createDefaultTextMessageSender().constructor.name,
        "TextBeltService",
      );
      process.env.SMS_PROVIDER = "telnyx";
      assert.equal(
        createDefaultTextMessageSender().constructor.name,
        "TelnyxService",
      );
    } finally {
      if (previous === undefined) {
        delete process.env.SMS_PROVIDER;
      } else {
        process.env.SMS_PROVIDER = previous;
      }
    }
  });
});

describe("idempotency", () => {
  it("does not send again after an accepted message", () => {
    assert.equal(shouldSkipDuplicateSend({ status: "accepted" }), true);
    assert.equal(shouldSkipDuplicateSend({ status: "delivered" }), true);
    assert.equal(shouldSkipDuplicateSend({ status: "failed" }), false);
    assert.equal(shouldSkipDuplicateSend(null), false);
  });
});

describe("platform SMS route", () => {
  it("sends unverified US and Canada texts through Textbelt", () => {
    assert.equal(getUnverifiedSmsProvider(""), "textbelt");
    assert.deepEqual(
      resolvePlatformSmsRoute({
        customVerified: false,
        dedicatedNumber: undefined,
        platformCountry: true,
        poolNumber: "+18005550100",
        messagingProfileId: "client",
      }),
      { kind: "textbelt" },
    );
  });

  it("sends unverified US and Canada texts from the shared pool when configured", () => {
    assert.equal(getUnverifiedSmsProvider("telnyx"), "telnyx");
    assert.deepEqual(
      resolvePlatformSmsRoute({
        customVerified: false,
        dedicatedNumber: undefined,
        platformCountry: true,
        poolNumber: "+18005550100",
        messagingProfileId: "client",
        unverifiedProvider: "telnyx",
      }),
      {
        kind: "telnyx",
        from: "+18005550100",
        messagingProfileId: "client",
        shared: true,
      },
    );
  });

  it("sends other countries through Textbelt", () => {
    assert.deepEqual(
      resolvePlatformSmsRoute({
        customVerified: true,
        dedicatedNumber: "+18005550199",
        platformCountry: false,
        poolNumber: "+18005550100",
        messagingProfileId: "client",
      }),
      { kind: "textbelt" },
    );
  });

  it("uses a verified dedicated number for US and Canada", () => {
    assert.deepEqual(
      resolvePlatformSmsRoute({
        customVerified: true,
        dedicatedNumber: "+18005550199",
        platformCountry: true,
        poolNumber: "+18005550100",
        messagingProfileId: "client",
      }),
      {
        kind: "telnyx",
        from: "+18005550199",
        messagingProfileId: "client",
        shared: false,
      },
    );
  });

  it("adds the shared-pool suffix once", () => {
    assert.equal(
      appendSharedPoolSuffix("Your cut is confirmed."),
      "Your cut is confirmed. Sent via Hacado",
    );
    assert.equal(
      appendSharedPoolSuffix("Your cut is confirmed. Sent via Hacado"),
      "Your cut is confirmed. Sent via Hacado",
    );
  });

  it("skips when the shared pool is empty", () => {
    assert.deepEqual(
      resolvePlatformSmsRoute({
        customVerified: false,
        dedicatedNumber: undefined,
        platformCountry: true,
        poolNumber: undefined,
        messagingProfileId: "client",
        unverifiedProvider: "telnyx",
      }),
      { kind: "skip", reason: "sms number not ready" },
    );
  });

  it("uses Textbelt when the shared pool is empty", () => {
    assert.deepEqual(
      resolvePlatformSmsRoute({
        customVerified: false,
        dedicatedNumber: undefined,
        platformCountry: true,
        poolNumber: undefined,
        messagingProfileId: "client",
      }),
      { kind: "textbelt" },
    );
  });
});

describe("toll-free verification body", () => {
  const base = {
    legalName: "Ada Salon LLC",
    country: "US",
    website: "https://ada.example",
    streetAddress: "1 Main",
    city: "austin",
    state: "texas",
    postalCode: "78701",
    contactFirstName: "Ada",
    contactLastName: "Lovelace",
    contactEmail: "ada@gmail.com",
    contactPhone: "+15125550100",
    phoneNumbers: ["+18005550100", "+18005550101"],
    optInImageUrl: "https://cdn.example/opt-in.png",
    privacyPolicyUrl: "https://ada.example/privacy",
    termsAndConditionUrl: "https://ada.example/terms",
    webhookUrl:
      "https://apps.example/api/webhooks/platform/telnyx/verification",
    helpMessage: "Appointment texts for your bookings.",
  };

  it("omits the registration number for a sole proprietor", () => {
    const body = buildTollFreeVerificationBody({
      ...base,
      entityType: "SOLE_PROPRIETOR",
      doingBusinessAs: "Ada Salon",
    });
    assert.ok(body);

    assert.equal(body.entityType, "SOLE_PROPRIETOR");
    assert.equal(body.businessRegistrationNumber, undefined);
    assert.equal(body.businessRegistrationType, undefined);
    assert.equal(body.doingBusinessAs, "Ada Salon");
    assert.equal(body.isvReseller, "Hacado");
    assert.deepEqual(body.optInWorkflowImageURLs, [
      { url: "https://cdn.example/opt-in.png" },
    ]);
    assert.deepEqual(body.phoneNumbers, [
      { phoneNumber: "+18005550100" },
      { phoneNumber: "+18005550101" },
    ]);
    assert.equal(body.businessCity, "Austin");
    assert.equal(body.privacyPolicyURL, "https://ada.example/privacy");
    assert.equal(body.termsAndConditionURL, "https://ada.example/terms");
    assert.equal(body.productionMessageContent.startsWith("Ada Salon:"), true);
    assert.match(body.useCaseSummary, /Ada Salon/);
    assert.match(body.useCaseSummary, /https:\/\/ada\.example/);
    assert.match(body.additionalInformation, /Ada Salon/);
    assert.match(body.additionalInformation, /support@hacado\.com/);
    assert.match(body.additionalInformation, /https:\/\/ada\.example\/privacy/);
    assert.match(body.additionalInformation, /https:\/\/ada\.example\/terms/);
  });

  it("includes an EIN for a company", () => {
    const body = buildTollFreeVerificationBody({
      ...base,
      entityType: "PRIVATE_PROFIT",
      businessRegistrationNumber: "12-3456789",
    });
    assert.ok(body);

    assert.equal(body.businessRegistrationNumber, "12-3456789");
    assert.equal(body.businessRegistrationType, "EIN");
    assert.equal(body.businessRegistrationCountry, "US");
  });

  it("does not build a body without an opt-in image", () => {
    assert.equal(
      buildTollFreeVerificationBody({
        ...base,
        entityType: "PRIVATE_PROFIT",
        optInImageUrl: "  ",
      }),
      null,
    );
  });
});

describe("verification webhook", () => {
  it("maps Telnyx statuses", () => {
    assert.equal(mapTelnyxVerificationStatus("Verified"), "verified");
    assert.equal(mapTelnyxVerificationStatus("Rejected"), "rejected");
    assert.equal(
      mapTelnyxVerificationStatus("Waiting For Customer"),
      "rejected",
    );
    assert.equal(mapTelnyxVerificationStatus("In Progress"), "pending");
  });

  it("reads the request id and reason", () => {
    assert.deepEqual(
      readVerificationWebhook({
        data: {
          payload: {
            id: "req-1",
            verification_status: "Rejected",
            reason: "Website mismatch",
          },
        },
      }),
      {
        requestId: "req-1",
        status: "Rejected",
        reason: "Website mismatch",
      },
    );
  });
});
