"use client";

import { TextInput } from "@hacado/builder/inputs";
import { ConfigurationProps } from "@hacado/builder/types";
import { useI18n } from "@hacado/i18n/client";
import { deepMemo } from "@hacado/ui";
import { useCallback } from "react";
import { ConditionalContainerProps } from "./schema";

export const ConditionalContainerConfiguration = deepMemo(
  ({ data, setData }: ConfigurationProps<ConditionalContainerProps>) => {
    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as ConditionalContainerProps["props"] }),
      [setData, data],
    );
    const t = useI18n("builder");

    return (
      <>
        <TextInput
          label={t("pageBuilder.blocks.conditionalContainer.condition")}
          defaultValue={data.props?.condition ?? ""}
          onChange={(condition) => updateProps({ ...data.props, condition })}
        />
      </>
    );
  },
);
