import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { PointerOff } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const pointerEventsKeys = ["auto", "none"] as const;

const PointerEventsSchema = z.enum(pointerEventsKeys);

export const pointerEventsStyle = {
  name: "pointerEvents",
  label: "builder.pageBuilder.styles.properties.pointerEvents",
  category: "effects",
  icon: ({ className }) => <PointerOff className={className} />,
  schema: PointerEventsSchema,
  defaultValue: "auto",
  renderToCSS: (value) => {
    if (!value || value === "auto") return null;
    return `pointer-events: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={pointerEventsKeys.map((pointerEvents) => ({
          value: pointerEvents,
          label: t(`pageBuilder.styles.pointerEvents.${pointerEvents}`),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof PointerEventsSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof PointerEventsSchema>;
