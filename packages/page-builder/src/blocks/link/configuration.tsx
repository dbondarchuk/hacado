"use client";

import { PageInput, SelectInput } from "@hacado/builder/inputs";
import { ConfigurationProps } from "@hacado/builder/types";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base/configuration-panel";
import { deepMemo } from "@hacado/ui/utils";
import { useCallback } from "react";
import { LinkDefaultTarget, LinkDefaultUrl, LinkProps } from "./schema";
import { linkShortcuts } from "./shortcuts";
import { styles } from "./styles";

export const LinkConfiguration = deepMemo(
  ({ data, setData, base, onBaseChange }: ConfigurationProps<LinkProps>) => {
    const updateStyle = useCallback(
      (s: unknown) => setData({ ...data, style: s as LinkProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) => setData({ ...data, props: p as LinkProps["props"] }),
      [setData, data],
    );

    const t = useI18n("builder");

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={linkShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <PageInput
          label={t("pageBuilder.blocks.link.url")}
          defaultValue={data.props?.url ?? LinkDefaultUrl}
          onChange={(url) => {
            updateProps({ ...data.props, url });
          }}
        />
        <SelectInput
          label={t("pageBuilder.blocks.link.target")}
          defaultValue={data.props?.target ?? LinkDefaultTarget}
          onChange={(target) => {
            updateProps({ ...data.props, target });
          }}
          options={[
            {
              value: "_self",
              label: t("pageBuilder.blocks.link.targets._self"),
            },
            {
              value: "_blank",
              label: t("pageBuilder.blocks.link.targets._blank"),
            },
          ]}
        />
      </StylesConfigurationPanel>
    );
  },
);
