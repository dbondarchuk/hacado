import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isFormattedDateTime,
  summarizeTemplateArgs,
} from "../context/args-summary";

const formattedDateTime = {
  original: new Date("2026-03-15T18:00:00Z"),
  full: "March 15, 2026 at 2:00 PM EDT",
  medium: "Mar 15, 2026, 2:00 PM",
  short: "3/15/2026, 2:00 PM",
  huge: "Sunday, March 15, 2026 at 2:00 PM Eastern Daylight Time",
  date: "March 15, 2026",
  dateHuge: "Sunday, March 15, 2026",
  time: "2:00 PM",
  timeWithSeconds: "2:00:00 PM",
  relative: "in 3 days",
  sms: "Tue 2pm",
  isTomorrow: false,
  iso: "2026-03-15T18:00:00.000Z",
  timestamp: 1773597600000,
  day: { number: 15, text: "Sunday", short: "Sun" },
  month: { number: 3, name: "March", short: "Mar" },
  year: 2026,
  hour: 14,
  minute: 0,
  second: 0,
};

describe("summarizeTemplateArgs", () => {
  it("collects nested mustache-friendly paths", () => {
    const summary = summarizeTemplateArgs({
      customer: { name: "Ada", email: "ada@example.com" },
      addons: [{ name: "Gel" }, { name: "Art" }],
      websiteUrl: "https://example.com",
    });

    assert.ok(summary);
    assert.ok(summary!.roots.includes("customer"));
    assert.ok(summary!.paths.includes("customer.name"));
    assert.ok(summary!.paths.includes("customer.email"));
    assert.ok(summary!.paths.includes("addons"));
    assert.ok(summary!.paths.includes("websiteUrl"));
    assert.equal((summary!.sample.customer as { name: string }).name, "Ada");
  });

  it("collapses formatted datetimes and keeps fields/config/app roots", () => {
    const summary = summarizeTemplateArgs({
      createdAt: formattedDateTime,
      dateTime: formattedDateTime,
      endAt: formattedDateTime,
      member: {
        name: "Sam",
        createdAt: formattedDateTime,
      },
      fields: { name: "Ada", email: "ada@example.com", phone: "+1" },
      config: { name: "Studio", phone: "+1555", email: "hi@studio.test" },
      waitlistEntry: {
        name: "Casey",
        offerSlot: formattedDateTime,
      },
      bookingUrl: "https://example.com/book",
      otp: "123456",
      websiteUrl: "https://example.com",
    });

    assert.ok(summary);
    assert.ok(summary!.roots.includes("fields"));
    assert.ok(summary!.roots.includes("config"));
    assert.ok(summary!.roots.includes("waitlistEntry"));
    assert.ok(summary!.roots.includes("bookingUrl"));

    assert.ok(summary!.paths.includes("dateTime"));
    assert.ok(summary!.paths.includes("fields.name"));
    assert.ok(summary!.paths.includes("config.name"));
    assert.ok(summary!.paths.includes("config.phone"));
    assert.ok(summary!.paths.includes("waitlistEntry.name"));
    assert.ok(summary!.paths.includes("waitlistEntry.offerSlot"));
    assert.ok(summary!.paths.includes("bookingUrl"));

    assert.equal(summary!.paths.includes("dateTime.sms"), false);
    assert.equal(summary!.paths.includes("dateTime.full"), false);
    assert.equal(summary!.paths.includes("member.createdAt.sms"), false);

    assert.ok(summary!.formatting.dateTime.keys.includes("sms"));
    assert.ok(
      summary!.formatting.dateTime.examples.some((example) =>
        example.includes(".sms"),
      ),
    );

    assert.ok(
      summary!.formatting.links.examples.some((example) =>
        example.includes("manageLink"),
      ),
    );

    const dateSample = summary!.sample.dateTime as {
      sms?: string;
      _note?: string;
    };

    assert.equal(dateSample.sms, "Tue 2pm");
    assert.ok(dateSample._note);
  });

  it("detects formatted datetime objects", () => {
    assert.equal(isFormattedDateTime(formattedDateTime), true);
    assert.equal(isFormattedDateTime({ name: "Ada" }), false);
  });

  it("keeps empty keys as listed paths", () => {
    const summary = summarizeTemplateArgs({
      config: { name: "Studio", phone: undefined, email: null },
      fields: { name: "Ada", phone: undefined },
    });

    assert.ok(summary);
    assert.ok(summary!.paths.includes("config.name"));
    assert.ok(summary!.paths.includes("config.phone"));
    assert.ok(summary!.paths.includes("config.email"));
    assert.ok(summary!.paths.includes("fields.phone"));
    assert.equal((summary!.sample.config as { phone: null }).phone, null);
  });

  it("returns undefined for empty args", () => {
    assert.equal(summarizeTemplateArgs({}), undefined);
    assert.equal(summarizeTemplateArgs(null), undefined);
  });
});
