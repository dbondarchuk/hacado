"use client";

import { isJsScriptContribution } from "@/utils/is-js-script-contribution";
import type { ScriptContribution } from "@hacado/types/apps";
import { usePathname } from "next/navigation";
import NextScript from "next/script";
import { useEffect } from "react";

type PendingScriptRemoval = {
  timer: ReturnType<typeof setTimeout>;
  runKey: string;
};

/** Defers DOM removal so React Strict Mode remounts can reclaim the same injection. */
const pendingScriptRemovals = new Map<string, PendingScriptRemoval>();

function StaticAppScript({
  script,
  id,
}: {
  script: ScriptContribution;
  id: string;
}) {
  if (!isJsScriptContribution(script)) {
    if (script.source === "inline") {
      return (
        <script
          id={id}
          type={script.type}
          dangerouslySetInnerHTML={{ __html: script.value }}
        />
      );
    }

    return <script id={id} type={script.type} src={script.url} />;
  }

  if (script.source === "inline") {
    return <NextScript id={id}>{script.value}</NextScript>;
  }

  if (script.async || script.defer) {
    return (
      <script
        id={id}
        src={script.url}
        async={script.async || undefined}
        defer={script.defer || undefined}
      />
    );
  }

  return <NextScript id={id} src={script.url} />;
}

function scriptContentKey(script: ScriptContribution): string {
  if (script.source === "inline") {
    return `inline:${script.type ?? ""}:${script.value}`;
  }

  return `remote:${script.type ?? ""}:${script.url}:${script.async ? "1" : "0"}:${script.defer ? "1" : "0"}`;
}

function NavigationScriptExecutor({
  script,
  scriptId,
  pathname,
  mount,
}: {
  script: ScriptContribution;
  scriptId: string;
  pathname: string;
  mount: "head" | "body";
}) {
  const type = script.type;
  const source = script.source;
  const inlineValue = script.source === "inline" ? script.value : undefined;
  const remoteUrl = script.source === "remote" ? script.url : undefined;
  const async = script.source === "remote" ? script.async : undefined;
  const defer = script.source === "remote" ? script.defer : undefined;
  const contentKey = scriptContentKey(script);
  const runKey = `${scriptId}::${pathname}::${contentKey}`;

  useEffect(() => {
    const scheduleRemoval = (el: Element) => () => {
      const timer = setTimeout(() => {
        if (document.getElementById(scriptId) === el) {
          el.remove();
        }

        pendingScriptRemovals.delete(scriptId);
      }, 0);

      pendingScriptRemovals.set(scriptId, { timer, runKey });
    };

    const pending = pendingScriptRemovals.get(scriptId);

    if (pending) {
      clearTimeout(pending.timer);
      pendingScriptRemovals.delete(scriptId);

      const existing = document.getElementById(scriptId);

      // Strict Mode remount for the same navigation — keep the existing node.
      if (pending.runKey === runKey && existing) {
        return scheduleRemoval(existing);
      }
    }

    const existing = document.getElementById(
      scriptId,
    ) as HTMLScriptElement | null;

    if (existing?.dataset.runKey === runKey) {
      return scheduleRemoval(existing);
    }

    existing?.remove();

    const el = document.createElement("script");
    el.id = scriptId;
    el.dataset.runKey = runKey;

    if (type) {
      el.type = type;
    }

    if (source === "inline" && inlineValue !== undefined) {
      el.text = inlineValue;
    } else if (remoteUrl) {
      el.src = remoteUrl;
      if (async) el.async = true;
      if (defer) el.defer = true;
    }

    const parent = mount === "head" ? document.head : document.body;
    parent.appendChild(el);

    return scheduleRemoval(el);
    // Primitives only: the `script` object is new on every RSC render and would
    // re-fire after pathname on soft navigations (and again under Strict Mode).
  }, [
    scriptId,
    mount,
    runKey,
    type,
    source,
    inlineValue,
    remoteUrl,
    async,
    defer,
  ]);

  return null;
}

export function AppScriptRenderer({
  script,
  id,
  mount = "body",
}: {
  script: ScriptContribution;
  id: string | number;
  /** Where to inject DOM scripts that re-run on navigation. */
  mount?: "head" | "body";
}) {
  const scriptId = String(script.id || id);
  const pathname = usePathname();

  if (script.runOnEveryPage && isJsScriptContribution(script)) {
    return (
      <NavigationScriptExecutor
        script={script}
        scriptId={scriptId}
        pathname={pathname}
        mount={mount}
      />
    );
  }

  return <StaticAppScript script={script} id={scriptId} />;
}
