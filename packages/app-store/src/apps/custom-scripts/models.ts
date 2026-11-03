import { resourceSourceType } from "@hacado/types/configuration/resources";
import { zNonEmptyString, zUniqueArray, zUrl } from "@hacado/types/utils";
import * as z from "zod";

export const scriptPlacementSchema = z.enum(["header", "footer"]);
export type ScriptPlacement = z.infer<typeof scriptPlacementSchema>;

export const scriptStrategySchema = z.enum(["async", "defer"]);
export type ScriptStrategy = z.infer<typeof scriptStrategySchema>;

const customScriptBaseSchema = z.object({
  name: zNonEmptyString(
    "app_custom-scripts_admin.validation.name.required",
    1,
    128,
    "app_custom-scripts_admin.validation.name.maxLength",
  ),
  enabled: z.coerce.boolean<boolean>().default(true),
  placement: scriptPlacementSchema.default("header"),
  pageIds: z.array(z.string()).default([]),
  /** Re-run after soft navigations; off by default (full page load only). */
  runOnEveryPage: z.coerce.boolean<boolean>().default(false),
});

export const customInlineScriptSchema = customScriptBaseSchema.extend({
  source: resourceSourceType.extract(["inline"]),
  value: zNonEmptyString("configuration.resources.value.required"),
});

export const customRemoteScriptSchema = customScriptBaseSchema.extend({
  source: resourceSourceType.extract(["remote"]),
  url: zUrl,
  strategy: scriptStrategySchema.default("defer"),
});

export const customScriptSchema = z.discriminatedUnion("source", [
  customInlineScriptSchema,
  customRemoteScriptSchema,
]);

export type CustomScript = z.infer<typeof customScriptSchema>;

export const customScriptsConfigurationSchema = z.object({
  scripts: zUniqueArray(
    z.array(customScriptSchema),
    (script) => script.name.trim().toLowerCase(),
    "app_custom-scripts_admin.validation.name.unique",
    ["name"],
  ).default([]),
});

export type CustomScriptsConfiguration = z.infer<
  typeof customScriptsConfigurationSchema
>;

export const SetConfigurationActionType = "set-configuration" as const;

export const setConfigurationActionSchema = z.object({
  type: z.literal(SetConfigurationActionType),
  configuration: customScriptsConfigurationSchema,
});

export type SetConfigurationAction = z.infer<
  typeof setConfigurationActionSchema
>;

export const requestActionSchema = setConfigurationActionSchema;

export type RequestAction = SetConfigurationAction;

export function nextUniqueScriptName(existingNames: string[]): string {
  const used = new Set(
    existingNames.map((name) => name.trim().toLowerCase()).filter(Boolean),
  );

  let n = existingNames.length + 1;

  while (used.has(`script ${n}`)) {
    n += 1;
  }

  return `Script ${n}`;
}
