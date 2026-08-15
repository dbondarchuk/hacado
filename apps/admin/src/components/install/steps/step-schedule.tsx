"use client";

import { saveInstallSchedule } from "@/components/install/actions/schedule";
import { useInstallWizard } from "@/components/install/install-wizard-context";
import { useI18n } from "@hacado/i18n/client";
import { Button, Spinner, toast } from "@hacado/ui";
import { SimpleScheduler } from "@hacado/ui-admin";
import { useState } from "react";

export function StepSchedule() {
  const t = useI18n("install");
  const { p, setP, setStep } = useInstallWizard();
  const [submitting, setSubmitting] = useState(false);

  const onContinue = async () => {
    const hasWorkingHours = p.installSchedule.some(
      (day) => day.shifts.length > 0,
    );
    if (!hasWorkingHours) {
      toast.error(t("wizard.schedule.noWorkingHours"));
      return;
    }

    setSubmitting(true);
    try {
      const r = await saveInstallSchedule(p.installSchedule);
      if (!r.ok) {
        if (r.code === "no_working_hours") {
          toast.error(t("wizard.schedule.noWorkingHours"));
        } else {
          toast.error(t("wizard.schedule.saveError"));
        }
        return;
      }

      setStep(5);
      setP((prev) => ({ ...prev, step: 5 }));
      toast.success(t("wizard.schedule.saved"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t("wizard.schedule.title")}</h2>
        <p className="text-base text-muted-foreground">
          {t("wizard.schedule.subtitle")}
        </p>
      </div>

      <SimpleScheduler
        expandDaysWithShiftsByDefault
        value={p.installSchedule}
        onChange={(installSchedule) =>
          setP((prev) => ({ ...prev, installSchedule }))
        }
      />

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>{t("wizard.schedule.editLater")}</p>
        <p>{t("wizard.schedule.weeklyScheduleAppHint")}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            setStep(3);
            setP((prev) => ({ ...prev, step: 3 }));
          }}
        >
          {t("wizard.common.back")}
        </Button>
        <Button
          type="button"
          onClick={() => void onContinue()}
          disabled={submitting}
        >
          {submitting ? <Spinner /> : null}
          {t("wizard.common.continue")}
        </Button>
      </div>
    </div>
  );
}
