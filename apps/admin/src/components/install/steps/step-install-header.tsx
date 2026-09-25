"use client";

import { useInstallWizard } from "@/components/install/install-wizard-context";
import { useI18n } from "@hacado/i18n/client";
import { Progress, Stepper, type StepperStep } from "@hacado/ui";
import {
  Building2,
  CalendarPlus,
  CheckCircle2,
  Clock,
  CreditCard,
  LayoutTemplate,
  Link2,
} from "lucide-react";
import { useMemo } from "react";

/** Internal wizard step numbers in flow order (personalization / 2 skipped). */
const FLOW_STEP_NUMS = [1, 3, 4, 5, 6, 7, 8] as const;

function flowIndexForStep(stepNum: number): number {
  if (stepNum === 2) return FLOW_STEP_NUMS.indexOf(3);
  const idx = FLOW_STEP_NUMS.indexOf(
    stepNum as (typeof FLOW_STEP_NUMS)[number],
  );
  return idx >= 0 ? idx : 0;
}

export function StepInstallHeader({ stepNum }: { stepNum: number }) {
  const t = useI18n("install");
  const { session } = useInstallWizard();

  const stepperSteps: StepperStep[] = useMemo(
    () => [
      {
        id: "business",
        label: t("wizard.steps.business"),
        icon: Building2,
      },
      {
        id: "service",
        label: t("wizard.steps.service"),
        icon: CalendarPlus,
      },
      {
        id: "schedule",
        label: t("wizard.steps.schedule"),
        icon: Clock,
      },
      {
        id: "integrations",
        label: t("wizard.steps.integrations"),
        icon: Link2,
      },
      {
        id: "payments",
        label: t("wizard.steps.payments"),
        icon: CreditCard,
      },
      {
        id: "website",
        label: t("wizard.steps.website"),
        icon: LayoutTemplate,
      },
      {
        id: "done",
        label: t("wizard.steps.done"),
        icon: CheckCircle2,
      },
    ],
    [t],
  );

  const currentStepperId = useMemo(() => {
    if (stepNum === 1) return "business";
    if (stepNum === 2 || stepNum === 3) return "service";
    if (stepNum === 4) return "schedule";
    if (stepNum === 5) return "integrations";
    if (stepNum === 6) return "payments";
    if (stepNum === 7) return "website";
    if (stepNum === 8) return "done";
    return "business";
  }, [stepNum]);

  const progressPercent = Math.round(
    ((flowIndexForStep(stepNum) + 1) / FLOW_STEP_NUMS.length) * 100,
  );

  return (
    <header className="border-b bg-card px-4 py-4 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="text-xl font-semibold tracking-tight font-display text-primary">
              hacado
            </div>
          </div>
          <div className="hidden text-base text-muted-foreground sm:block">
            {session?.user?.name}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-base font-medium text-muted-foreground">
              {t("wizard.progressLabel")}
            </p>
            <p className="text-2xl font-semibold">{progressPercent}%</p>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="pt-2">
          <Stepper
            steps={stepperSteps}
            currentStepId={currentStepperId}
            isCompleted={(id) => {
              const order = stepperSteps.map((s) => s.id);
              const cur = order.indexOf(currentStepperId);
              const idx = order.indexOf(id);
              return idx < cur;
            }}
          />
        </div>
      </div>
    </header>
  );
}
