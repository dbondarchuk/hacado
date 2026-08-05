"use client";

import { ConfigurationProps, TextInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { ConditionalContainerProps } from "./schema";

export const ConditionalContainerConfiguration = ({
  data,
  setData,
}: ConfigurationProps<ConditionalContainerProps>) => {
  const t = useI18n("builder");
  const updateData = (d: unknown) => setData(d as ConditionalContainerProps);

  return (
    <>
      <TextInput
        label={t("emailBuilder.blocks.conditionalContainer.condition")}
        defaultValue={data.props?.condition ?? ""}
        onChange={(condition) =>
          updateData({ ...data, props: { ...data.props, condition } })
        }
      />
    </>
  );
};
