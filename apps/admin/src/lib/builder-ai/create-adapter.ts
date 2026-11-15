import { AppsBlocksSchemas } from "@hacado/app-store/blocks/schemas";
import {
  createAdapterFromCatalog,
  mergeBlockCatalogs,
  type BlockCatalogEntry,
  type BuilderAIAdapter,
  type BuilderKind,
  type StyleCatalogEntry,
} from "@hacado/builder-ai";
import type { BuilderSchema } from "@hacado/builder/types";
import { EditorBlocksSchema as EmailSchemas } from "@hacado/email-builder/blocks/schema";
import { allStyles } from "@hacado/page-builder-base/style";
import { EditorBlocksSchema as PageSchemas } from "@hacado/page-builder/blocks/schema";

export type ConnectedAppRef = {
  appId: string;
  appName: string;
};

function inferTags(type: string): string[] {
  const lower = type.toLowerCase();
  const tags: string[] = [];

  if (lower.includes("text") || lower.includes("heading")) tags.push("text");
  if (lower.includes("image") || lower.includes("video")) tags.push("image");
  if (
    lower.includes("container") ||
    lower.includes("layout") ||
    lower.includes("grid") ||
    lower.includes("columns")
  ) {
    tags.push("layout");
  }

  return tags;
}

function catalogFromSchemas(
  schemas: BuilderSchema,
  providerName: string,
  extras?: Partial<
    Record<
      string,
      Pick<
        BlockCatalogEntry,
        "allowedBuilderTypes" | "tags" | "capabilities" | "allowedIn"
      >
    >
  >,
): BlockCatalogEntry[] {
  return Object.entries(schemas).map(([type, schema]) => ({
    type,
    displayName: type,
    category: providerName === "core" ? "blocks" : "apps",
    tags: extras?.[type]?.tags ?? inferTags(type),
    capabilities: extras?.[type]?.capabilities,
    allowedIn: extras?.[type]?.allowedIn,
    allowedBuilderTypes: extras?.[type]?.allowedBuilderTypes,
    providerName,
    schema,
  }));
}

function styleCatalogFromPageBuilder(): StyleCatalogEntry[] {
  return allStyles.map((style) => ({
    name: String(style.name),
    category: style.category ? String(style.category) : undefined,
    description: style.label ? String(style.label) : undefined,
    responsive: Boolean((style as { responsive?: boolean }).responsive),
  }));
}

function appBlockCatalog(
  apps: ConnectedAppRef[] | undefined,
  builder: "page" | "footer",
): BlockCatalogEntry[] {
  if (!apps?.length) return [];

  return apps.flatMap((app) => {
    const catalog = AppsBlocksSchemas[app.appName];

    if (!catalog) return [];

    return Object.entries(catalog.schemas)
      .filter(([type]) => {
        if (builder === "footer") return catalog.allowedInFooter[type];

        return true;
      })
      .map(([type, schema]) => ({
        type,
        displayName: type,
        category: "apps",
        tags: inferTags(type),
        providerName: app.appName,
        schema,
      }));
  });
}

export function createAdminBuilderAIAdapter(input: {
  builder: BuilderKind;
  apps?: ConnectedAppRef[];
}): BuilderAIAdapter {
  if (input.builder === "email") {
    return createAdapterFromCatalog({
      builder: "email",
      blocks: catalogFromSchemas(EmailSchemas, "core"),
      styles: [],
      cacheKeyPrefix: "email",
    });
  }

  const core = catalogFromSchemas(PageSchemas, "core");
  const apps = appBlockCatalog(
    input.apps,
    input.builder === "footer" ? "footer" : "page",
  );

  return createAdapterFromCatalog({
    builder: input.builder,
    blocks: mergeBlockCatalogs(core, apps),
    styles: styleCatalogFromPageBuilder(),
    cacheKeyPrefix: `${input.builder}:${(input.apps ?? [])
      .map((app) => app.appName)
      .sort()
      .join(",")}`,
  });
}
