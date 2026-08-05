"use client";

import { useI18n } from "@hacado/i18n/client";
import type { ActivityActorDisplay } from "@hacado/types";
import { cn, Link } from "@hacado/ui";
import { CustomerName } from "@hacado/ui-admin";
import React from "react";

export const ActivityActorDisplayView: React.FC<{
  actor: ActivityActorDisplay;
  className?: string;
}> = ({ actor, className }) => {
  const t = useI18n("admin");
  switch (actor.kind) {
    case "system":
      return (
        <span className={cn("text-sm", className)}>
          {t("activity.actor.system")}
        </span>
      );
    case "member":
      return (
        <span className={cn("text-sm", className)}>
          {t("activity.actor.member", { name: actor.name })}
        </span>
      );
    case "visitor":
      return (
        <span className={cn("text-sm", className)}>
          {t("activity.actor.visitor", { name: actor.name })}
        </span>
      );
    case "customer":
      return (
        <span
          className={cn("text-sm inline-flex items-center gap-1", className)}
        >
          {t.rich("activity.actor.customer", {
            link: () => (
              <Link
                href={`/dashboard/customers/${actor.customerId}`}
                onClick={(e) => e.stopPropagation()}
                variant="underline"
                className="group-focus/activity-preview-row:text-foreground/80"
              >
                <CustomerName customer={actor} />
              </Link>
            ),
          })}
        </span>
      );
  }
};
