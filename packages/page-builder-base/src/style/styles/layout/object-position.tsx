import { RawDoubleNumberInput } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { Move } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const ObjectPositionSchema = z.object({
  x: z.number().min(0).max(100).optional().nullable(),
  y: z.number().min(0).max(100).optional().nullable(),
});

export const objectPositionStyle = {
  name: "objectPosition",
  label: "builder.pageBuilder.styles.properties.objectPosition",
  icon: ({ className }: { className?: string }) => (
    <Move className={className} />
  ),
  category: "layout" as const,
  schema: ObjectPositionSchema,
  defaultValue: { x: 50, y: 50 },
  renderToCSS: (
    value: z.infer<typeof ObjectPositionSchema> | null | undefined,
  ) => {
    if (!value) return null;
    return `object-position: ${value.x}% ${value.y}%;`;
  },
  component: ({
    value,
    onChange,
  }: {
    value: z.infer<typeof ObjectPositionSchema>;
    onChange: (value: z.infer<typeof ObjectPositionSchema>) => void;
  }) => {
    const t = useI18n("builder");
    return (
      <RawDoubleNumberInput
        prefix1="X:"
        prefix2="Y:"
        defaultValue1={value.x ?? null}
        defaultValue2={value.y ?? null}
        onChange1={(x) => onChange({ ...value, x })}
        onChange2={(y) => onChange({ ...value, y })}
        unit="%"
        nullable
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof ObjectPositionSchema>;
