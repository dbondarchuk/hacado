import {
  Button,
  cn,
  Input,
  InputGroup,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
} from "@hacado/ui";
import { Grid3X3 } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";
import { GridTemplateTracksDialog } from "./grid-template-tracks-dialog";

const GridTemplateColumnsSchema = z.string();

export const gridTemplateColumnsStyle = {
  name: "gridTemplateColumns",
  label: "builder.pageBuilder.styles.properties.gridTemplateColumns",
  category: "layout",
  schema: GridTemplateColumnsSchema,
  icon: ({ className }) => <Grid3X3 className={className} />,
  defaultValue: "repeat(auto-fit, minmax(250px, 1fr))",
  renderToCSS: (value) => {
    if (!value) return null;
    return `grid-template-columns: ${value};`;
  },
  component: ({ value, onChange }) => (
    <InputGroup>
      <InputGroupInput>
        <Input
          placeholder="e.g., repeat(auto-fit, minmax(250px, 1fr))"
          value={value || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          className={InputGroupInputClasses()}
          h="sm"
        />
      </InputGroupInput>
      <GridTemplateTracksDialog
        track="columns"
        value={value || ""}
        onChange={onChange}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className={cn(InputGroupAddonClasses(), "h-8")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        }
      />
    </InputGroup>
  ),
} as const satisfies StyleDefinition<typeof GridTemplateColumnsSchema>;
