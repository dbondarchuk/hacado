import { clientApi } from "@hacado/api-sdk";
import { useI18n, useLocale } from "@hacado/i18n/client";
import {
  Button,
  cn,
  Spinner,
  Stepper,
  useCurrencyFormat,
  useIsMobile,
  usePrevious,
} from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useRef } from "react";
import { BookingOtpDialog } from "../../../../components/booking-otp-dialog";
import { BookingRestrictionBanner } from "../../../../components/booking-restriction-banner";
import { trackWaitlistBookingUiStep } from "../../../../track-booking-ui-step";
import {
  WaitlistPublicKeys,
  WaitlistPublicNamespace,
  waitlistPublicNamespace,
} from "../../../../translations/types";
import { ConfirmationCard } from "./confirmation-card";
import { useScheduleContext } from "./context";
import { ScheduleSteps } from "./steps";

export const BookingWithWaitlistLayout = ({
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
    flow,
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
    fields,
    setFields,
    setOtpVerified,
    setCurrentStep,
    fetchPaymentInformation,
    setPaymentInformation,
    onSubmit,
    otpReturnStep,
    otpDialogOpen,
    setOtpDialogOpen,
    setPackageBookingFlow,
    refreshBookingOptions,
  } = ctx;

  const showBookingRestriction = flow === "booking" && isBookingRestricted;

  const locale = useLocale();
  const currencyFormat = useCurrencyFormat();

  const topRef = useRef<HTMLDivElement>(null);
  const otpVerifiedInDialogRef = useRef(false);
  const scrollToTopRef = useRef(!!scrollToTop);
  useEffect(() => {
    scrollToTopRef.current = !!scrollToTop;
  }, [scrollToTop]);

  const i18n = useI18n("translation");
  const t = useI18n<WaitlistPublicNamespace, WaitlistPublicKeys>(
    waitlistPublicNamespace,
  );

  const StepContent = step.Content;
  const isMobile = useIsMobile();

  const previousStep = usePrevious(step, step);
  useEffect(() => {
    if (scrollToTopRef.current && previousStep !== step) {
      topRef?.current?.scrollIntoView();
    }
  }, [previousStep, step]);

  const filteredSteps = steps
    .filter((step) => {
      if (
        flow === "booking" &&
        !paymentInformation?.intent?._id &&
        step === "payment"
      ) {
        return false;
      }

      if (
        ctx.isCustomerPackageLocked &&
        (step === "option" || step === "specialist" || step === "addons")
      ) {
        return false;
      }

      if (
        step === "addons" &&
        (!selectedAppointmentOption?.addons?.length ||
          ctx.purchasePackageId ||
          ctx.customerPackageId)
      ) {
        return false;
      }

      if (step === "otp") {
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
      label: t(`block.steps.${step}`),
      icon: ScheduleSteps[step].icon,
    }));

  // Must use the filtered list: skipped steps (specialist/addons/payment) shift indices.
  const filteredCurrentStepIndex = filteredSteps.findIndex(
    (s) => s.id === currentStep,
  );
  const packageVerifyFlow =
    otpReturnStep === "packages" || otpReturnStep === "review";

  return (
    <div className={className} {...props}>
      <div ref={topRef} />
      <div className="max-w-3xl mx-auto booking-container">
        {!hideTitle && (
          <div className="text-center mb-8 title-container">
            <h1 className="text-xl font-semibold text-foreground mb-2 title-text">
              {t(`block.layout.${flow}.title`)}
            </h1>
            <p className="text-sm text-muted-foreground description-text">
              {t(`block.layout.${flow}.description`)}
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
        ) : showBookingRestriction ? (
          <BookingRestrictionBanner className="mb-6" />
        ) : (
          <div className="mb-6 relative step-content-container">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Spinner className="w-8 h-8 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {i18n("common.aria.loading")}
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
          !showBookingRestriction && (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-card border rounded-lg p-4 mt-6 summary-container">
              {!!selectedAppointmentOption && (
                <div className="flex flex-col md:flex-row gap-2 w-full">
                  {!!basePrice && (
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground amount-label">
                        {i18n("booking.summary.estimates.amount")}
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
                        {i18n("booking.summary.estimates.duration")}
                      </p>
                      <p className="text-sm font-bold text-foreground flex items-center gap-2 duration-value">
                        {i18n(
                          "common.formats.durationHourMin",
                          durationToTime(duration),
                        )}
                      </p>
                    </div>
                  )}
                  {flow === "booking" && !!dateTime && (
                    <div className="text-left border-t pt-2 md:border-t-0 md:border-l md:pl-2 md:pt-0">
                      <p className="text-xs text-muted-foreground">
                        {i18n("booking.summary.estimates.dateTime")}
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
                    {t(step.prev.text ?? "block.buttons.steps.back")}
                  </Button>
                )}
                {step.next.show(ctx) && (
                  <Button
                    className="next-button"
                    onClick={() => {
                      trackWaitlistBookingUiStep(currentStep, {
                        optionId: selectedAppointmentOption?._id,
                        memberId: ctx.selectedMemberId ?? undefined,
                        duration,
                      });
                      step.next.action(ctx);
                    }}
                    disabled={
                      !step.next.isEnabled(ctx) ||
                      isLoading ||
                      areAppointmentOptionsLoading
                    }
                  >
                    {t(step.next.text ?? "block.buttons.steps.next")}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          )}
      </div>
      <BookingOtpDialog
        open={otpDialogOpen}
        onOpenChange={(open) => {
          if (open) otpVerifiedInDialogRef.current = false;
          setOtpDialogOpen(open);
          if (
            !open &&
            otpReturnStep === "packages" &&
            !otpVerifiedInDialogRef.current
          ) {
            setPackageBookingFlow(false);
          }
        }}
        fields={fields}
        hideContactFields={!packageVerifyFlow}
        existingCustomerOnly={packageVerifyFlow}
        description={
          packageVerifyFlow
            ? i18n("booking.package.verifyToUseCreditsDescription")
            : undefined
        }
        onVerified={async (result) => {
          otpVerifiedInDialogRef.current = true;
          if (otpReturnStep === "packages") {
            setPackageBookingFlow(true);
          }
          setFields({
            ...fields,
            name: result.name || fields.name,
            email: result.email || fields.email,
            phone: result.phone || fields.phone,
          });
          setOtpVerified(true);
          if (otpReturnStep === "packages" || otpReturnStep === "review") {
            await refreshBookingOptions?.();
            if (otpReturnStep === "packages") setCurrentStep("option");
            return;
          }
          const payment = await fetchPaymentInformation();
          setPaymentInformation(payment);
          if (!payment || payment.intent?.status === "paid") {
            onSubmit();
          } else {
            clientApi.booking.trackPaymentReached(payment.intent?.amount);
            setCurrentStep("payment");
          }
        }}
      />
    </div>
  );
};
