"use client";

import {} from "@/app/dashboard/notifications-toast-stream";
import { ActivityActorDisplayView } from "@/components/admin/activity/actor-display";
import { useActivityFeedStore } from "@/notifications/store";
import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import type { ActivityFeedPreview, ActivitySeverity } from "@hacado/types";
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hacado/ui";
import { ResolvedI18nText } from "@hacado/ui-admin";
import { Activity, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

function severityDotBg(severity: ActivitySeverity): string {
  switch (severity) {
    case "error":
      return "bg-destructive";
    case "warning":
      return "bg-amber-500";
    case "success":
      return "bg-emerald-500";
    case "info":
    default:
      return "bg-primary";
  }
}

/** Small dot when there are unread activity items (replaces numeric badge on header). */
const ActivityUnreadDot: React.FC = () => {
  const { highestSeverity } = useActivityFeedStore();

  if (!highestSeverity) {
    return null;
  }

  const bg = severityDotBg(highestSeverity);
  return (
    <span
      className="absolute top-1 right-1 flex size-3 items-center justify-center"
      aria-hidden
    >
      <span
        className={cn(
          "absolute inline-flex size-full animate-ping rounded-full opacity-60",
          bg,
        )}
      />
      <span
        className={cn(
          "relative size-2 animate-pulse rounded-full ring-2 ring-background",
          bg,
        )}
      />
    </span>
  );
};

export const ActivityFeedHeaderButton: React.FC = () => {
  const t = useI18n("admin");
  const router = useRouter();
  const { previews, clearSeverity } = useActivityFeedStore();

  const onOpenChange = (open: boolean) => {
    if (open) {
      void adminApi.activities.markActivityFeedRead().then(() => {
        clearSeverity();
      });
    }
  };

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative size-9 rounded-full border-border/70"
          aria-label={t("activity.header.openFeed")}
        >
          <Activity className="size-4 stroke-[1.5]" />
          <ActivityUnreadDot />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t("activity.header.recent")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {previews.length === 0 ? (
          <div className="px-2 py-3 text-base text-muted-foreground">
            {t("activity.header.empty")}
          </div>
        ) : (
          previews.map((row) => (
            <ActivityPreviewRow key={row.id} row={row} router={router} />
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <NextLink
            href="/dashboard/activity"
            className="flex w-full items-center justify-between gap-2 hover:text-foreground/80"
          >
            {t("activity.header.viewAll")}
            <ChevronRight className="size-4" />
          </NextLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ActivityPreviewRow: React.FC<{
  row: ActivityFeedPreview;
  router: ReturnType<typeof useRouter>;
}> = ({ row, router }) => {
  return (
    <DropdownMenuItem
      className="flex flex-col items-start gap-1 cursor-pointer group/activity-preview-row"
      onClick={() => {
        if (row.link) {
          router.push(row.link);
        } else {
          router.push("/dashboard/activity");
        }
      }}
    >
      <span className="text-sm text-muted-foreground font-mono">
        {row.eventType}
      </span>
      <ActivityActorDisplayView
        actor={row.actor}
        className="text-sm text-muted-foreground"
      />
      <span className="text-sm line-clamp-2">
        <ResolvedI18nText text={row.title} />
      </span>
      <span className="text-sm text-muted-foreground">
        {DateTime.fromISO(row.createdAt).toLocaleString(
          DateTime.DATETIME_SHORT,
        )}
      </span>
    </DropdownMenuItem>
  );
};
