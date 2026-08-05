import { useI18n } from "@hacado/i18n/client";
import { Checkbox, Label } from "@hacado/ui";
import { EyeOff } from "lucide-react";
import { useId } from "react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const HideSchema = z.coerce.boolean<boolean>();

export const hideStyle = {
  name: "hide",
  label: "builder.pageBuilder.styles.properties.hide",
  category: "layout",
  schema: HideSchema,
  icon: ({ className }) => <EyeOff className={className} />,
  defaultValue: false,
  renderToCSS: (value, isEditor) => {
    if (!value) return null;
    return isEditor ? `opacity: 0.3;` : `display: none;`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    const id = useId();
    return (
      <div className="flex items-center gap-2 flex-1">
        <Checkbox id={id} checked={value} onCheckedChange={onChange} />
        <Label htmlFor={id}>{t("pageBuilder.styles.properties.hide")}</Label>
      </div>
    );
  },
} as const satisfies StyleDefinition<typeof HideSchema>;
