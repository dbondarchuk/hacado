"use client";

import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { Clock, Timer } from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import { RawNumberInput } from "../../../../style-inputs/base/raw-number-input";
import {
  AnimationSchema,
  AnimationStyleConfiguration,
  animationDirectionKeyMap,
  animationDirectionKeys,
  animationFillModeKeyMap,
  animationFillModeKeys,
  animationIterationCountKeyMap,
  animationIterationCountKeys,
  animationNameKeyMap,
  animationNameKeys,
  animationTimingFunctionKeyMap,
  animationTimingFunctionKeys,
} from "./schema";

export const AnimationConfiguration = ({
  value,
  onChange,
}: {
  value: AnimationStyleConfiguration;
  onChange: (value: AnimationStyleConfiguration) => void;
}) => {
  const t = useI18n("builder");
  const [isCustomIteration, setIsCustomIteration] = useState(() => {
    return typeof value?.iterationCount === "number";
  });

  const handleNameChange = (name: string) => {
    onChange({
      ...value,
      name: name as z.infer<typeof AnimationSchema>["name"],
    });
  };

  const handleDurationChange = (duration: number) => {
    onChange({ ...value, duration });
  };

  const handleIterationModeChange = (mode: "infinite" | "custom") => {
    if (mode === "infinite") {
      setIsCustomIteration(false);
      onChange({ ...value, iterationCount: "infinite" });
    } else {
      setIsCustomIteration(true);
      onChange({ ...value, iterationCount: 1 });
    }
  };

  const handleIterationValueChange = (iterationCount: number | null) => {
    if (iterationCount !== null) {
      onChange({ ...value, iterationCount });
    }
  };

  const handleDirectionChange = (direction: string) => {
    onChange({
      ...value,
      direction: direction as z.infer<typeof AnimationSchema>["direction"],
    });
  };

  const handleTimingFunctionChange = (timingFunction: string) => {
    onChange({
      ...value,
      timingFunction: timingFunction as z.infer<
        typeof AnimationSchema
      >["timingFunction"],
    });
  };

  const handleFillModeChange = (fillMode: string) => {
    onChange({
      ...value,
      fillMode: fillMode as z.infer<typeof AnimationSchema>["fillMode"],
    });
  };

  const handleDelayChange = (delay: number) => {
    onChange({ ...value, delay });
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Animation Name */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("pageBuilder.styles.properties.animationName")}
        </label>
        <Combobox
          values={animationNameKeys.map((animation) => ({
            value: animation,
            label: t(
              `pageBuilder.styles.animation.${animationNameKeyMap[animation]}`,
            ),
          }))}
          value={value?.name || "none"}
          onItemSelect={handleNameChange}
          className="w-full"
          size="sm"
        />
      </div>

      {/* Duration */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("pageBuilder.styles.properties.animationDuration")}
        </label>
        <RawNumberInput
          iconLabel={<Clock className="w-4 h-4" />}
          value={value?.duration || 1}
          setValue={handleDurationChange}
          step={0.1}
          min={0}
          max={10}
          options={[0.1, 0.2, 0.3, 0.5, 0.7, 1, 1.5, 2, 3, 5]}
          float
          nullable={false}
          suffix={t("pageBuilder.common.secondsShort")}
        />
      </div>

      {/* Iteration Count */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("pageBuilder.styles.properties.animationIterationCount")}
        </label>
        <Combobox
          values={animationIterationCountKeys.map((mode) => ({
            value: mode,
            label: t(
              `pageBuilder.styles.animationKeywords.${animationIterationCountKeyMap[mode]}`,
            ),
          }))}
          value={isCustomIteration ? "custom" : "infinite"}
          onItemSelect={(val) =>
            handleIterationModeChange(val as "infinite" | "custom")
          }
          className="w-full"
          size="sm"
        />
        {isCustomIteration && (
          <RawNumberInput
            iconLabel={<div className="w-4 h-4" />}
            value={
              typeof value?.iterationCount === "number"
                ? value.iterationCount
                : 1
            }
            setValue={handleIterationValueChange}
            step={1}
            min={1}
            max={100}
            options={[1, 2, 3, 4, 5, 10, 20, 50, 100]}
            float={false}
            nullable={false}
          />
        )}
      </div>

      {/* Direction */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("pageBuilder.styles.properties.animationDirection")}
        </label>
        <Combobox
          values={animationDirectionKeys.map((direction) => ({
            value: direction,
            label: t(
              `pageBuilder.styles.animationDirection.${animationDirectionKeyMap[direction]}`,
            ),
          }))}
          value={value?.direction || "normal"}
          onItemSelect={handleDirectionChange}
          className="w-full"
          size="sm"
        />
      </div>

      {/* Timing Function */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("pageBuilder.styles.properties.animationTimingFunction")}
        </label>
        <Combobox
          values={animationTimingFunctionKeys.map((timing) => ({
            value: timing,
            label: t(
              `pageBuilder.styles.animationTimingFunction.${animationTimingFunctionKeyMap[timing]}`,
            ),
          }))}
          value={value?.timingFunction || "ease"}
          onItemSelect={handleTimingFunctionChange}
          className="w-full"
          size="sm"
        />
      </div>

      {/* Fill Mode */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("pageBuilder.styles.properties.animationFillMode")}
        </label>
        <Combobox
          values={animationFillModeKeys.map((fillMode) => ({
            value: fillMode,
            label: t(
              `pageBuilder.styles.animationFillMode.${animationFillModeKeyMap[fillMode]}`,
            ),
          }))}
          value={value?.fillMode || "none"}
          onItemSelect={handleFillModeChange}
          className="w-full"
          size="sm"
        />
      </div>

      {/* Delay */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("pageBuilder.styles.properties.animationDelay")}
        </label>
        <RawNumberInput
          iconLabel={<Timer className="w-4 h-4" />}
          value={value?.delay || 0}
          setValue={handleDelayChange}
          step={0.1}
          min={0}
          max={10}
          options={[0, 0.1, 0.2, 0.3, 0.5, 0.7, 1, 1.5, 2, 3, 5]}
          float
          nullable={false}
          suffix={t("pageBuilder.common.secondsShort")}
        />
      </div>
    </div>
  );
};
