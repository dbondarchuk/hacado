import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { Square } from "lucide-react";
import * as z from "zod";
import { AllOrSidesInput } from "../../../style-inputs/all-or-sides-input";
import { StyleDefinition } from "../../types";
import { renderAllOrPerSideCss } from "../../utils";
import { zAllOrPerSide } from "../../zod";

const borderStyleKeys = [
  "solid",
  "dashed",
  "dotted",
  "double",
  "groove",
  "ridge",
  "inset",
  "outset",
  "none",
  "hidden",
] as const;

const BorderStyleItemSchema = z.enum(borderStyleKeys);
const BorderStyleSchema = zAllOrPerSide(BorderStyleItemSchema);

const defaultBorderStyle = "solid" as const;

export const borderStyleStyle = {
  name: "borderStyle",
  label: "builder.pageBuilder.styles.properties.borderStyle",
  category: "border",
  icon: ({ className }) => <Square className={className} />,
  schema: BorderStyleSchema,
  defaultValue: defaultBorderStyle,
  renderToCSS: (value) =>
    renderAllOrPerSideCss(value, "border-style", (style) => style),
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    const values = borderStyleKeys.map((style) => ({
      value: style,
      label: t(`pageBuilder.styles.borderStyle.${style}`),
    }));

    return (
      <AllOrSidesInput
        layout="sides"
        value={value}
        onChange={onChange}
        defaultAllValue={defaultBorderStyle}
        renderInput={({
          value: slotValue,
          onChange: onSlotChange,
          nullable,
        }) =>
          nullable ? (
            <Combobox
              allowClear
              values={values}
              value={slotValue ?? undefined}
              onItemSelect={(val) =>
                onSlotChange(
                  (val as z.infer<typeof BorderStyleItemSchema> | undefined) ??
                    null,
                )
              }
              className="w-full"
              size="sm"
            />
          ) : (
            <Combobox
              values={values}
              value={slotValue ?? defaultBorderStyle}
              onItemSelect={(val) =>
                onSlotChange(val as z.infer<typeof BorderStyleItemSchema>)
              }
              className="w-full"
              size="sm"
            />
          )
        }
      />
    );
  },
} as const satisfies StyleDefinition<typeof BorderStyleSchema>;
