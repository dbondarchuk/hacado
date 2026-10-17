import { isSmsEnabled, template } from "@hacado/utils";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendRatesSentence,
  appendStopFooter,
  canSendCustomerSms,
  latestConsentAllowsSms,
  prepareTextbeltSmsBody,
  shouldRecordOwnerAttestation,
  shouldSkipDuplicateSend,
  SMS_RATES_SENTENCE,
  SMS_STOP_FOOTER,
} from "./compliance";
import { createDefaultTextMessageSender, getSmsProvider } from "./factory";
import { countSmsSegments } from "./segments";
import { resolveSender } from "./telnyx/sender";

const confirmedEn =
  "{{config.name}}: {{#customerName}}Hi {{customerName}}, your{{/customerName}}{{^customerName}}Your{{/customerName}} {{option.name}} is confirmed for {{dateTime.sms}}.{{#manageLink}} Manage: {{manageLink}}{{/manageLink}}";
const confirmedUk =
  "{{config.name}}: {{#customerName}}Привіт, {{customerName}}, ваш{{/customerName}}{{^customerName}}Ваш{{/customerName}} {{option.name}} підтверджено на {{dateTime.sms}}.";
const reminderEn =
  "This is a reminder for {{option.name}} {{#dateTime.isTomorrow}}tomorrow, {{/dateTime.isTomorrow}}{{^dateTime.isTomorrow}}on {{/dateTime.isTomorrow}}{{dateTime.sms}}.";

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
        option: { name: "Cut" },
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
        option: { name: "Cut" },
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
        option: { name: "Стрижка" },
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
        option: { name: "Cut" },
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
        option: { name: "Cut" },
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
  it("treats a saved template id as enabled when the switch is missing", () => {
    assert.equal(isSmsEnabled(undefined, "template-1"), true);
  });

  it("does not send when the switch is off", () => {
    assert.equal(isSmsEnabled(false, "template-1"), false);
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
