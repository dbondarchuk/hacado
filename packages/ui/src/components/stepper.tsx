"use client";

import { useI18n } from "@hacado/i18n/client";
import { Ellipsis } from "lucide-react";
import { useIsMobile } from "../hooks/use-mobile";
import { cn } from "../utils/cn";

export interface StepperStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface StepperProps {
  steps: StepperStep[];
  currentStepId: string;
  isCompleted?: (stepId: string, index: number) => boolean;
  disableMobileView?: boolean;
  className?: string;
}

function StepConnector({ filled }: { filled: boolean }) {
  return (
    <div className="relative w-6 md:w-8 h-0.5 mt-5 -mx-4 bg-muted overflow-hidden">
      <div
        className={cn(
          "absolute inset-y-0 bg-primary transition-all duration-500 ease-out",
          // logical direction → RTL safe
          "inset-inline-start-0",
          filled ? "w-full" : "w-0",
        )}
      />
    </div>
  );
}

function EllipsisStep() {
  return (
    <div className="flex flex-col items-center w-20">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <span className="text-2xl leading-none text-muted-foreground">
          <Ellipsis className="w-5 h-5" />
        </span>
      </div>
      <div>&nbsp;</div>
    </div>
  );
}

export function Stepper({
  steps,
  currentStepId,
  isCompleted,
  disableMobileView = false,
  className,
}: StepperProps) {
  const _isMobile = useIsMobile();
  const isMobile = disableMobileView ? false : _isMobile;

  const currentIndex = steps.findIndex((s) => s.id === currentStepId);
  const i18n = useI18n("ui");
  const hasPrevHidden = isMobile && currentIndex > 1;
  const hasNextHidden = isMobile && currentIndex < steps.length - 2;

  const visibleSteps = isMobile
    ? steps.filter(
        (_, i) =>
          i === currentIndex ||
          i === currentIndex - 1 ||
          i === currentIndex + 1,
      )
    : steps;

  return (
    <div
      className={cn("flex flex-col items-center steps-container", className)}
    >
      <div className="flex items-center justify-center steps-list-container">
        {/* PREVIOUS ELLIPSIS */}
        {hasPrevHidden && (
          <div className="flex items-start prev-ellipsis-container ellipsis-step-container">
            <EllipsisStep />
            <StepConnector filled />
          </div>
        )}

        {visibleSteps.map((step, i) => {
          const originalIndex = steps.indexOf(step);
          const Icon = step.icon;

          const completed =
            isCompleted?.(step.id, originalIndex) ??
            originalIndex < currentIndex;

          const isCurrent = step.id === currentStepId;

          return (
            <div key={step.id} className="flex items-start step-item-container">
              <div className="flex flex-col items-center w-24 step-icon-container">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    completed && "bg-primary text-primary-foreground",
                    isCurrent &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !completed &&
                      !isCurrent &&
                      "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span
                  className={cn(
                    "text-sm mt-2 font-medium text-center step-label-text",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {i < visibleSteps.length - 1 && (
                <StepConnector filled={completed} />
              )}
            </div>
          );
        })}

        {/* NEXT ELLIPSIS */}
        {hasNextHidden && (
          <div className="flex items-start next-ellipsis-container ellipsis-step-container">
            <StepConnector filled={false} />
            <EllipsisStep />
          </div>
        )}
      </div>

      {/* Mobile progress */}
      {isMobile && (
        <div className="mt-3 text-sm text-muted-foreground steps-progress-text">
          {i18n("stepper.step_of_total", {
            step: currentIndex + 1,
            total: steps.length,
          })}
        </div>
      )}
    </div>
  );
}
