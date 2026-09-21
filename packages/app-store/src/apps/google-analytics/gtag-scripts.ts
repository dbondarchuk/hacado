import type { ScriptContribution } from "@hacado/types";

export function buildGtagScripts(measurementId: string): ScriptContribution[] {
  return [
    {
      id: `gtag-js-${measurementId}`,
      source: "remote",
      url: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`,
    },
    {
      id: `gtag-config-${measurementId}`,
      source: "inline",
      value: [
        "window.dataLayer = window.dataLayer || [];",
        "function gtag(){dataLayer.push(arguments);}",
        "gtag('js', new Date());",
        `gtag('config', ${JSON.stringify(measurementId)});`,
      ].join("\n"),
    },
  ];
}
