"use client";

import {
  ColorInput,
  ConfigurationProps,
  FontFamilyInput,
  PaddingInput,
  SliderInput,
  TextDimensionInput,
  TextInput,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { SquareRoundCorner } from "lucide-react";
import { FONT_FAMILIES } from "../../style-inputs/helpers/font-family";
import { EmailLayoutDefaultProps, EmailLayoutProps } from "./schema";

export const EmailLayoutConfiguration = ({
  data,
  setData,
}: ConfigurationProps<EmailLayoutProps>) => {
  const t = useI18n("builder");
  const updateData = (d: unknown) => setData(d as EmailLayoutProps);

  return (
    <>
      <ColorInput
        label={t("emailBuilder.blocks.emailLayout.backdropColor")}
        defaultValue={data.backdropColor ?? "#F5F5F5"}
        onChange={(backdropColor) => updateData({ ...data, backdropColor })}
      />
      <ColorInput
        label={t("emailBuilder.blocks.emailLayout.canvasColor")}
        defaultValue={data.canvasColor ?? "#FFFFFF"}
        onChange={(canvasColor) => updateData({ ...data, canvasColor })}
      />
      <ColorInput
        nullable
        label={t("emailBuilder.blocks.emailLayout.canvasBorderColor")}
        defaultValue={data.borderColor ?? null}
        onChange={(borderColor) => updateData({ ...data, borderColor })}
      />
      <TextDimensionInput
        label={t("emailBuilder.blocks.emailLayout.maxWidth")}
        nullable
        defaultValue={data.maxWidth ?? null}
        onChange={(maxWidth) => updateData({ ...data, maxWidth })}
      />
      <SliderInput
        iconLabel={<SquareRoundCorner />}
        units="px"
        step={4}
        min={0}
        max={48}
        label={t("emailBuilder.blocks.emailLayout.canvasBorderRadius")}
        defaultValue={data.borderRadius ?? 0}
        onChange={(borderRadius) => updateData({ ...data, borderRadius })}
      />
      <PaddingInput
        label={t("emailBuilder.blocks.emailLayout.padding")}
        defaultValue={data.padding ?? EmailLayoutDefaultProps.padding}
        onChange={(padding) => updateData({ ...data, padding })}
      />
      <FontFamilyInput
        defaultValue={data.fontFamily ?? null}
        onChange={(fontFamily) => updateData({ ...data, fontFamily })}
        fonts={FONT_FAMILIES.map((font) => ({
          cssValue: font.value,
          name: font.label,
          value: font.key,
        }))}
      />
      <ColorInput
        label={t("emailBuilder.blocks.emailLayout.textColor")}
        defaultValue={data.textColor ?? "#262626"}
        onChange={(textColor) => updateData({ ...data, textColor })}
      />
      <TextInput
        label={t("emailBuilder.blocks.emailLayout.previewText")}
        defaultValue={data.previewText || ""}
        rows={5}
        onChange={(previewText) => updateData({ ...data, previewText })}
      />
    </>
  );
};
