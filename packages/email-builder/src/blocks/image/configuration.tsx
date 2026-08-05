"use client";

import {
  ConfigurationProps,
  FileInput,
  RadioGroupInput,
  RadioGroupInputItem,
  TextDoubleNumberInput,
  TextInput,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { ArrowDownToLine, ArrowUpToLine, FoldVertical } from "lucide-react";
import { MultiStylePropertyPanel } from "../../style-inputs/multi-style-property-panel";
import { ImageProps, ImagePropsDefaults } from "./schema";

export const ImageConfiguration = ({
  data,
  setData,
}: ConfigurationProps<ImageProps>) => {
  const t = useI18n("builder");
  const updateData = (d: unknown) => setData(d as ImageProps);

  return (
    <>
      <FileInput
        label={t("emailBuilder.blocks.image.imageUrl")}
        accept="image/*"
        defaultValue={data.props?.url ?? ""}
        fullUrl
        onChange={(v) => {
          const url = v.trim().length === 0 ? null : v.trim();
          updateData({ ...data, props: { ...data.props, url } });
        }}
      />

      <TextInput
        label={t("emailBuilder.blocks.image.altText")}
        defaultValue={data.props?.alt ?? ""}
        onChange={(alt) =>
          updateData({ ...data, props: { ...data.props, alt } })
        }
      />
      <TextInput
        label={t("emailBuilder.blocks.image.clickThroughUrl")}
        defaultValue={data.props?.linkHref ?? ""}
        onChange={(v) => {
          const linkHref = v.trim().length === 0 ? null : v.trim();
          updateData({ ...data, props: { ...data.props, linkHref } });
        }}
      />

      {/* <TextDimensionInput
        nullable
        label="Width"
        defaultValue={data.props?.width || null}
        onChange={(width) =>
          updateData({ ...data, props: { ...data.props, width } })
        }
      />

      <TextDimensionInput
        label="Height"
        nullable
        defaultValue={data.props?.height || null}
        onChange={(height) =>
          updateData({ ...data, props: { ...data.props, height } })
        }
      /> */}

      <TextDoubleNumberInput
        label={t("emailBuilder.blocks.image.size")}
        prefix1="W:"
        prefix2="H:"
        nullable
        defaultValue1={data.props?.width ?? null}
        defaultValue2={data.props?.height ?? null}
        onChange1={(width) =>
          updateData({ ...data, props: { ...data.props, width } })
        }
        onChange2={(height) =>
          updateData({ ...data, props: { ...data.props, height } })
        }
        unit="px"
      />

      <TextDoubleNumberInput
        label={t("emailBuilder.blocks.image.position")}
        prefix1="x:"
        prefix2="y:"
        defaultValue1={data.props?.x ?? ImagePropsDefaults.props.x}
        defaultValue2={data.props?.y ?? ImagePropsDefaults.props.y}
        onChange1={(x) => updateData({ ...data, props: { ...data.props, x } })}
        onChange2={(y) => updateData({ ...data, props: { ...data.props, y } })}
        unit="%"
      />

      <RadioGroupInput
        label={t("emailBuilder.blocks.image.alignment")}
        defaultValue={data.props?.contentAlignment ?? "middle"}
        onChange={(contentAlignment) =>
          updateData({ ...data, props: { ...data.props, contentAlignment } })
        }
      >
        <RadioGroupInputItem value="top">
          <ArrowUpToLine fontSize="small" />{" "}
          {t("emailBuilder.blocks.image.top")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="middle">
          <FoldVertical fontSize="small" />{" "}
          {t("emailBuilder.blocks.image.middle")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="bottom">
          <ArrowDownToLine fontSize="small" />{" "}
          {t("emailBuilder.blocks.image.bottom")}
        </RadioGroupInputItem>
      </RadioGroupInput>

      <MultiStylePropertyPanel
        names={["backgroundColor", "textAlign", "padding"]}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </>
  );
};
