"use client";

import {
  ColorInput,
  ConfigurationProps,
  RadioGroupInput,
  RadioGroupInputItem,
  TextInput,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { MultiStylePropertyPanel } from "../../style-inputs/multi-style-property-panel";
import { ButtonProps, ButtonPropsDefaults } from "./schema";

export const ButtonConfiguration = ({
  data,
  setData,
}: ConfigurationProps<ButtonProps>) => {
  const t = useI18n("builder");
  const updateData = (d: unknown) => setData(d as ButtonProps);

  const text = data.props?.text ?? ButtonPropsDefaults.props.text;
  const url = data.props?.url ?? ButtonPropsDefaults.props.url;
  const width = data.props?.width ?? ButtonPropsDefaults.props.width;
  const size = data.props?.size ?? ButtonPropsDefaults.props.size;
  const buttonStyle =
    data.props?.buttonStyle ?? ButtonPropsDefaults.props.buttonStyle;
  const buttonTextColor =
    data.props?.buttonTextColor ?? ButtonPropsDefaults.props.buttonTextColor;
  const buttonBackgroundColor =
    data.props?.buttonBackgroundColor ??
    ButtonPropsDefaults.props.buttonBackgroundColor;

  return (
    <>
      <TextInput
        label={t("emailBuilder.blocks.button.text")}
        defaultValue={text}
        onChange={(text) =>
          updateData({ ...data, props: { ...data.props, text } })
        }
      />
      <TextInput
        label={t("emailBuilder.blocks.button.url")}
        defaultValue={url}
        onChange={(url) =>
          updateData({ ...data, props: { ...data.props, url } })
        }
      />
      <RadioGroupInput
        label={t("emailBuilder.blocks.button.width")}
        defaultValue={width}
        onChange={(width) =>
          updateData({
            ...data,
            props: { ...data.props, width },
          })
        }
      >
        <RadioGroupInputItem value="auto">
          {t("emailBuilder.blocks.button.widths.auto")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="full">
          {t("emailBuilder.blocks.button.widths.full")}
        </RadioGroupInputItem>
      </RadioGroupInput>
      <RadioGroupInput
        label={t("emailBuilder.blocks.button.size")}
        defaultValue={size}
        onChange={(size) =>
          updateData({ ...data, props: { ...data.props, size } })
        }
      >
        <RadioGroupInputItem value="x-small">
          {t("emailBuilder.blocks.button.sizes.x-small")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="small">
          {t("emailBuilder.blocks.button.sizes.small")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="medium">
          {t("emailBuilder.blocks.button.sizes.medium")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="large">
          {t("emailBuilder.blocks.button.sizes.large")}
        </RadioGroupInputItem>
      </RadioGroupInput>
      <RadioGroupInput
        label={t("emailBuilder.blocks.button.style")}
        defaultValue={buttonStyle}
        onChange={(buttonStyle) =>
          updateData({ ...data, props: { ...data.props, buttonStyle } })
        }
      >
        <RadioGroupInputItem value="rectangle">
          {t("emailBuilder.blocks.button.styles.rectangle")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="rounded">
          {t("emailBuilder.blocks.button.styles.rounded")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="pill">
          {t("emailBuilder.blocks.button.styles.pill")}
        </RadioGroupInputItem>
      </RadioGroupInput>
      <ColorInput
        label={t("emailBuilder.blocks.button.textColor")}
        defaultValue={buttonTextColor}
        onChange={(buttonTextColor) =>
          updateData({ ...data, props: { ...data.props, buttonTextColor } })
        }
      />
      <ColorInput
        label={t("emailBuilder.blocks.button.buttonColor")}
        defaultValue={buttonBackgroundColor}
        onChange={(buttonBackgroundColor) =>
          updateData({
            ...data,
            props: { ...data.props, buttonBackgroundColor },
          })
        }
      />
      <MultiStylePropertyPanel
        names={[
          "backgroundColor",
          "fontFamily",
          "fontSize",
          "fontWeight",
          "textAlign",
          "padding",
        ]}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </>
  );
};
