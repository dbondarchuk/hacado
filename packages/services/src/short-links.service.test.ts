import { PlannedShortLink } from "@hacado/utils";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { ShortLinksService } from "./short-links.service";

class RecordingShortLinksService extends ShortLinksService {
  public readonly persistCalls: PlannedShortLink[][] = [];

  protected override async persistShortLinks(links: PlannedShortLink[]) {
    this.persistCalls.push(links);
    return new Map(links.map((link) => [link.url, link.code]));
  }
}

class FailingShortLinksService extends ShortLinksService {
  protected override async persistShortLinks(): Promise<Map<string, string>> {
    throw new Error("mongo down");
  }
}

describe("ShortLinksService", () => {
  const previousShortDomain = process.env.SHORT_DOMAIN;

  before(() => {
    process.env.SHORT_DOMAIN = "haca.do";
  });

  after(() => {
    if (previousShortDomain === undefined) {
      delete process.env.SHORT_DOMAIN;
    } else {
      process.env.SHORT_DOMAIN = previousShortDomain;
    }
  });

  it("dedupes URLs and persists them in one call", async () => {
    const service = new RecordingShortLinksService();
    const body =
      "Book https://salon.hacado.me/book and https://salon.hacado.me/book plus https://admin.example/a";

    const rewritten = await service.shortenUrlsInText(body);

    assert.equal(service.persistCalls.length, 1);
    assert.equal(service.persistCalls[0]?.length, 2);
    assert.deepEqual(
      service.persistCalls[0]?.map((link) => link.url).sort(),
      ["https://admin.example/a", "https://salon.hacado.me/book"].sort(),
    );
    assert.match(
      rewritten,
      /https:\/\/haca\.do\/[23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{8}/,
    );
    assert.equal(rewritten.includes("https://salon.hacado.me/book"), false);
  });

  it("returns the original body when persist fails", async () => {
    const service = new FailingShortLinksService();
    const body = "See https://example.com/path";
    const rewritten = await service.shortenUrlsInText(body);
    assert.equal(rewritten, body);
  });

  it("shortenUrl returns a short link for a single destination", async () => {
    const service = new RecordingShortLinksService();
    const shortUrl = await service.shortenUrl("https://salon.hacado.me/about");
    assert.equal(service.persistCalls.length, 1);
    assert.equal(service.persistCalls[0]?.length, 1);
    assert.match(
      shortUrl,
      /^https:\/\/haca\.do\/[23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{8}$/,
    );
  });
});
