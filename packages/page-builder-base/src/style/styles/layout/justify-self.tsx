import { useI18n } from "@timelish/i18n/client";
import { Combobox } from "@timelish/ui";
import { AlignHorizontalSpaceAround } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const justifySelfKeys = ["auto", "start", "end", "center", "stretch"] as const;

const JustifySelfSchema = z.enum(justifySelfKeys);

export const justifySelfStyle = {
  name: "justifySelf",
  label: "builder.pageBuilder.styles.properties.justifySelf",
  category: "layout",
  schema: JustifySelfSchema,
  icon: ({ className }) => <AlignHorizontalSpaceAround className={className} />,
  defaultValue: "auto",
  renderToCSS: (value) => {
    if (!value || value === "auto") return null;
    return `justify-self: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    return (
      <Combobox
        values={justifySelfKeys.map((justify) => ({
          value: justify,
          label: t(`pageBuilder.styles.justifySelf.${justify}`),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof JustifySelfSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof JustifySelfSchema>;
