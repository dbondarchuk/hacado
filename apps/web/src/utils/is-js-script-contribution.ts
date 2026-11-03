import type { ScriptContribution } from "@hacado/types/apps";

export function isJsScriptContribution(script: ScriptContribution): boolean {
  if (!script.type) return true;

  const normalized = script.type.toLowerCase();

  return (
    normalized === "text/javascript" ||
    normalized === "application/javascript" ||
    normalized === "module"
  );
}
