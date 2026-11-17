import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDocumentSettingsProposal,
  normalizeDocumentSettingsPatch,
} from "../operations/settings";

describe("document settings proposals", () => {
  it("accepts page headerId and footerId", () => {
    const normalized = normalizeDocumentSettingsPatch("page", {
      title: "Gel Strengthening",
      slug: "gel-strengthening",
      description: "Service page",
      keywords: "nails, gel",
      headerId: "header-1",
      footerId: "footer-1",
    });

    assert.equal(normalized.issues.length, 0);
    assert.deepEqual(normalized.settings, {
      title: "Gel Strengthening",
      slug: "gel-strengthening",
      description: "Service page",
      keywords: "nails, gel",
      headerId: "header-1",
      footerId: "footer-1",
    });
  });

  it("requires email name and subject fields when provided together", () => {
    const result = buildDocumentSettingsProposal({
      builder: "email",
      summary: "Set email identity",
      settings: {
        name: "Appointment confirmed",
        subject: "Your visit is confirmed, {{fields.name}}",
      },
    });

    assert.equal(result.validation.valid, true);
    assert.equal(result.proposal.settings.name, "Appointment confirmed");
    assert.match(String(result.proposal.settings.subject), /confirmed/);
  });

  it("rejects headerId on email builder", () => {
    const normalized = normalizeDocumentSettingsPatch("email", {
      name: "Welcome",
      headerId: "header-1",
    });

    assert.ok(normalized.issues.some((issue) => issue.path === "settings.headerId"));
  });
});
