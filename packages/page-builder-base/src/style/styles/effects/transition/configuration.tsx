"use client";

import { useI18n } from "@hacado/i18n/client";
import { Combobox, MultiSelect } from "@hacado/ui";
import { Clock } from "lucide-react";
import { useCallback, useState } from "react";
import * as z from "zod";
import { RawNumberInput } from "../../../../style-inputs/base/raw-number-input";
import {
  TransitionSchema,
  TransitionStyleConfiguration,
  transitionKeyMap,
  transitionKeys,
  transitionPropertyKeyMap,
  transitionPropertyKeys,
  transitionTimingFunctionKeyMap,
  transitionTimingFunctionKeys,
} from "./schema";

export const TransitionConfiguration = ({
  value,
  onChange,
}: {
  value: TransitionStyleConfiguration;
  onChange: (value: TransitionStyleConfiguration) => void;
}) => {
  const t = useI18n("builder");
  const [isCustom, setIsCustom] = useState(() => {
    return typeof value === "object";
  });
  const [selectedProperties, setSelectedProperties] = useState<string[]>(
    typeof value === "object" && "properties" in value
      ? (value as any).properties
      : ["all"],
  );

  const handleTransitionChange = useCallback(
    (transition: string) => {
      if (transition === "custom") {
        setIsCustom(true);
        onChange({
          properties: ["all"],
          duration: 0.3,
          timingFunction: "ease",
        });
      } else {
        setIsCustom(false);
        onChange(transition as z.infer<typeof TransitionSchema>);
      }
    },
    [setIsCustom, onChange],
  );

  const onPropertiesChange = useCallback(
    (properties: string[]) => {
      let newProperties: string[];

      if (properties.includes("all")) {
        newProperties = ["all"];
      } else if (properties.includes("none")) {
        newProperties = ["none"];
      } else {
        newProperties = properties;
      }

      setSelectedProperties(newProperties);
      if (typeof value === "object") {
        onChange({
          ...(value as any),
          properties:
            newProperties as (typeof transitionPropertyKeys)[number][],
        });
      }
    },
    [selectedProperties, onChange],
  );

  const handleDurationChange = useCallback(
    (duration: number) => {
      if (typeof value === "object" && "duration" in value) {
        onChange({
          ...(value as any),
          duration,
        });
      }
    },
    [onChange],
  );

  const handleTimingFunctionChange = useCallback(
    (timingFunction: string) => {
      if (typeof value === "object" && "timingFunction" in value) {
        onChange({
          ...value,
          timingFunction:
            timingFunction as (typeof transitionTimingFunctionKeys)[number],
        });
      }
    },
    [onChange],
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Predefined Transitions */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("pageBuilder.styles.properties.transition")}
        </label>
        <Combobox
          values={transitionKeys.map((transition) => ({
            value: transition,
            label: t(
              `pageBuilder.styles.transition.${transitionKeyMap[transition]}`,
            ),
          }))}
          value={
            isCustom
              ? "custom"
              : typeof value === "string"
                ? value
                : "all 0.3s ease"
          }
          onItemSelect={handleTransitionChange}
          className="w-full"
          size="sm"
        />
      </div>

      {/* Custom Controls */}
      {isCustom && (
        <>
          {/* Properties Selection */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t("pageBuilder.styles.properties.transitionProperties")}
            </label>
            <MultiSelect
              options={transitionPropertyKeys.map((property) => ({
                value: property,
                label: t(
                  `pageBuilder.styles.transitionProperties.${transitionPropertyKeyMap[property]}`,
                ),
              }))}
              selected={selectedProperties}
              onChange={onPropertiesChange}
              className="w-full"
              size="sm"
            />
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t("pageBuilder.styles.properties.transitionDuration")}
            </label>
            <RawNumberInput
              iconLabel={<Clock className="w-4 h-4" />}
              value={
                typeof value === "object" && "duration" in value
                  ? (value as any).duration
                  : 0.3
              }
              setValue={handleDurationChange}
              step={0.1}
              min={0}
              max={10}
              options={[0, 0.1, 0.2, 0.3, 0.5, 0.7, 1, 1.5, 2, 3, 5]}
              float
              nullable={false}
              suffix={t("pageBuilder.common.secondsShort")}
            />
          </div>

          {/* Timing Function */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t("pageBuilder.styles.properties.transitionTimingFunction")}
            </label>
            <Combobox
              values={transitionTimingFunctionKeys.map((timing) => ({
                value: timing,
                label: t(
                  `pageBuilder.styles.transitionTimingFunction.${transitionTimingFunctionKeyMap[timing]}`,
                ),
              }))}
              value={typeof value === "object" ? value.timingFunction : "ease"}
              onItemSelect={handleTimingFunctionChange}
              className="w-full"
              size="sm"
            />
          </div>
        </>
      )}
    </div>
  );
};
