"use client";

import {
  ColorInput,
  ConfigurationProps,
  FileInput,
  TextInput,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { MultiStylePropertyPanel } from "../../style-inputs/multi-style-property-panel";
import { OnlineMeetingProps, OnlineMeetingPropsDefaults } from "./schema";

export const OnlineMeetingConfiguration = ({
  data,
  setData,
}: ConfigurationProps<OnlineMeetingProps>) => {
  const t = useI18n("builder");
  const updateData = (d: unknown) => setData(d as OnlineMeetingProps);

  return (
    <>
      <TextInput
        label={t("emailBuilder.blocks.onlineMeeting.title")}
        defaultValue={
          data.props?.title ?? OnlineMeetingPropsDefaults.props.title
        }
        onChange={(text) => {
          updateData({ ...data, props: { ...data.props, title: text } });
        }}
      />
      <TextInput
        label={t("emailBuilder.blocks.onlineMeeting.type")}
        defaultValue={data.props?.type ?? OnlineMeetingPropsDefaults.props.type}
        onChange={(text) => {
          updateData({ ...data, props: { ...data.props, type: text } });
        }}
      />
      <FileInput
        label={t("emailBuilder.blocks.onlineMeeting.logoUrl")}
        accept="image/*"
        defaultValue={
          data.props?.logoUrl ?? OnlineMeetingPropsDefaults.props.logoUrl
        }
        onChange={(url) => {
          updateData({ ...data, props: { ...data.props, logoUrl: url } });
        }}
        fullUrl
        nullable
      />
      <TextInput
        label={t("emailBuilder.blocks.onlineMeeting.whenText")}
        defaultValue={
          data.props?.whenText ?? OnlineMeetingPropsDefaults.props.whenText
        }
        onChange={(text) => {
          updateData({ ...data, props: { ...data.props, whenText: text } });
        }}
      />
      <TextInput
        label={t("emailBuilder.blocks.onlineMeeting.codeText")}
        defaultValue={
          data.props?.codeText ?? OnlineMeetingPropsDefaults.props.codeText
        }
        onChange={(text) => {
          updateData({ ...data, props: { ...data.props, codeText: text } });
        }}
      />
      <TextInput
        label={t("emailBuilder.blocks.onlineMeeting.passwordText")}
        defaultValue={
          data.props?.passwordText ??
          OnlineMeetingPropsDefaults.props.passwordText
        }
        onChange={(text) => {
          updateData({ ...data, props: { ...data.props, passwordText: text } });
        }}
      />
      <TextInput
        label={t("emailBuilder.blocks.onlineMeeting.buttonText")}
        defaultValue={
          data.props?.buttonText ?? OnlineMeetingPropsDefaults.props.buttonText
        }
        onChange={(text) => {
          updateData({ ...data, props: { ...data.props, buttonText: text } });
        }}
      />
      <ColorInput
        label={t("emailBuilder.blocks.onlineMeeting.buttonTextColor")}
        defaultValue={
          data.props?.buttonTextColor ??
          OnlineMeetingPropsDefaults.props.buttonTextColor
        }
        onChange={(color) => {
          updateData({
            ...data,
            props: { ...data.props, buttonTextColor: color },
          });
        }}
        nullable
      />
      <ColorInput
        label={t("emailBuilder.blocks.onlineMeeting.buttonBackgroundColor")}
        defaultValue={
          data.props?.buttonBackgroundColor ??
          OnlineMeetingPropsDefaults.props.buttonBackgroundColor
        }
        onChange={(color) => {
          updateData({
            ...data,
            props: { ...data.props, buttonBackgroundColor: color },
          });
        }}
        nullable
      />
      <TextInput
        label={t("emailBuilder.blocks.onlineMeeting.linkText")}
        defaultValue={
          data.props?.linkText ?? OnlineMeetingPropsDefaults.props.linkText
        }
        onChange={(text) => {
          updateData({ ...data, props: { ...data.props, linkText: text } });
        }}
      />
      <MultiStylePropertyPanel
        names={["color", "backgroundColor", "fontFamily", "padding"]}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </>
  );
};
