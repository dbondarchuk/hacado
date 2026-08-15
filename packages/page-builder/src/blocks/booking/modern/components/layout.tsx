import { useI18n, useLocale } from "@hacado/i18n/client";
import {
  Button,
  cn,
  Spinner,
  Stepper,
  useCurrencyFormat,
  usePrevious,
} from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useRef } from "react";
import { BookingRestrictionBanner } from "../../components/booking-restriction-banner";
import { ConfirmationCard } from "./confirmation-card";
import { useScheduleContext } from "./context";
import { ScheduleSteps } from "./steps";

export const BookingLayout = ({
  scrollToTop,
  hideTitle,
  hideSteps,
  className,
  ...props
}: {
  scrollToTop?: boolean;
  hideTitle?: boolean;
  hideSteps?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const ctx = useScheduleContext();
  const {
    currentStep,
    isBookingConfirmed,
    paymentInformation,
    selectedAppointmentOption,
    dateTime,
    duration,
    price,
    basePrice,
    steps,
    step,
    isLoading,
    areAppointmentOptionsLoading,
    isBookingRestricted,
    activeStaff,
    flowOrder,
  } = ctx;

  const locale = useLocale();
  const currencyFormat = useCurrencyFormat();

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
    .filter((step) => {
      if (!paymentInformation?.intent?._id && step === "payment") {
        return false;
      }

      if (step === "addons" && !selectedAppointmentOption?.addons?.length) {
        return false;
      }

      if (
        step === "specialist" &&
        flowOrder !== "specialist-first" &&
        activeStaff.length <= 1
      ) {
        return false;
      }

      return true;
    })
    .map((step) => ({
      id: step,
      label: t(`booking.steps.${step}`),
      icon: ScheduleSteps[step].icon,
    }));

  // Must use the filtered list: skipped steps (specialist/addons/payment) shift indices.
  const filteredCurrentStepIndex = filteredSteps.findIndex(
    (s) => s.id === currentStep,
  );

  return (
    <div className={className} {...props}>
      <div ref={topRef} />
      <div className="max-w-3xl mx-auto booking-container">
        {!hideTitle && (
          <div className="text-center mb-8 title-container">
            <h1 className="text-xl font-semibold text-foreground mb-2 title-text">
              {t("booking.title")}
            </h1>
            <p className="text-sm text-muted-foreground description-text">
              {t("booking.description")}
            </p>
          </div>
        )}

        {/* Progress Steps */}
        {!hideSteps && (
          <Stepper
            steps={filteredSteps}
            currentStepId={currentStep}
            isCompleted={(id, index) =>
              isBookingConfirmed || index < filteredCurrentStepIndex
            }
            className="mb-8"
          />
        )}

        {/* <StepCard /> */}
        {isBookingConfirmed ? (
          <ConfirmationCard />
        ) : isBookingRestricted ? (
          <BookingRestrictionBanner className="mb-6" />
        ) : (
          <div className="mb-6 relative step-content-container">
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

        {/* Summary & Navigation - Hide when booking is confirmed */}
        {!isBookingConfirmed &&
          !areAppointmentOptionsLoading &&
          !isBookingRestricted && (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-card border rounded-lg p-4 mt-6 summary-container">
              {!!selectedAppointmentOption && (
                <div className="flex flex-col md:flex-row gap-2 w-full">
                  {!!basePrice && (
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground amount-label">
                        {t("booking.summary.estimates.amount")}
                      </p>
                      <p className="text-sm font-bold text-foreground flex items-center gap-2 amount-value">
                        {currencyFormat(price)}
                      </p>
                    </div>
                  )}
                  {selectedAppointmentOption && (
                    <div
                      className={cn(
                        "text-left",
                        !!basePrice &&
                          "border-t pt-2 md:border-t-0 md:border-l md:pl-2 md:pt-0",
                      )}
                    >
                      <p className="text-xs text-muted-foreground duration-label">
                        {t("booking.summary.estimates.duration")}
                      </p>
                      <p className="text-sm font-bold text-foreground flex items-center gap-2 duration-value">
                        {t(
                          "common.formats.durationHourMin",
                          durationToTime(duration),
                        )}
                      </p>
                    </div>
                  )}
                  {!!dateTime && (
                    <div className="text-left border-t pt-2 md:border-t-0 md:border-l md:pl-2 md:pt-0">
                      <p className="text-xs text-muted-foreground">
                        {t("booking.summary.estimates.dateTime")}
                      </p>
                      <p className="text-sm font-bold text-foreground flex items-center gap-2 duration-value">
                        {DateTime.fromJSDate(dateTime.date)
                          .set({
                            hour: dateTime.time.hour,
                            minute: dateTime.time.minute,
                          })
                          .setZone(dateTime.timeZone)
                          .toLocaleString(DateTime.DATETIME_FULL, { locale })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div
                className={cn(
                  "w-full lg:w-auto flex justify-between gap-2 buttons-container",
                  !step.prev.show(ctx) && "justify-end",
                  !selectedAppointmentOption && "lg:w-full",
                )}
              >
                {step.prev.show(ctx) && (
                  <Button
                    variant="outline"
                    className="back-button"
                    onClick={() => step.prev.action(ctx)}
                    disabled={
                      !step.prev.isEnabled(ctx) ||
                      isLoading ||
                      areAppointmentOptionsLoading
                    }
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {t(step.prev.text ?? "common.buttons.back")}
                  </Button>
                )}
                {step.next.show(ctx) && (
                  <Button
                    className="next-button"
                    onClick={() => step.next.action(ctx)}
                    disabled={
                      !step.next.isEnabled(ctx) ||
                      isLoading ||
                      areAppointmentOptionsLoading
                    }
                  >
                    {t(step.next.text ?? "common.buttons.next")}
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
