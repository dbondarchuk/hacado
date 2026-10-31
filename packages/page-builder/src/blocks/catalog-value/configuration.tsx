"use client";

import {
  BooleanInput,
  MemberInput,
  SelectInput,
  ServiceInput,
} from "@hacado/builder/inputs";
import { ConfigurationProps } from "@hacado/builder/types";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base/configuration-panel";
import { AddonSelector } from "@hacado/ui-admin/addon-selector";
import { useCanAccessFeature } from "@hacado/ui-admin/context";
import { PackageSelector } from "@hacado/ui-admin/package-selector";
import { Label } from "@hacado/ui/label";
import { useCallback, type ReactNode } from "react";
import {
  catalogProperties,
  catalogSources,
  durationFormats,
  durationStyles,
  isDurationProperty,
  isMultilineProperty,
  isPriceProperty,
  type CatalogSource,
  type DurationFormat,
  type DurationStyle,
} from "./properties";
import { CatalogValueProps, CatalogValuePropsDefaults } from "./schema";
import { catalogValueShortcuts } from "./shortcuts";
import { styles } from "./styles";

type ItemFieldProps = {
  label: string;
  itemId?: string | null;
  onChange: (value: string | null) => void;
};

const itemFields: Record<CatalogSource, (props: ItemFieldProps) => ReactNode> =
  {
    service: ({ label, itemId, onChange }) => (
      <ServiceInput
        label={label}
        defaultValue={itemId ?? null}
        nullable
        onChange={onChange}
      />
    ),
    addon: ({ label, itemId, onChange }) => (
      <div className="flex flex-col gap-2">
        <Label>{label}</Label>
        <AddonSelector
          className="w-full"
          value={itemId ?? undefined}
          onItemSelect={(value) => onChange(value ?? null)}
        />
      </div>
    ),
    member: ({ label, itemId, onChange }) => (
      <MemberInput
        label={label}
        defaultValue={itemId ?? null}
        nullable
        onChange={onChange}
      />
    ),
    package: ({ label, itemId, onChange }) => (
      <div className="flex flex-col gap-2">
        <Label>{label}</Label>
        <PackageSelector
          className="w-full"
          allowClear
          value={itemId ?? undefined}
          onItemSelect={(value) => onChange(value || null)}
        />
      </div>
    ),
  };

export const CatalogValueConfiguration = ({
  data,
  setData,
  base,
  onBaseChange,
}: ConfigurationProps<CatalogValueProps>) => {
  const t = useI18n("builder");
  const canUsePackages = useCanAccessFeature("packages");
  const source = data.props?.source ?? CatalogValuePropsDefaults.props.source;
  const sources = catalogSources.filter(
    (item) => item !== "package" || canUsePackages || source === "package",
  );

  const property =
    data.props?.property ?? CatalogValuePropsDefaults.props.property;
  const properties = catalogProperties[source];

  const updateProps = useCallback(
    (props: CatalogValueProps["props"]) => setData({ ...data, props }),
    [setData, data],
  );

  const updateStyle = useCallback(
    (style: unknown) =>
      setData({ ...data, style: style as CatalogValueProps["style"] }),
    [setData, data],
  );

  return (
    <StylesConfigurationPanel
      styles={data.style ?? {}}
      onStylesChange={updateStyle}
      availableStyles={styles}
      shortcuts={catalogValueShortcuts}
      base={base}
      onBaseChange={onBaseChange}
    >
      <SelectInput
        label={t("pageBuilder.blocks.catalogValue.source")}
        defaultValue={source}
        onChange={(value) =>
          updateProps({
            ...data.props,
            source: value as CatalogSource,
            itemId: null,
            property: "name",
          })
        }
        options={sources.map((item) => ({
          value: item,
          label: t(`pageBuilder.blocks.catalogValue.sources.${item}`),
        }))}
      />
      {itemFields[source]({
        label: t("pageBuilder.blocks.catalogValue.item"),
        itemId: data.props?.itemId,
        onChange: (value) => updateProps({ ...data.props, itemId: value }),
      })}
      <SelectInput
        label={t("pageBuilder.blocks.catalogValue.property")}
        defaultValue={property}
        onChange={(value) => updateProps({ ...data.props, property: value })}
        options={properties.map((item) => ({
          value: item.id,
          label: t(`pageBuilder.blocks.catalogValue.properties.${item.id}`),
        }))}
      />
      {isMultilineProperty(source, property) ? (
        <div className="flex flex-col gap-1">
          <BooleanInput
            label={t("pageBuilder.blocks.catalogValue.stripFormatting")}
            defaultValue={data.props?.stripFormatting ?? false}
            onChange={(value) =>
              updateProps({ ...data.props, stripFormatting: value })
            }
          />
          <p className="text-xs text-muted-foreground">
            {t("pageBuilder.blocks.catalogValue.stripFormattingDescription")}
          </p>
        </div>
      ) : null}
      {isPriceProperty(source, property) ? (
        <>
          <BooleanInput
            label={t("pageBuilder.blocks.catalogValue.alwaysShowCents")}
            defaultValue={data.props?.alwaysShowCents ?? false}
            onChange={(value) =>
              updateProps({ ...data.props, alwaysShowCents: value })
            }
          />
          <BooleanInput
            label={t("pageBuilder.blocks.catalogValue.showCurrency")}
            defaultValue={data.props?.showCurrency ?? false}
            onChange={(value) =>
              updateProps({ ...data.props, showCurrency: value })
            }
          />
        </>
      ) : null}
      {isDurationProperty(source, property) ? (
        <>
          <SelectInput
            label={t("pageBuilder.blocks.catalogValue.durationFormat")}
            defaultValue={
              data.props?.durationFormat ??
              CatalogValuePropsDefaults.props.durationFormat
            }
            onChange={(value) =>
              updateProps({
                ...data.props,
                durationFormat: value as DurationFormat,
              })
            }
            options={durationFormats.map((item) => ({
              value: item,
              label: t(
                `pageBuilder.blocks.catalogValue.durationFormats.${item}`,
              ),
            }))}
          />
          <SelectInput
            label={t("pageBuilder.blocks.catalogValue.durationStyle")}
            defaultValue={
              data.props?.durationStyle ??
              CatalogValuePropsDefaults.props.durationStyle
            }
            onChange={(value) =>
              updateProps({
                ...data.props,
                durationStyle: value as DurationStyle,
              })
            }
            options={durationStyles.map((item) => ({
              value: item,
              label: t(
                `pageBuilder.blocks.catalogValue.durationStyles.${item}`,
              ),
            }))}
          />
        </>
      ) : null}
    </StylesConfigurationPanel>
  );
};
