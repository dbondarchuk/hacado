import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withDemoTemplateLinkArgs } from "./demo-template-links";

describe("withDemoTemplateLinkArgs", () => {
  it("fills manageLink and bookingUrl from websiteUrl", () => {
    const next = withDemoTemplateLinkArgs(
      { websiteUrl: "https://salon.hacado.me/" },
      "https://ignored.example",
    );

    assert.equal(next.manageLink, "https://salon.hacado.me/my-cabinet");
    assert.equal(next.bookingUrl, "https://salon.hacado.me/book");
    assert.equal(next.websiteUrl, "https://salon.hacado.me/");
  });

  it("does not overwrite existing link vars", () => {
    const next = withDemoTemplateLinkArgs(
      {
        websiteUrl: "https://salon.hacado.me",
        manageLink: "https://salon.hacado.me/custom",
        bookingUrl: "https://salon.hacado.me/waitlist-book",
      },
      "https://salon.hacado.me",
    );

    assert.equal(next.manageLink, "https://salon.hacado.me/custom");
    assert.equal(next.bookingUrl, "https://salon.hacado.me/waitlist-book");
  });
});
