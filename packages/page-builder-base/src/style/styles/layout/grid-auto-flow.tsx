import { useI18n } from "@timelish/i18n/client";
import { Combobox } from "@timelish/ui";
import { Grid2x2 } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const gridAutoFlowKeys = [
  "row",
  "column",
  "dense",
  "row dense",
  "column dense",
] as const;

const gridAutoFlowKeyMap = {
  row: "row",
  column: "column",
  dense: "dense",
  "row dense": "row_dense",
  "column dense": "column_dense",
} as const;

const GridAutoFlowSchema = z.enum(gridAutoFlowKeys);

export const gridAutoFlowStyle = {
  name: "gridAutoFlow",
  label: "builder.pageBuilder.styles.properties.gridAutoFlow",
  category: "layout",
  schema: GridAutoFlowSchema,
  icon: ({ className }) => <Grid2x2 className={className} />,
  defaultValue: "row",
  renderToCSS: (value) => {
    if (!value || value === "row") return null;
    return `grid-auto-flow: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    return (
      <Combobox
        values={gridAutoFlowKeys.map((flow) => ({
          value: flow,
          label: t(
            `pageBuilder.styles.gridAutoFlow.${gridAutoFlowKeyMap[flow]}`,
          ),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof GridAutoFlowSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof GridAutoFlowSchema>;
