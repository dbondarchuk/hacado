import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { TextSelect } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const userSelectKeys = ["auto", "none", "text", "all"] as const;

const UserSelectSchema = z.enum(userSelectKeys);

export const userSelectStyle = {
  name: "userSelect",
  label: "builder.pageBuilder.styles.properties.userSelect",
  category: "effects",
  icon: ({ className }) => <TextSelect className={className} />,
  schema: UserSelectSchema,
  defaultValue: "auto",
  renderToCSS: (value) => {
    if (!value || value === "auto") return null;
    return `user-select: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={userSelectKeys.map((userSelect) => ({
          value: userSelect,
          label: t(`pageBuilder.styles.userSelect.${userSelect}`),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof UserSelectSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof UserSelectSchema>;
