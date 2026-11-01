import { Move } from "lucide-react";
import { StyleDefinition } from "../../../types";
import { renderRawNumberWithUnitCss } from "../../../utils";
import { TransformConfiguration } from "./configuration";
import {
  getFixedFunctionUnit,
  getFunctionValueCount,
  isTransformFunctionWithUnits,
  TransformFunctionValue,
  TransformSchema,
} from "./schema";

const renderTransformFunctionValue = (
  funcName: string,
  value: TransformFunctionValue | undefined,
) => {
  if (typeof value === "object" && value !== null) {
    return renderRawNumberWithUnitCss(value) ?? "0px";
  }

  const numberValue = value ?? 0;
  if (isTransformFunctionWithUnits(funcName)) {
    // Legacy plain-number translate values default to px
    return `${numberValue}px`;
  }

  return `${numberValue}${getFixedFunctionUnit(funcName)}`;
};

export const transformStyle = {
  name: "transform",
  label: "builder.pageBuilder.styles.properties.transform",
  category: "effects",
  schema: TransformSchema,
  icon: ({ className }) => <Move className={className} />,
  defaultValue: "none",
  renderToCSS: (value) => {
    if (!value || value === "none") return null;
    if (typeof value === "string") {
      return `transform: ${value};`;
    }

    if (typeof value === "object" && "functions" in value) {
      if (value.functions.length === 0) return null;

      const transformString = value.functions
        .map((func) => {
          const valueCount = getFunctionValueCount(func.function);
          const renderedValues = Array.from({ length: valueCount }, (_, i) =>
            renderTransformFunctionValue(func.function, func.values[i]),
          );

          return `${func.function}(${renderedValues.join(", ")})`;
        })
        .join(" ");

      return `transform: ${transformString};`;
    }

    return null;
  },
  component: ({ value, onChange }) => {
    return <TransformConfiguration value={value} onChange={onChange} />;
  },
} as const satisfies StyleDefinition<typeof TransformSchema>;
