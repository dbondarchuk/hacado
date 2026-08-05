"use client";

import { ConfigurationProps, TextInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { ForeachContainerProps } from "./schema";

const parseOptionalCount = (value: string) => {
  if (value === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const ForeachContainerConfiguration = ({
  data,
  setData,
}: ConfigurationProps<ForeachContainerProps>) => {
  const t = useI18n("builder");
  const updateProps = (props: ForeachContainerProps["props"]) =>
    setData({ ...data, props });

  return (
    <>
      <TextInput
        label={t("emailBuilder.blocks.foreachContainer.value")}
        defaultValue={data.props?.value ?? ""}
        onChange={(value) => updateProps({ ...data.props, value })}
      />
      <TextInput
        label={t("emailBuilder.blocks.foreachContainer.skip")}
        helperText={t("emailBuilder.blocks.foreachContainer.skipHelperText")}
        defaultValue={data.props?.skip?.toString() ?? ""}
        onChange={(value) =>
          updateProps({ ...data.props, skip: parseOptionalCount(value) })
        }
      />
      <TextInput
        label={t("emailBuilder.blocks.foreachContainer.take")}
        helperText={t("emailBuilder.blocks.foreachContainer.takeHelperText")}
        defaultValue={data.props?.take?.toString() ?? ""}
        onChange={(value) =>
          updateProps({ ...data.props, take: parseOptionalCount(value) })
        }
      />
    </>
  );
};
