import { useI18n } from "@timelish/i18n/client";
import { Combobox } from "@timelish/ui";
import { MousePointer } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const cursorKeys = [
  "auto",
  "default",
  "pointer",
  "text",
  "wait",
  "move",
  "not-allowed",
  "help",
  "crosshair",
  "grab",
  "grabbing",
] as const;

const CursorSchema = z.enum(cursorKeys);

export const cursorStyle = {
  name: "cursor",
  label: "builder.pageBuilder.styles.properties.cursor",
  category: "effects",
  icon: ({ className }) => <MousePointer className={className} />,
  schema: CursorSchema,
  defaultValue: "auto",
  renderToCSS: (value) => {
    if (!value) return null;
    return `cursor: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={cursorKeys.map((cursor) => ({
          value: cursor,
          label: t(`pageBuilder.styles.cursor.${cursor}`),
        }))}
        value={value}
        onItemSelect={(val) => onChange(val as z.infer<typeof CursorSchema>)}
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof CursorSchema>;
