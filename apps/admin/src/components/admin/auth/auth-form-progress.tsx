"use client";

import { useI18n } from "@hacado/i18n/client";
import { Progress, cn } from "@hacado/ui";
import { Check } from "lucide-react";

export const AuthFormProgress = ({
  steps,
  currentStepId,
}: {
  steps: { id: string; label: string }[];
  currentStepId: string;
}) => {
  const t = useI18n("admin");
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === currentStepId),
  );
  const total = steps.length;
  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);
  const currentLabel = steps[currentIndex]?.label ?? "";
  const connectorFillPercent =
    total <= 1 ? 0 : (currentIndex / (total - 1)) * 100;

  return (
    <div className="mb-4 flex w-full flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{currentLabel}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {t("auth.signUp.progress.stepOf", {
            step: String(currentIndex + 1),
            total: String(total),
          })}
        </p>
      </div>
      <Progress value={progressPercent} className="h-1.5" />
      <ol
        className="relative flex w-full items-center justify-between"
        aria-hidden
      >
        <div
          className="pointer-events-none absolute top-1/2 right-3 left-3 h-0.5 -translate-y-1/2 rounded-full bg-muted"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-1/2 left-3 h-0.5 -translate-y-1/2 rounded-full bg-primary transition-all duration-300"
          style={{
            width:
              total <= 1
                ? "0%"
                : `calc((100% - 1.5rem) * ${connectorFillPercent / 100})`,
          }}
          aria-hidden
        />
        {steps.map((step, index) => {
          const completed = index < currentIndex;
          const current = index === currentIndex;
          return (
            <li key={step.id} className="relative z-10">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                  completed && "bg-primary text-primary-foreground",
                  current &&
                    "bg-primary text-primary-foreground ring-2 ring-primary/25",
                  !completed && !current && "bg-muted text-muted-foreground",
                )}
                title={step.label}
              >
                {completed ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
