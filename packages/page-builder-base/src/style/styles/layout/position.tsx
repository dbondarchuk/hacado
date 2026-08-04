import { useI18n } from "@timelish/i18n/client";
import { Combobox } from "@timelish/ui";
import { Pin } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const positionKeys = [
  "static",
  "relative",
  "absolute",
  "fixed",
  "sticky",
] as const;

const PositionSchema = z.enum(positionKeys);

export const positionStyle = {
  name: "position",
  label: "builder.pageBuilder.styles.properties.position",
  icon: ({ className }) => <Pin className={className} />,
  category: "layout",
  schema: PositionSchema,
  defaultValue: "static",
  renderToCSS: (value) => {
    if (!value) return null;
    return `position: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={positionKeys.map((position) => ({
          value: position,
          label: t(`pageBuilder.styles.position.${position}`),
        }))}
        value={value}
        onItemSelect={(val) => onChange(val as z.infer<typeof PositionSchema>)}
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof PositionSchema>;
