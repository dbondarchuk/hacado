import { getLoggerFactory } from "@hacado/logger";
import { IShortLinksService, ShortLink } from "@hacado/types";
import {
  buildShortLinkUrl,
  getShortDomain,
  PlannedShortLink,
  planSmsShortLinks,
  rewriteUrlsInText,
  urlToShortCode,
} from "@hacado/utils";
import { AnyBulkWriteOperation, MongoBulkWriteError } from "mongodb";
import { SHORT_LINKS_COLLECTION_NAME } from "./collections";
import { getDbConnection } from "./database";

const MAX_CODE_LENGTH = 16;

export class ShortLinksService implements IShortLinksService {
  protected readonly loggerFactory = getLoggerFactory("ShortLinksService");

  public async getShortLinkByCode(code: string): Promise<ShortLink | null> {
    const logger = this.loggerFactory("getShortLinkByCode");
    logger.debug({ code }, "Looking up short link");
    const db = await getDbConnection();
    const shortLink = await db
      .collection<ShortLink>(SHORT_LINKS_COLLECTION_NAME)
      .findOne({ code });
    logger.debug({ code, found: Boolean(shortLink) }, "Short link lookup");
    return shortLink;
  }

  public async shortenUrl(url: string): Promise<string> {
    const logger = this.loggerFactory("shortenUrl");
    const shortDomain = getShortDomain();
    const planned = planSmsShortLinks(url, shortDomain);
    if (planned.length === 0) {
      return url;
    }

    const codesByUrl = await this.persistShortLinks(planned);
    const code = codesByUrl.get(planned[0]!.url);
    if (!code) {
      throw new Error("Failed to shorten URL");
    }

    const shortUrl = buildShortLinkUrl(code, shortDomain);
    logger.debug({ url, shortUrl }, "Shortened URL");
    return shortUrl;
  }

  public async shortenUrlsInText(body: string): Promise<string> {
    const logger = this.loggerFactory("shortenUrlsInText");
    const shortDomain = getShortDomain();
    const planned = planSmsShortLinks(body, shortDomain);
    if (planned.length === 0) {
      return body;
    }

    try {
      const codesByUrl = await this.persistShortLinks(planned);
      const shortUrlByOriginal = new Map(
        [...codesByUrl.entries()].map(([url, code]) => [
          url,
          buildShortLinkUrl(code, shortDomain),
        ]),
      );
      return rewriteUrlsInText(body, shortUrlByOriginal, shortDomain);
    } catch (error) {
      logger.error(
        { error },
        "Failed to shorten SMS links; sending original body",
      );
      return body;
    }
  }

  protected async persistShortLinks(
    links: PlannedShortLink[],
  ): Promise<Map<string, string>> {
    const codesByUrl = mapCodesByUrl(links);
    await this.upsertShortLinks(links, codesByUrl);
    return codesByUrl;
  }

  private async upsertShortLinks(
    links: PlannedShortLink[],
    codesByUrl: Map<string, string>,
  ): Promise<void> {
    if (links.length === 0) {
      return;
    }

    const db = await getDbConnection();
    const collection = db.collection<ShortLink>(SHORT_LINKS_COLLECTION_NAME);
    const createdAt = new Date();
    const operations: AnyBulkWriteOperation<ShortLink>[] = links.map(
      (link) => ({
        updateOne: {
          filter: { url: link.url },
          update: {
            $setOnInsert: {
              code: link.code,
              url: link.url,
              createdAt,
            },
          },
          upsert: true,
        },
      }),
    );

    try {
      await collection.bulkWrite(operations, { ordered: false });
    } catch (error) {
      const toRetry = resolveCollisions(error, links, codesByUrl);
      if (toRetry === null) {
        throw error;
      }
      await this.upsertShortLinks(toRetry, codesByUrl);
    }
  }
}

function mapCodesByUrl(links: PlannedShortLink[]): Map<string, string> {
  return new Map(links.map((link) => [link.url, link.code]));
}

function resolveCollisions(
  error: unknown,
  links: PlannedShortLink[],
  codesByUrl: Map<string, string>,
): PlannedShortLink[] | null {
  const writeErrors = getWriteErrors(error);
  if (writeErrors.length === 0) {
    return null;
  }

  const toRetry: PlannedShortLink[] = [];
  for (const writeError of writeErrors) {
    if (writeError.code !== 11000) {
      return null;
    }
    if (isUrlIndexDuplicate(writeError.errmsg)) {
      continue;
    }
    if (!isCodeIndexDuplicate(writeError.errmsg)) {
      return null;
    }
    const link = links[writeError.index];
    if (!link) {
      return null;
    }
    const nextLength = link.code.length + 1;
    if (nextLength > MAX_CODE_LENGTH) {
      return null;
    }
    const nextCode = urlToShortCode(link.url, nextLength);
    codesByUrl.set(link.url, nextCode);
    toRetry.push({ url: link.url, code: nextCode });
  }

  return toRetry;
}

function getWriteErrors(
  error: unknown,
): { index: number; code: number; errmsg: string }[] {
  if (!(error instanceof MongoBulkWriteError)) {
    return [];
  }
  const writeErrors = error.writeErrors;
  const list = Array.isArray(writeErrors)
    ? writeErrors
    : writeErrors
      ? [writeErrors]
      : [];
  return list.map((writeError) => ({
    index: writeError.index,
    code: writeError.code,
    errmsg: writeError.errmsg ?? "",
  }));
}

function isCodeIndexDuplicate(errmsg: string): boolean {
  return /index:\s*code_1\b/.test(errmsg) || /dup key: \{ code:/.test(errmsg);
}

function isUrlIndexDuplicate(errmsg: string): boolean {
  return /index:\s*url_1\b/.test(errmsg) || /dup key: \{ url:/.test(errmsg);
}
