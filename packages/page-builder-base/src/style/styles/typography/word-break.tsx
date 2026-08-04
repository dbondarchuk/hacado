import { useI18n } from "@timelish/i18n/client";
import { Combobox } from "@timelish/ui";
import { WholeWord } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const wordBreakKeys = [
  "normal",
  "break-all",
  "keep-all",
  "break-word",
] as const;

const wordBreakKeyMap = {
  normal: "normal",
  "break-all": "break_all",
  "keep-all": "keep_all",
  "break-word": "break_word",
} as const;

const WordBreakSchema = z.enum(wordBreakKeys);

export const wordBreakStyle = {
  name: "wordBreak",
  label: "builder.pageBuilder.styles.properties.wordBreak",
  category: "typography",
  icon: ({ className }) => <WholeWord className={className} />,
  schema: WordBreakSchema,
  defaultValue: "normal",
  renderToCSS: (value) => {
    if (!value || value === "normal") return null;
    return `word-break: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={wordBreakKeys.map((wordBreak) => ({
          value: wordBreak,
          label: t(
            `pageBuilder.styles.wordBreak.${wordBreakKeyMap[wordBreak]}`,
          ),
        }))}
        value={value}
        onItemSelect={(val) => onChange(val as z.infer<typeof WordBreakSchema>)}
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof WordBreakSchema>;
