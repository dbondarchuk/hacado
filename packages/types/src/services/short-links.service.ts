export type ShortLink = {
  code: string;
  url: string;
  createdAt: Date;
};

export interface IShortLinksService {
  getShortLinkByCode(code: string): Promise<ShortLink | null>;
  shortenUrl(url: string): Promise<string>;
  shortenUrlsInText(body: string): Promise<string>;
}
