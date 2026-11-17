import {
  catalogFromEditorBlocks,
  createAdapterFromCatalog,
  mergeBlockCatalogs,
  resolveCatalogDefaultValue,
  type BlockCatalogEntry,
  type BuilderAIAdapter,
  type BuilderKind,
} from "@hacado/ai-builder-core";
import { AppsBlocksEditors } from "@hacado/app-store/blocks/editors";
import { EditorBlocks } from "@hacado/page-builder/blocks";
import { EditorBlocksSchema as PageSchemas } from "@hacado/page-builder/blocks/schema";
import { connectedAppMetadata, type ConnectedAppRef } from "./connected-apps";
import {
  designTokensFromPageBuilder,
  styleCatalogFromPageBuilder,
} from "./style-catalog";

export type { ConnectedAppRef } from "./connected-apps";
export {
  designTokensFromPageBuilder,
  styleCatalogFromPageBuilder,
} from "./style-catalog";

/**
 * Build AI catalog entries from installed apps using each app's editor registry
 * (capabilities, tags, allowedIn/allowedChildren) - not a parallel hand-maintained map.
 */
function appBlockCatalog(
  apps: ConnectedAppRef[] | undefined,
  builder: "page" | "footer",
): BlockCatalogEntry[] {
  if (!apps?.length) return [];

  return apps.flatMap((app) => {
    const catalog = AppsBlocksEditors[app.appName];

    if (!catalog) return [];

    return Object.entries(catalog)
      .filter(([, entry]) => {
        if (builder === "footer") return entry.allowedInFooter;

        return true;
      })
      .map(([type, entry]) => {
        const editor = entry.editor;

        return {
          type,
          displayName: String(editor?.displayName ?? type),
          category: String(editor?.category ?? "apps"),
          tags: editor?.tags,
          capabilities: editor?.capabilities,
          aiCapabilities: editor?.aiCapabilities,
          allowedIn: editor?.allowedIn,
          allowedChildren: editor?.allowedChildren,
          allowedBuilderTypes: editor?.allowedBuilderTypes,
          hideInBlocksPanel: editor?.hideInBlocksPanel,
          providerName: app.appName,
          schema: entry.schema,
          defaultValue: resolveCatalogDefaultValue(editor?.defaultValue),
          defaultMetadata:
            entry.defaultMetadata?.(app.appName, app.appId) ??
            connectedAppMetadata(app.appName, app.appId),
        } satisfies BlockCatalogEntry;
      });
  });
}

export function createPageBuilderAIAdapter(input: {
  builder: Extract<BuilderKind, "page" | "footer">;
  apps?: ConnectedAppRef[];
}): BuilderAIAdapter {
  const core = catalogFromEditorBlocks({
    schemas: PageSchemas,
    editors: EditorBlocks,
    providerName: "core",
  });

  const apps = appBlockCatalog(
    input.apps,
    input.builder === "footer" ? "footer" : "page",
  );

  return createAdapterFromCatalog({
    builder: input.builder,
    blocks: mergeBlockCatalogs(core, apps),
    styles: styleCatalogFromPageBuilder(),
    designTokens: designTokensFromPageBuilder(),
    cacheKeyPrefix: `${input.builder}:${(input.apps ?? [])
      .map((app) => app.appName)
      .sort()
      .join(",")}`,
  });
}
