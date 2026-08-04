"use client";

import { ConfigurationProps, PageInput, SelectInput } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
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
