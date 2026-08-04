import { useI18n, useLocale } from "@timelish/i18n/client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
  Spinner,
} from "@timelish/ui";
import { durationToTime, formatAmountString } from "@timelish/utils";
import { Calendar, DollarSign, Timer } from "lucide-react";
import { DateTime as Luxon } from "luxon";
import React from "react";
import { useModifyAppointmentFormContext } from "./context";
import { CancelOrRescheduleSteps } from "./steps";

export const StepCard: React.FC = () => {
  const i18n = useI18n("translation");
  const ctx = useModifyAppointmentFormContext();
  const { appointment, step: stepType, type, newDateTime } = ctx;

  const locale = useLocale();

  const [isPrevLoading, setIsPrevLoading] = React.useState(false);
  const [isNextLoading, setIsNextLoading] = React.useState(false);

  const step = CancelOrRescheduleSteps[stepType];

  const isLoading = isPrevLoading || isNextLoading;

  const onClick = React.useCallback(
    async (dir: "prev" | "next") => {
      const setIsLoadingFn =
        dir === "prev" ? setIsPrevLoading : setIsNextLoading;
      const { action } = dir === "prev" ? step.prev : step.next;

      setIsLoadingFn(true);
      try {
        await action(ctx);
      } finally {
        setIsLoadingFn(false);
      }
    },
    [step, ctx],
  );

  const StepContent = CancelOrRescheduleSteps[stepType].Content;

  const hasAppointmentInformation = !!appointment?.allowed;

  const showPrevButton = step.prev.show(ctx);
  const showNextButton = step.next.show(ctx);

  return (
    <Card className="sm:min-w-min md:w-full bg-transparent text-foreground">
      <CardHeader className="text-center flex flex-col gap-2">
        <CardTitle>
          {!type || stepType === "type"
            ? i18n("modification.pageTitle")
            : type === "cancel"
              ? i18n("modification.type.cancel.title")
              : i18n("modification.type.reschedule.title")}
        </CardTitle>
        {hasAppointmentInformation && (
          <CardDescription className="flex flex-col gap-2 justify-center place-items-center text-foreground @container/info">
            <div className="text-lg font-semibold">
              {appointment.optionName}
            </div>
            <div className="flex flex-col @2xl/info:flex-row gap-2 items-center place-items-center">
              <div className="flex flex-row items-center">
                <Calendar className="mr-1 size-5" />
                <div className="leading-[normal] flex flex-col @lg/info:flex-row gap-2 items-center place-items-center">
                  <span className={cn(type === "reschedule" && "line-through")}>
                    {Luxon.fromJSDate(appointment.dateTime).toLocaleString(
                      Luxon.DATETIME_FULL,
                      {
                        locale,
                      },
                    )}
                  </span>
                  {type === "reschedule" && newDateTime && (
                    <span>
                      {newDateTime.toLocaleString(Luxon.DATETIME_FULL, {
                        locale,
                      })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-row items-center">
                <Timer className="mr-1 size-5" />
                <span className="leading-[normal]">
                  {i18n(
                    "common.formats.durationHourMin",
                    durationToTime(appointment.duration),
                  )}
                </span>
              </div>
              {appointment.price && appointment.price > 0 && (
                <div className="flex flex-row items-center">
                  <DollarSign className="mr-1 size-5" />
                  <span className="leading-[normal]">
                    {formatAmountString(appointment.price)}
                  </span>
                </div>
              )}
            </div>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <StepContent />
      </CardContent>
      {(showPrevButton || showNextButton) && (
        <CardFooter className="w-100 flex justify-between">
          <div>
            {showPrevButton && (
              <Button
                variant={"outline"}
                disabled={isLoading || !step.prev.isEnabled(ctx)}
                onClick={() => onClick("prev")}
              >
                {isPrevLoading && <Spinner />}
                {i18n("common.buttons.back")}
              </Button>
            )}
          </div>
          <div>
            {showNextButton && (
              <Button
                variant={"outline"}
                disabled={isLoading || !step.next.isEnabled(ctx)}
                onClick={() => onClick("next")}
              >
                {isNextLoading && <Spinner />}
                {i18n("common.buttons.next")}
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
