import { Clock } from "lucide-react";
import { StyleDefinition } from "../../../types";
import { TransitionConfiguration } from "./configuration";
import { TransitionSchema } from "./schema";

export const transitionStyle = {
  name: "transition",
  label: "builder.pageBuilder.styles.properties.transition",
  category: "effects",
  schema: TransitionSchema,
  icon: ({ className }) => <Clock className={className} />,
  defaultValue: "all 0.3s ease",
  renderToCSS: (value) => {
    if (!value || value === "none") return null;
    if (typeof value === "string") {
      return `transition: ${value};`;
    }
    if (value.properties.length === 0 || value.properties.includes("none"))
      return null;

    const properties = value.properties
      .map(
        (property) => `${property} ${value.duration}s ${value.timingFunction}`,
      )
      .join(", ");

    return `transition: ${properties};`;
  },
  component: ({ value, onChange }) => {
    return <TransitionConfiguration value={value} onChange={onChange} />;
  },
} as const satisfies StyleDefinition<typeof TransitionSchema>;
