import { useI18n } from "@timelish/i18n/client";
import { Input } from "@timelish/ui";
import { Quote } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const ContentSchema = z.string();

export const contentStyle = {
  name: "content",
  label: "builder.pageBuilder.styles.properties.content",
  category: "misc",
  icon: ({ className }) => <Quote className={className} />,
  schema: ContentSchema,
  defaultValue: '""',
  renderToCSS: (value) => {
    if (value === null || typeof value === "undefined") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return `content: ${trimmed};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    return (
      <div className="flex flex-col gap-1 w-full">
        <Input
          placeholder='"", " ", "→", none, attr(data-label)'
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full font-mono text-xs"
          h="sm"
        />
        <p className="text-xs text-muted-foreground">
          {t("pageBuilder.styles.contentInput.helperText")}
        </p>
      </div>
    );
  },
} as const satisfies StyleDefinition<typeof ContentSchema>;
