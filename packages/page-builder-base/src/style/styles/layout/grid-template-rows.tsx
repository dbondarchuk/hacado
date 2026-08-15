import {
  Button,
  cn,
  Input,
  InputGroup,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
} from "@hacado/ui";
import { Rows3 } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";
import { GridTemplateTracksDialog } from "./grid-template-tracks-dialog";

const GridTemplateRowsSchema = z.string();

export const gridTemplateRowsStyle = {
  name: "gridTemplateRows",
  label: "builder.pageBuilder.styles.properties.gridTemplateRows",
  category: "layout",
  schema: GridTemplateRowsSchema,
  icon: ({ className }) => <Rows3 className={className} />,
  defaultValue: "repeat(auto-fit, minmax(150px, 1fr))",
  renderToCSS: (value) => {
    if (!value) return null;
    return `grid-template-rows: ${value};`;
  },
  component: ({ value, onChange }) => (
    <InputGroup>
      <InputGroupInput>
        <Input
          placeholder="e.g., repeat(auto-fit, minmax(150px, 1fr))"
          value={value || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          className={InputGroupInputClasses()}
          h="sm"
        />
      </InputGroupInput>
      <GridTemplateTracksDialog
        track="rows"
        value={value || ""}
        onChange={onChange}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className={cn(InputGroupAddonClasses(), "h-8")}
          >
            <Rows3 className="w-4 h-4" />
          </Button>
        }
      />
    </InputGroup>
  ),
} as const satisfies StyleDefinition<typeof GridTemplateRowsSchema>;
