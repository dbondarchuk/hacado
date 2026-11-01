import { PanelLeftClose } from "lucide-react";
import { FourSideValuesInput } from "../../../style-inputs/four-side-values-input";
import { StyleDefinition } from "../../types";
import { renderFourSideValuesCss } from "../../utils";
import { zFourSideValues } from "../../zod";

const PaddingSchema = zFourSideValues;

const notAllowedGlobalKeywords = ["auto" as const];

export const paddingStyle = {
  name: "padding",
  label: "builder.pageBuilder.styles.properties.padding",
  category: "spacing",
  schema: PaddingSchema,
  icon: ({ className }) => <PanelLeftClose className={className} />,
  defaultValue: {
    top: null,
    right: null,
    bottom: null,
    left: null,
  },
  renderToCSS: (value) => {
    if (!value) return null;

    return renderFourSideValuesCss(value, "padding");
  },
  component: ({ value, onChange }) => (
    <FourSideValuesInput
      defaultValue={value}
      onChange={onChange}
      notAllowedGlobalKeywords={notAllowedGlobalKeywords}
      noMax
    />
  ),
} as const satisfies StyleDefinition<typeof PaddingSchema>;
