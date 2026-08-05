import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { Image as ImageIcon } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const objectFitKeys = [
  "fill",
  "contain",
  "cover",
  "none",
  "scale-down",
] as const;

const ObjectFitSchema = z.enum(objectFitKeys);

export const objectFitStyle = {
  name: "objectFit",
  label: "builder.pageBuilder.styles.properties.objectFit",
  icon: ({ className }: { className?: string }) => (
    <ImageIcon className={className} />
  ),
  category: "layout" as const,
  schema: ObjectFitSchema,
  defaultValue: "cover",
  renderToCSS: (value: z.infer<typeof ObjectFitSchema> | null | undefined) => {
    if (!value) return null;
    return `object-fit: ${value};`;
  },
  component: ({
    value,
    onChange,
  }: {
    value: z.infer<typeof ObjectFitSchema>;
    onChange: (value: z.infer<typeof ObjectFitSchema>) => void;
  }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={objectFitKeys.map((fit) => ({
          value: fit,
          label: t(`pageBuilder.styles.objectFit.${fit}`),
        }))}
        value={value}
        onItemSelect={(val) => onChange(val as z.infer<typeof ObjectFitSchema>)}
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof ObjectFitSchema>;
