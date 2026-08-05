import { useI18n, useLocale } from "@hacado/i18n/client";
import { Button, cn, Spinner, Stepper, usePrevious } from "@hacado/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useRef } from "react";
import { ConfirmationCard } from "./confirmation-card";
import { useCabinetModifyContext } from "./context";
import { CabinetModifySteps } from "./steps";

export const CabinetModifyLayout = ({
  scrollToTop,
  className,
  ...props
}: {
  scrollToTop?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const ctx = useCabinetModifyContext();
  const {
    currentStep,
    step,
    isLoading,
    steps,
    paymentInformation,
    type,
    isModificationConfirmed,
    currentStepIndex,
    appointment,
    newDateTime,
    timeZone,
  } = ctx;

  const locale = useLocale();
  const topRef = useRef<HTMLDivElement>(null);
  const scrollToTopRef = useRef(!!scrollToTop);
  useEffect(() => {
    scrollToTopRef.current = !!scrollToTop;
  }, [scrollToTop]);
  const t = useI18n("translation");

  const StepContent = step.Content;

  const previousStep = usePrevious(step, step);
  useEffect(() => {
    if (scrollToTopRef.current && previousStep !== step) {
      topRef?.current?.scrollIntoView();
    }
  }, [previousStep, step]);

  const filteredSteps = steps
    .filter((s) => {
      if (!paymentInformation?.intent?._id && s === "payment") return false;
      if (type === "cancel" && s === "calendar") return false;
      return true;
    })
    .map((s) => ({
      id: s,
      label: t(`modification.steps.${s}`),
      icon: CabinetModifySteps[s].icon,
    }));

  return (
    <div className={className} {...props}>
      <div ref={topRef} />
      <div className="max-w-3xl mx-auto modify-container booking-container">
        <Stepper
          steps={filteredSteps}
          currentStepId={currentStep}
          isCompleted={(_id, index) =>
            isModificationConfirmed || index < currentStepIndex
          }
          className="mb-8 modify-stepper"
        />

        {isModificationConfirmed ? (
          <ConfirmationCard />
        ) : (
          <div className="mb-6 relative step-content-container modify-step-content">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Spinner className="w-8 h-8 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {t("common.aria.loading")}
                  </span>
                </div>
              </div>
            )}
            <StepContent />
          </div>
        )}

        {!isModificationConfirmed && (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-card border rounded-lg p-4 mt-6 summary-container modify-summary">
            {!!appointment && (
              <div className="flex flex-col md:flex-row gap-2 w-full modify-summary-dates">
                {!!appointment.dateTime && (
                  <div className="text-left modify-summary-original-date">
                    <p className="text-xs text-muted-foreground">
                      {t("modification.summary.estimates.dateTime")}
                    </p>
                    <p className="text-sm font-bold text-foreground flex items-center gap-2 line-through">
                      {DateTime.fromJSDate(appointment.dateTime)
                        .setZone(timeZone)
                        .toLocaleString(DateTime.DATETIME_FULL, { locale })}
                    </p>
                  </div>
                )}
                {type === "reschedule" && !!newDateTime && (
                  <div className="text-left border-t pt-2 md:border-t-0 md:border-l md:pl-2 md:pt-0 modify-summary-new-date">
                    <p className="text-xs text-muted-foreground">
                      {t("modification.summary.estimates.newDateTime")}
                    </p>
                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                      {newDateTime
                        .setZone(timeZone)
                        .toLocaleString(DateTime.DATETIME_FULL, {
                          locale,
                        })}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div
              className={cn(
                "w-full lg:w-auto flex justify-between gap-2 buttons-container modify-buttons",
                !step.prev.show(ctx) && "justify-end",
                !appointment && "lg:w-full",
              )}
            >
              {step.prev.show(ctx) && (
                <Button
                  variant="outline"
                  className="modify-back-button"
                  onClick={() => step.prev.action(ctx)}
                  disabled={!step.prev.isEnabled(ctx) || isLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t(step.prev.text ?? ("common.buttons.back" as any))}
                </Button>
              )}
              {step.next.show(ctx) && (
                <Button
                  className="modify-next-button"
                  onClick={() => step.next.action(ctx)}
                  disabled={!step.next.isEnabled(ctx) || isLoading}
                >
                  {t(step.next.text ?? ("common.buttons.next" as any))}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
