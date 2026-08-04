import { ConfigurationProps, NumberInputToolbarMenu } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { Leaves } from "@timelish/types";

const fontSizes = [8, 9, 10, 12, 14, 16, 18, 24, 30, 36, 48];

type PropsType = { style?: { fontSize?: number | null } | null };

export const FontSizeToolbarMenu = <T extends PropsType>({
  defaultValue,
  ...props
}: ConfigurationProps<T> & {
  defaultValue: number;
}) => {
  const t = useI18n("builder");
  return (
    <NumberInputToolbarMenu
      defaultValue={defaultValue}
      tooltip={t("emailBuilder.common.toolbars.fontSize.label")}
      options={fontSizes}
      property={"style.fontSize" as Leaves<T>}
      min={8}
      max={48}
      {...props}
    />
  );
};
