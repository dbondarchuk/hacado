"use client";

import { AddOrUpdateAppButton } from "@/components/admin/apps/add-or-update-app-dialog";
import type { AllKeys } from "@hacado/i18n";
import { useI18n } from "@hacado/i18n/client";
import type { ConnectedApp, NeedsAttentionLevel } from "@hacado/types";
import { Button, cn, Link } from "@hacado/ui";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  OctagonAlert,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import type { NeedsAttentionRow } from "./collect-needs-attention";
import { dismissNeedsAttentionAction } from "./needs-attention-actions";

const levelStyles: Record<
  NeedsAttentionLevel,
  { row: string; icon: string; Icon: typeof Info }
> = {
  info: {
    row: "border-border/70 bg-card",
    icon: "text-primary",
    Icon: Info,
  },
  warning: {
    row: "border-amber-500/40 bg-amber-500/5",
    icon: "text-amber-600 dark:text-amber-400",
    Icon: AlertTriangle,
  },
  error: {
    row: "border-destructive/40 bg-destructive/5",
    icon: "text-destructive",
    Icon: OctagonAlert,
  },
};

function translateI18n(
  t: (key: AllKeys, args?: Record<string, string | number>) => string,
  value: { key: string; args?: Record<string, string | number> },
) {
  return t(value.key as AllKeys, value.args);
}

function NeedsAttentionRowView({ item }: { item: NeedsAttentionRow }) {
  const t = useI18n();
  const tAdmin = useI18n("admin");
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const style = levelStyles[item.level];
  const Icon = style.Icon;

  const onDismiss = async () => {
    setPending(true);
    const result = await dismissNeedsAttentionAction(item.compositeKey);
    setPending(false);
    if (result.ok) {
      router.refresh();
    }
  };

  let actionNode: React.ReactNode = null;
  if (item.action?.type === "link") {
    actionNode = (
      <Link
        href={item.action.href}
        variant="underline"
        className="inline-flex items-center gap-1 text-sm shrink-0"
      >
        {translateI18n(t, item.action.label)}
        <ChevronRight className="size-3.5" />
      </Link>
    );
  } else if (item.action?.type === "update-app" && item.app) {
    actionNode = (
      <AddOrUpdateAppButton app={item.app as ConnectedApp} refreshOnClose>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
        >
          {translateI18n(t, item.action.label)}
        </Button>
      </AddOrUpdateAppButton>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center",
        style.row,
      )}
    >
      <div className={cn("shrink-0", style.icon)}>
        <Icon className="size-5" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-medium text-foreground">
          {translateI18n(t, item.title)}
        </p>
        <p className="text-sm text-muted-foreground">
          {translateI18n(t, item.description)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actionNode}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          disabled={pending}
          aria-label={tAdmin("dashboard.needsAttention.dismiss")}
          onClick={() => {
            void onDismiss();
          }}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function NeedsAttentionList({ items }: { items: NeedsAttentionRow[] }) {
  const t = useI18n("admin");

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
        {t("dashboard.needsAttention.title")}
      </h2>
      {!items.length ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
          <CheckCircle2
            className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
            strokeWidth={1.5}
          />
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium text-foreground">
              {t("dashboard.needsAttention.allClear.title")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.needsAttention.allClear.description")}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <NeedsAttentionRowView key={item.compositeKey} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
