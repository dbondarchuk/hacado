import { isJsScriptContribution } from "@/utils/app-scripts";
import type { ScriptContribution } from "@hacado/types";
import NextScript from "next/script";

export function AppScriptRenderer({
  script,
  id,
}: {
  script: ScriptContribution;
  id: string | number;
}) {
  const key = script.id || id;
  if (!isJsScriptContribution(script)) {
    if (script.source === "inline") {
      return (
        <script
          id={String(key)}
          type={script.type}
          dangerouslySetInnerHTML={{ __html: script.value }}
        />
      );
    }

    return <script id={String(key)} type={script.type} src={script.url} />;
  }

  if (script.source === "inline") {
    return <NextScript id={String(key)}>{script.value}</NextScript>;
  }

  return <NextScript id={String(key)} src={script.url} />;
}
