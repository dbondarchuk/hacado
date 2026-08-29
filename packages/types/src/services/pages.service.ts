import { Query, WithTotal } from "../database";
import type { EventSource } from "../events/envelope";
import {
  Page,
  PageFooter,
  PageFooterListModel,
  PageFooterUpdateModel,
  PageHeader,
  PageHeaderListModel,
  PageHeaderUpdateModel,
  PageListModel,
  PageMatchResult,
  PageUpdateModel,
} from "../pages";

export interface IPagesService {
  /** Pages */

  getPage(id: string): Promise<Page | null>;
  getPageBySlug(slug: string): Promise<Page | null>;
  resolvePage(rawSlug: string): Promise<PageMatchResult | null>;
  getPages(
    query: Query & {
      publishStatus?: boolean[];
      maxPublishDate?: Date;
      tags?: string[];
      priorityIds?: string[];
    },
  ): Promise<WithTotal<PageListModel>>;
  createPage(page: PageUpdateModel, source: EventSource): Promise<Page>;
  updatePage(
    id: string,
    update: PageUpdateModel,
    source: EventSource,
  ): Promise<void>;
  deletePage(id: string, source: EventSource): Promise<Page | null>;
  deletePages(ids: string[], source: EventSource): Promise<void>;
  checkUniqueSlug(slug: string, id?: string): Promise<boolean>;

  /** Page Headers */

  getPageHeader(id: string): Promise<PageHeader | null>;
  getPageHeaders(
    query: Query & { priorityIds?: string[] },
  ): Promise<WithTotal<PageHeaderListModel>>;
  createPageHeader(
    pageHeader: PageHeaderUpdateModel,
    source: EventSource,
  ): Promise<PageHeader>;
  updatePageHeader(
    id: string,
    update: PageHeaderUpdateModel,
    source: EventSource,
  ): Promise<void>;
  deletePageHeader(id: string, source: EventSource): Promise<PageHeader | null>;
  deletePageHeaders(ids: string[], source: EventSource): Promise<void>;
  checkUniquePageHeaderName(name: string, id?: string): Promise<boolean>;

  /** Page Footers */

  getPageFooter(id: string): Promise<PageFooter | null>;
  getPageFooters(
    query: Query & { priorityIds?: string[] },
  ): Promise<WithTotal<PageFooterListModel>>;
  createPageFooter(
    pageFooter: PageFooterUpdateModel,
    source: EventSource,
  ): Promise<PageFooter>;
  updatePageFooter(
    id: string,
    update: PageFooterUpdateModel,
    source: EventSource,
  ): Promise<void>;
  deletePageFooter(id: string, source: EventSource): Promise<PageFooter | null>;
  deletePageFooters(ids: string[], source: EventSource): Promise<void>;
  checkUniquePageFooterName(name: string, id?: string): Promise<boolean>;
}
