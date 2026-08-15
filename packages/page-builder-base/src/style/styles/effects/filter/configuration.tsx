"use client";

import { useI18n } from "@hacado/i18n/client";
import { Button, Combobox } from "@hacado/ui";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import * as z from "zod";
import { RawNumberInput } from "../../../../style-inputs/base/raw-number-input";
import { RawNumberInputWithUnit } from "../../../../style-inputs/base/raw-number-input-with-units";
import type { NumberValueWithUnit, Unit } from "../../../zod";
import {
  FilterSchema,
  FilterStyleConfiguration,
  FilterValue,
  filterFunctionKeyMap,
  filterFunctionKeys,
  filterKeyMap,
  filterKeys,
  getDefaultFunctionValues,
  getFixedFunctionUnit,
  isFilterFunctionPercentage,
  isFilterFunctionUnitless,
  isFilterFunctionWithUnits,
} from "./schema";

const blurOptions: Partial<Record<Unit, number[]>> & {
  base?: number[];
} = {
  base: [0, 1, 2, 4, 8, 12, 16, 24],
  px: [0, 1, 2, 4, 8, 12, 16, 24],
  rem: [0, 0.25, 0.5, 0.75, 1, 1.5, 2],
  "%": [0, 25, 50, 75, 100],
  vh: [0, 1, 2, 5, 10],
  vw: [0, 1, 2, 5, 10],
};

const toNumberValueWithUnit = (
  value: number | NumberValueWithUnit | undefined,
): NumberValueWithUnit => {
  if (typeof value === "object" && value !== null) {
    return value;
  }
  return { value: value ?? 0, unit: "px" };
};

const getNumberOptions = (func: string) => {
  if (isFilterFunctionUnitless(func)) {
    return [0, 0.5, 0.75, 1, 1.25, 1.5, 2];
  }
  if (isFilterFunctionPercentage(func)) {
    return [0, 25, 50, 75, 100];
  }
  if (func === "hue-rotate") {
    return [0, 45, 90, 180, 270, 360];
  }
  return [0, 1, 2, 4, 8];
};

export type FilterConfigurationKind = "filter" | "backdropFilter";

export const FilterConfiguration = ({
  value,
  onChange,
  kind = "filter",
}: {
  value: FilterStyleConfiguration;
  onChange: (value: FilterStyleConfiguration) => void;
  kind?: FilterConfigurationKind;
}) => {
  const t = useI18n("builder");
  const [isCustom, setIsCustom] = useState(() => {
    return typeof value === "object" && "functions" in value;
  });

  const handleFilterChange = useCallback(
    (filter: string) => {
      if (filter === "custom") {
        setIsCustom(true);
        onChange({
          functions: [
            {
              function: "blur",
              values: getDefaultFunctionValues("blur"),
            },
          ],
        });
      } else {
        setIsCustom(false);
        onChange(filter as z.infer<typeof FilterSchema>);
      }
    },
    [setIsCustom, onChange],
  );

  const addFilterFunction = useCallback(() => {
    if (typeof value === "object" && "functions" in value) {
      onChange({
        ...value,
        functions: [
          ...value.functions,
          {
            function: "blur",
            values: getDefaultFunctionValues("blur"),
          },
        ],
      });
    }
  }, [value, onChange]);

  const removeFilterFunction = useCallback(
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

  const updateFilterFunction = useCallback(
    (index: number, func: FilterValue) => {
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
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          {t(`pageBuilder.styles.properties.${kind}`)}
        </label>
        <Combobox
          values={filterKeys.map((filter) => ({
            value: filter,
            label: t(`pageBuilder.styles.${kind}.${filterKeyMap[filter]}`),
          }))}
          value={
            isCustom ? "custom" : typeof value === "string" ? value : "none"
          }
          onItemSelect={handleFilterChange}
          className="w-full"
          size="sm"
        />
      </div>

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
                    {t(`pageBuilder.styles.${kind}.function`, {
                      index: index + 1,
                    })}
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilterFunction(index)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t(`pageBuilder.styles.${kind}.functionType`)}
                  </label>
                  <Combobox
                    values={filterFunctionKeys.map((funcType) => ({
                      value: funcType,
                      label: t(
                        `pageBuilder.styles.${kind}.filterFunctions.${filterFunctionKeyMap[funcType]}`,
                      ),
                    }))}
                    value={func.function}
                    onItemSelect={(newFunc) =>
                      updateFilterFunction(index, {
                        function: newFunc as FilterValue["function"],
                        values: getDefaultFunctionValues(newFunc),
                      })
                    }
                    className="w-full"
                    size="sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t(`pageBuilder.styles.${kind}.values`)}
                  </label>
                  <div className="flex gap-2">
                    {isFilterFunctionWithUnits(func.function) ? (
                      <RawNumberInputWithUnit
                        icon={<Sparkles className="w-4 h-4" />}
                        defaultValue={toNumberValueWithUnit(func.values[0])}
                        onChange={(newValue) => {
                          updateFilterFunction(index, {
                            ...func,
                            values: [newValue],
                          });
                        }}
                        noMax
                        options={blurOptions}
                      />
                    ) : (
                      <RawNumberInput
                        iconLabel={<Sparkles className="w-4 h-4" />}
                        value={
                          typeof func.values[0] === "number"
                            ? func.values[0]
                            : 0
                        }
                        setValue={(newValue) => {
                          updateFilterFunction(index, {
                            ...func,
                            values: [newValue],
                          });
                        }}
                        step={isFilterFunctionUnitless(func.function) ? 0.1 : 1}
                        min={0}
                        max={
                          isFilterFunctionPercentage(func.function)
                            ? 100
                            : func.function === "hue-rotate"
                              ? 360
                              : isFilterFunctionUnitless(func.function)
                                ? 5
                                : undefined
                        }
                        options={getNumberOptions(func.function)}
                        float={isFilterFunctionUnitless(func.function)}
                        nullable={false}
                        suffix={getFixedFunctionUnit(func.function)}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addFilterFunction}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t(`pageBuilder.styles.${kind}.addFunction`)}
          </Button>
        </div>
      )}
    </div>
  );
};
