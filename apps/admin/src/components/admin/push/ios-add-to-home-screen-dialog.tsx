"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@hacado/ui/dialog";
import { Home, PlusSquare, Share } from "lucide-react";
import React from "react";

type Step = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export function IosAddToHomeScreenDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useI18n("admin");

  const steps: Step[] = [
    {
      icon: <Share className="size-6" strokeWidth={1.75} aria-hidden />,
      title: t("dashboard.pushPrompt.howTo.step1Title"),
      description: t("dashboard.pushPrompt.howTo.step1Description"),
    },
    {
      icon: <PlusSquare className="size-6" strokeWidth={1.75} aria-hidden />,
      title: t("dashboard.pushPrompt.howTo.step2Title"),
      description: t("dashboard.pushPrompt.howTo.step2Description"),
    },
    {
      icon: <Home className="size-6" strokeWidth={1.75} aria-hidden />,
      title: t("dashboard.pushPrompt.howTo.step3Title"),
      description: t("dashboard.pushPrompt.howTo.step3Description"),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dashboard.pushPrompt.howTo.title")}</DialogTitle>
          <DialogDescription>
            {t("dashboard.pushPrompt.howTo.description")}
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-3 rounded-lg border border-border bg-muted/40 p-3"
            >
              <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-md bg-background text-primary shadow-sm">
                {step.icon}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">
                  <span className="mr-1.5 text-muted-foreground">
                    {index + 1}.
                  </span>
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
