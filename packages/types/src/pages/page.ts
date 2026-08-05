import { languages } from "@hacado/i18n";
import * as z from "zod";
import { WithDatabaseId, WithOrganizationId } from "../database";
import { Prettify, zNonEmptyString } from "../utils";

export const pageTagSchema = zNonEmptyString(
  "validation.page.tag.min",
  3,
  64,
  "validation.page.tag.max",
);
const notAllowedSlugs = ["admin", "assets", "api"];

export const pageSchema = z.object({
  title: zNonEmptyString(
    "validation.page.title.required",
    2,
    256,
    "validation.page.title.max",
  ),
  // content: z.string().min(1, "page.content.required"),
  content: z.any().optional(),
  slug: zNonEmptyString("validation.page.slug.required")
    // .regex(/^[a-z0-9]+(?:[-\/][a-z0-9]+)*$/g, "page.slug.invalid")
    .regex(
      /^(?:[a-z0-9-]+|\[(?:\.{3})?[a-zA-Z0-9_-]+\])(\/(?:[a-z0-9-]+|\[(?:\.{3})?[a-zA-Z0-9_-]+\]))*$/g,
      "validation.page.slug.invalid",
    )
    .max(1024, "validation.page.slug.max")
    .refine(
      (slug) =>
        !notAllowedSlugs.some(
          (notAllowedSlug) =>
            slug.startsWith(notAllowedSlug + "/") || slug === notAllowedSlug,
        ),
      { message: "validation.page.slug.notAllowed" },
    ),
  description: zNonEmptyString(
    "validation.page.description.required",
    1,
    1024,
    "validation.page.description.max",
  ),
  keywords: zNonEmptyString(
    "validation.page.keywords.required",
    1,
    1024,
    "validation.page.keywords.max",
  ),
  published: z.coerce.boolean<boolean>(),
  publishDate: z.coerce.date<Date>({
    error: "validation.page.publishDate.required",
  }),
  tags: z.array(pageTagSchema).optional(),
  language: z.enum(languages).optional().nullable(),
  doNotCombine: z
    .object({
      title: z.coerce.boolean<boolean>().optional(),
      description: z.coerce.boolean<boolean>().optional(),
      keywords: z.coerce.boolean<boolean>().optional(),
    })
    .optional(),
  fullWidth: z.coerce.boolean<boolean>().optional(),
  headerId: z.string().optional(),
  footerId: z.string().optional(),
});

export const getPageSchemaWithUniqueCheck = (
  uniqueSlugCheckFn: (slug: string, id?: string) => Promise<boolean>,
  message: string,
) => {
  return z.object({
    ...pageSchema.shape,
    slug: pageSchema.shape.slug.refine(uniqueSlugCheckFn, { message }),
  });
};

export type PageUpdateModel = z.infer<typeof pageSchema>;

export type Page = Prettify<
  WithOrganizationId<WithDatabaseId<PageUpdateModel>> & {
    createdAt: Date;
    updatedAt: Date;
  }
>;

export type PageMatchResult = {
  page: Page;
  params: Record<string, string>;
};

export type PageListModel = Omit<Page, "content">;
export type PageListModelWithUrl = PageListModel & {
  url: string;
};
