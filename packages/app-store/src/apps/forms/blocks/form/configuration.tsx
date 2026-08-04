"use client";

import { AppSelectorInput, ConfigurationProps } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
import { useCallback } from "react";
import { FormSelector } from "../../components/form-selector";
import { FORMS_APP_NAME } from "../../const";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { FormBlockProps, FormBlockPropsDefaults, styles } from "./schema";

export const FormBlockConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
    metadata,
    onMetadataChange,
  }: ConfigurationProps<FormBlockProps>) => {
    const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
    const updateStyle = useCallback(
      (s: unknown) => setData({ ...data, style: s as FormBlockProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) => setData({ ...data, props: p as FormBlockProps["props"] }),
      [setData, data],
    );

    const updateMetadata = useCallback(
      (m: Record<string, unknown>) => onMetadataChange(m),
      [onMetadataChange],
    );

    const appId = (metadata?.formsAppId as string) ?? "";
    const formId =
      data.props?.formId ?? FormBlockPropsDefaults.props?.formId ?? null;

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        base={base}
        onBaseChange={onBaseChange}
      >
        <AppSelectorInput
          label={t("block.formsAppId.label" as FormsAdminKeys)}
          helperText={t("block.formsAppId.helperText" as FormsAdminKeys)}
          defaultValue={appId}
          appName={FORMS_APP_NAME}
          onChange={(value) =>
            updateMetadata({ ...metadata, formsAppId: value ?? "" })
          }
        />
        {appId ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t("block.form.formId.label" as FormsAdminKeys)}
            </label>
            <FormSelector
              appId={appId}
              value={formId ?? undefined}
              onItemSelect={(id) =>
                updateProps({ ...data.props, formId: id ?? null })
              }
              allowClear
            />
          </div>
        ) : null}
      </StylesConfigurationPanel>
    );
  },
);
