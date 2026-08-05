import type { AppTarget } from "@hacado/types";
import { AvailableApps } from "./apps";

/** Resolve install ownership from the catalog (not stored on connected apps). */
export function withCatalogTarget<T extends { name: string }>(
  app: T,
): T & { target: AppTarget } {
  return {
    ...app,
    target: AvailableApps[app.name]?.target ?? "company",
  };
}
