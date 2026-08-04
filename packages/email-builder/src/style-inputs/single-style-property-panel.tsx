import React from "react";

import {
  ColorInput,
  FontFamilyInput,
  FontSizeInput,
  PaddingInput,
  SelectInput,
  SliderInput,
  TextAlignInput,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { DraftingCompass } from "lucide-react";
import { FONT_FAMILIES } from "./helpers/font-family";
import { TStyle } from "./helpers/TStyle";

type StylePropertyPanelProps = {
  name: keyof TStyle;
  value: TStyle;
  onChange: (style: TStyle) => void;
};

export const SingleStylePropertyPanel: React.FC<StylePropertyPanelProps> = ({
  name,
  value,
  onChange,
}) => {
  const t = useI18n("builder");
  const defaultValue = value[name] ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (v: any) => {
    onChange({ ...value, [name]: v });
  };

  switch (name) {
    case "backgroundColor":
      return (
        <ColorInput
          nullable
          label={t("emailBuilder.common.styleInputs.backgroundColor")}
          defaultValue={defaultValue}
          onChange={handleChange}
        />
      );
    case "borderColor":
      return (
        <ColorInput
          nullable
          label={t("emailBuilder.common.styleInputs.borderColor")}
          defaultValue={defaultValue}
          onChange={handleChange}
        />
      );
    case "borderRadius":
      return (
        <SliderInput
          nullable
          iconLabel={<DraftingCompass />}
          units="px"
          step={4}
          min={0}
          max={48}
          label={t("emailBuilder.common.styleInputs.borderRadius")}
          defaultValue={defaultValue}
          onChange={handleChange}
        />
      );
    case "color":
      return (
        <ColorInput
          nullable
          label={t("emailBuilder.common.styleInputs.color")}
          defaultValue={defaultValue}
          onChange={handleChange}
        />
      );
    case "fontFamily":
      return (
        <FontFamilyInput
          defaultValue={defaultValue}
          onChange={handleChange}
          fonts={FONT_FAMILIES.map((font) => ({
            cssValue: font.value,
            name: font.label,
            value: font.key,
          }))}
        />
      );
    case "fontSize":
      return (
        <FontSizeInput
          label={t("emailBuilder.common.styleInputs.fontSize")}
          defaultValue={defaultValue}
          onChange={handleChange}
        />
      );
    case "fontWeight":
      return (
        <SelectInput
          label={t("emailBuilder.common.styleInputs.fontWeight")}
          defaultValue={defaultValue}
          onChange={handleChange}
          options={[
            {
              value: "normal",
              label: "Normal",
            },
            {
              value: "bold",
              label: "Bold",
            },
          ]}
        />
      );
    case "textAlign":
      return (
        <TextAlignInput
          label={t("emailBuilder.common.styleInputs.textAlign")}
          defaultValue={defaultValue}
          onChange={handleChange}
        />
      );
    case "padding":
      return (
        <PaddingInput
          label={t("emailBuilder.common.styleInputs.padding")}
          defaultValue={defaultValue}
          onChange={handleChange}
        />
      );
  }
};
