import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Spinner,
} from "@hacado/ui";
import { durationToTime, formatAmountString } from "@hacado/utils";
import { DollarSign, Timer } from "lucide-react";
import React from "react";
import { useScheduleContext } from "./context";
import { ScheduleSteps } from "./steps";

export const StepCard: React.FC = () => {
  const i18n = useI18n("translation");
  const ctx = useScheduleContext();
  const { duration, price, appointmentOption, step: stepType } = ctx;

  const [isPrevLoading, setIsPrevLoading] = React.useState(false);
  const [isNextLoading, setIsNextLoading] = React.useState(false);

  const step = ScheduleSteps[stepType];

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

  const StepContent = ScheduleSteps[stepType].Content;

  return (
    <Card className="sm:min-w-min md:w-full bg-transparent text-foreground border-none shadow-none">
      <CardHeader className="text-center flex flex-col gap-2">
        <CardTitle>{appointmentOption.name}</CardTitle>
        {(!!duration || !!price) && (
          <CardDescription className="flex flex-row gap-2 justify-center place-items-center text-foreground">
            {duration && (
              <div className="flex flex-row items-center">
                <Timer className="mr-1" />
                {i18n(
                  "common.formats.durationHourMin",
                  durationToTime(duration),
                )}
              </div>
            )}
            {!!price && (
              <div className="flex flex-row items-center">
                <DollarSign className="mr-1" />
                {formatAmountString(price)}
              </div>
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <StepContent />
      </CardContent>
      <CardFooter className="w-100 flex justify-between">
        <div>
          {step.prev.show(ctx) && (
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
          {step.next.show(ctx) && (
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
    </Card>
  );
};
