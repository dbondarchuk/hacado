import { useI18n } from "@timelish/i18n/client";
import { Combobox } from "@timelish/ui";
import { TextInitial } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const textOverflowKeys = ["clip", "ellipsis"] as const;

const TextOverflowSchema = z.enum(textOverflowKeys);

export const textOverflowStyle = {
  name: "textOverflow",
  label: "builder.pageBuilder.styles.properties.textOverflow",
  category: "typography",
  icon: ({ className }) => <TextInitial className={className} />,
  schema: TextOverflowSchema,
  defaultValue: "clip",
  renderToCSS: (value) => {
    if (!value || value === "clip") return null;
    return `text-overflow: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={textOverflowKeys.map((textOverflow) => ({
          value: textOverflow,
          label: t(`pageBuilder.styles.textOverflow.${textOverflow}`),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof TextOverflowSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof TextOverflowSchema>;
