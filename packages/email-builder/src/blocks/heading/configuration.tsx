"use client";

import {
  ConfigurationProps,
  RadioGroupInput,
  RadioGroupInputItem,
  TextInput,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { MultiStylePropertyPanel } from "../../style-inputs/multi-style-property-panel";
import { HeadingProps, HeadingPropsDefaults } from "./schema";

export const HeadingConfiguration = ({
  data,
  setData,
}: ConfigurationProps<HeadingProps>) => {
  const t = useI18n("builder");
  const updateData = (d: unknown) => setData(d as HeadingProps);

  return (
    <>
      <TextInput
        label={t("emailBuilder.blocks.heading.content")}
        rows={3}
        defaultValue={data.props?.text ?? HeadingPropsDefaults.props.text}
        onChange={(text) => {
          updateData({ ...data, props: { ...data.props, text } });
        }}
      />
      <RadioGroupInput
        label={t("emailBuilder.blocks.heading.level")}
        defaultValue={data.props?.level ?? HeadingPropsDefaults.props.level}
        onChange={(level) => {
          updateData({ ...data, props: { ...data.props, level } });
        }}
      >
        <RadioGroupInputItem value="h1">
          {t("emailBuilder.blocks.heading.h1")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="h2">
          {t("emailBuilder.blocks.heading.h2")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="h3">
          {t("emailBuilder.blocks.heading.h3")}
        </RadioGroupInputItem>
      </RadioGroupInput>
      <MultiStylePropertyPanel
        names={[
          "color",
          "backgroundColor",
          "fontFamily",
          "fontWeight",
          "textAlign",
          "fontSize",
          "padding",
        ]}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </>
  );
};
