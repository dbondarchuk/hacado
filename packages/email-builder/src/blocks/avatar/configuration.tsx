"use client";

import {
  ConfigurationProps,
  FileInput,
  RadioGroupInput,
  RadioGroupInputItem,
  SliderInput,
  TextInput,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { Proportions } from "lucide-react";
import { MultiStylePropertyPanel } from "../../style-inputs/multi-style-property-panel";
import { AvatarProps, AvatarPropsDefaults } from "./schema";

export const AvatarConfiguration = ({
  data,
  setData,
}: ConfigurationProps<AvatarProps>) => {
  const t = useI18n("builder");
  const updateData = (d: unknown) => setData(d as AvatarProps);

  const size = data.props?.size ?? AvatarPropsDefaults.props.size;
  const imageUrl = data.props?.imageUrl ?? AvatarPropsDefaults.props.imageUrl;
  const alt = data.props?.alt ?? AvatarPropsDefaults.props.alt;
  const shape = data.props?.shape ?? AvatarPropsDefaults.props.shape;

  return (
    <>
      <SliderInput
        label={t("emailBuilder.blocks.avatar.size")}
        iconLabel={<Proportions className="text-secondary-foreground" />}
        units="px"
        step={3}
        min={32}
        max={256}
        defaultValue={size}
        onChange={(size) => {
          updateData({ ...data, props: { ...data.props, size } });
        }}
      />
      <RadioGroupInput
        label={t("emailBuilder.blocks.avatar.shape")}
        defaultValue={shape}
        onChange={(shape) => {
          updateData({ ...data, props: { ...data.props, shape } });
        }}
      >
        <RadioGroupInputItem value="circle">
          {t("emailBuilder.blocks.avatar.shapes.circle")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="square">
          {t("emailBuilder.blocks.avatar.shapes.square")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="rounded">
          {t("emailBuilder.blocks.avatar.shapes.rounded")}
        </RadioGroupInputItem>
      </RadioGroupInput>
      <FileInput
        label={t("emailBuilder.blocks.avatar.imageUrl")}
        accept="image/*"
        defaultValue={imageUrl ?? ""}
        fullUrl
        onChange={(v) => {
          const url = v.trim().length === 0 ? null : v.trim();
          updateData({ ...data, props: { ...data.props, imageUrl: url } });
        }}
      />
      <TextInput
        label={t("emailBuilder.blocks.avatar.alt")}
        defaultValue={alt}
        onChange={(alt) => {
          updateData({ ...data, props: { ...data.props, alt } });
        }}
      />

      <MultiStylePropertyPanel
        names={["textAlign", "padding"]}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </>
  );
};
