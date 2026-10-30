"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { useConfig } from "@hacado/ui/context";
import type React from "react";
import { useEffect, useState } from "react";
import { CatalogValueComponent } from "./component";
import { formatCatalogPrice, resolveCatalogValue } from "./format";
import { isMultilineProperty, type CatalogSource } from "./properties";
import { toCatalogRecord, type CatalogRecord } from "./record";
import { CatalogValueProps, CatalogValuePropsDefaults } from "./schema";

const loadEntity: Record<CatalogSource, (itemId: string) => Promise<any>> = {
  service: (itemId) => adminApi.services.getService(itemId),
  addon: (itemId) => adminApi.addons.getAddon(itemId),
  member: (itemId) => adminApi.teams.getMemberProfile(itemId),
  package: (itemId) => adminApi.packages.getPackage(itemId),
};

async function fetchCatalogRecord(source: CatalogSource, itemId: string) {
  return toCatalogRecord(source, await loadEntity[source](itemId));
}

type CatalogValueClientProps = {
  props: CatalogValueProps["props"];
  style?: CatalogValueProps["style"];
  blockBase?: { className?: string; id?: string };
  isEditor?: boolean;
  overlayProps?: {
    ref?: React.Ref<HTMLElement>;
    onClick?: (event: React.MouseEvent) => void;
  };
};

export const CatalogValueClient = ({
  props,
  style,
  blockBase,
  isEditor,
  overlayProps,
}: CatalogValueClientProps) => {
  const t = useI18n("builder");
  const config = useConfig();
  const source = props?.source ?? CatalogValuePropsDefaults.props.source;
  const itemId = props?.itemId;
  const property = props?.property ?? CatalogValuePropsDefaults.props.property;
  const [record, setRecord] = useState<CatalogRecord | null>(null);

  useEffect(() => {
    if (!itemId) {
      setRecord(null);
      return;
    }

    let cancelled = false;
    fetchCatalogRecord(source, itemId)
      .then((next) => {
        if (!cancelled) setRecord(next);
      })
      .catch(() => {
        if (!cancelled) setRecord(null);
      });

    return () => {
      cancelled = true;
    };
  }, [source, itemId]);

  const resolved = resolveCatalogValue({
    record,
    source,
    property,
    stripFormatting: props?.stripFormatting,
    durationFormat: props?.durationFormat,
    durationStyle: props?.durationStyle,
    showCurrency: props?.showCurrency,
    alwaysShowCents: props?.alwaysShowCents,
    formatPrice: (amount, options) =>
      formatCatalogPrice(amount, config.language, config.currency, options),
  });

  return (
    <CatalogValueComponent
      resolved={resolved}
      multiline={isMultilineProperty(source, property)}
      style={style}
      blockBase={blockBase}
      isEditor={isEditor}
      overlayProps={overlayProps}
      placeholder={
        isEditor && resolved.kind === "empty"
          ? t("pageBuilder.blocks.catalogValue.empty")
          : undefined
      }
    />
  );
};
