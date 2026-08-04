"use client";

import { useI18n } from "@timelish/i18n/client";
import { Button, Combobox } from "@timelish/ui";
import { Move, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import * as z from "zod";
import { RawNumberInput } from "../../../../style-inputs/base/raw-number-input";
import { RawNumberInputWithUnit } from "../../../../style-inputs/base/raw-number-input-with-units";
import type { NumberValueWithUnit, Unit } from "../../../zod";
import {
  TransformSchema,
  TransformStyleConfiguration,
  TransformValue,
  getDefaultFunctionValues,
  getFixedFunctionUnit,
  getFunctionValueCount,
  isTransformFunctionWithUnits,
  transformFunctionKeyMap,
  transformFunctionKeys,
  transformKeyMap,
  transformKeys,
} from "./schema";

const translateOptions: Partial<Record<Unit, number[]>> & {
  base?: number[];
} = {
  base: [-50, -20, -10, 0, 10, 20, 50],
  px: [-50, -20, -10, 0, 10, 20, 50],
  rem: [-5, -2, -1, -0.5, 0, 0.5, 1, 2, 5],
  "%": [-50, -25, -10, 0, 10, 25, 50],
  vh: [-50, -25, -10, 0, 10, 25, 50],
  vw: [-50, -25, -10, 0, 10, 25, 50],
};

const toNumberValueWithUnit = (
  value: number | NumberValueWithUnit | undefined,
): NumberValueWithUnit => {
  if (typeof value === "object" && value !== null) {
    return value;
  }
  return { value: value ?? 0, unit: "px" };
};

export const TransformConfiguration = ({
  value,
  onChange,
}: {
  value: TransformStyleConfiguration;
  onChange: (value: TransformStyleConfiguration) => void;
}) => {
  const t = useI18n("builder");
  const [isCustom, setIsCustom] = useState(() => {
    return typeof value === "object" && "functions" in value;
  });

  const handleTransformChange = useCallback(
    (transform: string) => {
      if (transform === "custom") {
        setIsCustom(true);
        onChange({
          functions: [
            {
              function: "scale",
              values: getDefaultFunctionValues("scale"),
            },
          ],
        });
      } else {
        setIsCustom(false);
        onChange(transform as z.infer<typeof TransformSchema>);
      }
    },
    [setIsCustom, onChange],
  );

  const addTransformFunction = useCallback(() => {
    if (typeof value === "object" && "functions" in value) {
      onChange({
        ...value,
        functions: [
          ...value.functions,
          {
            function: "scale",
            values: getDefaultFunctionValues("scale"),
          },
        ],
      });
    }
  }, [value, onChange]);

  const removeTransformFunction = useCallback(
    (index: number) => {
      if (typeof value === "object" && "functions" in value) {
        const newFunctions = value.functions.filter((_, i) => i !== index);
        if (newFunctions.length === 0) {
          onChange("none");
          setIsCustom(false);
        } else {
          onChange({
            ...value,
            functions: newFunctions,
          });
        }
      }
    },
    [value, onChange],
  );

  const updateTransformFunction = useCallback(
    (index: number, func: TransformValue) => {
      if (typeof value === "object" && "functions" in value) {
        const newFunctions = [...value.functions];
        newFunctions[index] = func;
        onChange({
          ...value,
          functions: newFunctions,
        });
      }
    },
    [value, onChange],
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Predefined Transforms */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t("pageBuilder.styles.properties.transform")}
        </label>
        <Combobox
          values={transformKeys.map((transform) => ({
            value: transform,
            label: t(
              `pageBuilder.styles.transform.${transformKeyMap[transform]}`,
            ),
          }))}
          value={
            isCustom ? "custom" : typeof value === "string" ? value : "none"
          }
          onItemSelect={handleTransformChange}
          className="w-full"
          size="sm"
        />
      </div>

      {/* Custom Controls */}
      {isCustom && (
        <div className="flex flex-col gap-3">
          {typeof value === "object" &&
            "functions" in value &&
            value.functions.map((func, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 p-3 border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("pageBuilder.styles.transform.function", {
                      index: index + 1,
                    })}
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTransformFunction(index)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Function Type */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("pageBuilder.styles.transform.functionType")}
                  </label>
                  <Combobox
                    values={transformFunctionKeys.map((funcType) => ({
                      value: funcType,
                      label: t(
                        `pageBuilder.styles.transform.transformFunctions.${transformFunctionKeyMap[funcType]}`,
                      ),
                    }))}
                    value={func.function}
                    onItemSelect={(newFunc) =>
                      updateTransformFunction(index, {
                        function: newFunc as TransformValue["function"],
                        values: getDefaultFunctionValues(newFunc),
                      })
                    }
                    className="w-full"
                    size="sm"
                  />
                </div>

                {/* Function Values */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("pageBuilder.styles.transform.values")}
                  </label>
                  <div className="flex gap-2">
                    {Array(getFunctionValueCount(func.function))
                      .fill(0)
                      .map((_, valueIndex) =>
                        isTransformFunctionWithUnits(func.function) ? (
                          <RawNumberInputWithUnit
                            key={valueIndex}
                            icon={<Move className="w-4 h-4" />}
                            defaultValue={toNumberValueWithUnit(
                              func.values[valueIndex],
                            )}
                            onChange={(newValue) => {
                              const newValues = [...func.values];
                              newValues[valueIndex] = newValue;
                              updateTransformFunction(index, {
                                ...func,
                                values: newValues,
                              });
                            }}
                            allowNegative
                            noMin
                            noMax
                            options={translateOptions}
                          />
                        ) : (
                          <RawNumberInput
                            key={valueIndex}
                            iconLabel={<Move className="w-4 h-4" />}
                            value={
                              typeof func.values[valueIndex] === "number"
                                ? func.values[valueIndex]
                                : 0
                            }
                            setValue={(newValue) => {
                              const newValues = [...func.values];
                              newValues[valueIndex] = newValue;
                              updateTransformFunction(index, {
                                ...func,
                                values: newValues,
                              });
                            }}
                            step={func.function.includes("scale") ? 0.1 : 1}
                            min={
                              func.function.includes("scale") ? 0 : undefined
                            }
                            max={
                              func.function.includes("scale") ? 5 : undefined
                            }
                            options={
                              func.function.includes("scale")
                                ? [0.5, 0.75, 1, 1.25, 1.5, 2]
                                : func.function.includes("rotate") ||
                                    func.function.includes("skew")
                                  ? [-180, -90, -45, 0, 45, 90, 180]
                                  : [-50, -20, -10, 0, 10, 20, 50]
                            }
                            float={func.function.includes("scale")}
                            nullable={false}
                            suffix={getFixedFunctionUnit(func.function)}
                          />
                        ),
                      )}
                  </div>
                </div>
              </div>
            ))}

          {/* Add Function Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={addTransformFunction}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("pageBuilder.styles.transform.addFunction")}
          </Button>
        </div>
      )}
    </div>
  );
};
