import { Play } from "lucide-react";
import { StyleDefinition } from "../../../types";
import { AnimationConfiguration } from "./configuration";
import { AnimationSchema } from "./schema";

export const animationStyle = {
  name: "animation",
  label: "builder.pageBuilder.styles.properties.animation",
  description: "CSS animation settings (name, duration, easing, etc.)",
  category: "effects",
  schema: AnimationSchema,
  icon: ({ className }) => <Play className={className} />,
  defaultValue: {
    name: "none",
    duration: 1,
    iterationCount: "infinite",
    direction: "normal",
    timingFunction: "ease",
    fillMode: "none",
    delay: 0,
  },
  renderToCSS: (value) => {
    if (!value || value.name === "none") return null;

    const parts = [];
    parts.push(`animation-name: ${value.name}`);
    parts.push(`animation-duration: ${value.duration}s`);
    parts.push(`animation-iteration-count: ${value.iterationCount}`);
    parts.push(`animation-direction: ${value.direction}`);
    parts.push(`animation-timing-function: ${value.timingFunction}`);
    parts.push(`animation-fill-mode: ${value.fillMode}`);
    if (value.delay > 0) {
      parts.push(`animation-delay: ${value.delay}s`);
    }

    // For last ; to join
    parts.push("");

    return parts.join(";\n");
  },
  component: ({ value, onChange }) => {
    return <AnimationConfiguration value={value} onChange={onChange} />;
  },
} as const satisfies StyleDefinition<typeof AnimationSchema>;
