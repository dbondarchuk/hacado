import { Sparkles } from "lucide-react";
import { StyleDefinition } from "../../../types";
import { renderRawNumberWithUnitCss } from "../../../utils";
import { FilterConfiguration } from "./configuration";
import {
  FilterFunctionValue,
  FilterSchema,
  getFixedFunctionUnit,
  isFilterFunctionWithUnits,
} from "./schema";

const renderFilterFunctionValue = (
  funcName: string,
  value: FilterFunctionValue | undefined,
) => {
  if (typeof value === "object" && value !== null) {
    return renderRawNumberWithUnitCss(value) ?? "0px";
  }

  const numberValue = value ?? 0;
  if (isFilterFunctionWithUnits(funcName)) {
    // Legacy plain-number blur values default to px
    return `${numberValue}px`;
  }

  return `${numberValue}${getFixedFunctionUnit(funcName)}`;
};

export const filterStyle = {
  name: "filter",
  label: "builder.pageBuilder.styles.properties.filter",
  category: "effects",
  schema: FilterSchema,
  icon: ({ className }) => <Sparkles className={className} />,
  defaultValue: "none",
  renderToCSS: (value) => {
    if (!value || value === "none") return null;
    if (typeof value === "string") {
      return `filter: ${value};`;
    }

    if (typeof value === "object" && "functions" in value) {
      if (value.functions.length === 0) return null;

      const filterString = value.functions
        .map((func) => {
          const rendered = renderFilterFunctionValue(
            func.function,
            func.values[0],
          );

          return `${func.function}(${rendered})`;
        })
        .join(" ");

      return `filter: ${filterString};`;
    }

    return null;
  },
  component: ({ value, onChange }) => {
    return <FilterConfiguration value={value} onChange={onChange} />;
  },
} as const satisfies StyleDefinition<typeof FilterSchema>;
