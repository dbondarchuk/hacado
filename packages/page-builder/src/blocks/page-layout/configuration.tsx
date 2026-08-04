"use client";

import { ConfigurationProps } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import {
  backgroundColorStyle,
  COLORS,
  colorStyle,
  fontFamilyStyle,
} from "@timelish/page-builder-base/style";
import { Checkbox, deepMemo, Label } from "@timelish/ui";
import { useCallback } from "react";
import { PageLayoutDefaultProps, PageLayoutProps } from "./schema";

export const PageLayoutConfiguration = deepMemo(
  ({ data, setData }: ConfigurationProps<PageLayoutProps>) => {
    const t = useI18n("builder");
    const updateData = useCallback(
      (d: unknown) => setData(d as PageLayoutProps),
      [setData],
    );

    return (
      <>
        <div className="flex flex-col gap-2">
          <Label>{t("pageBuilder.styles.properties.backgroundColor")}</Label>
          <backgroundColorStyle.component
            value={data.backgroundColor ?? COLORS.background.value}
            onChange={(backgroundColor) =>
              updateData({ ...data, backgroundColor })
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("pageBuilder.styles.properties.fontFamily")}</Label>
          <fontFamilyStyle.component
            value={data.fontFamily}
            onChange={(fontFamily) => updateData({ ...data, fontFamily })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("pageBuilder.styles.properties.color")}</Label>
          <colorStyle.component
            value={data.textColor ?? COLORS.foreground.value}
            onChange={(textColor) => updateData({ ...data, textColor })}
          />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="fullWidth"
            checked={data.fullWidth ?? PageLayoutDefaultProps.fullWidth}
            onCheckedChange={(fullWidth) => updateData({ ...data, fullWidth })}
          />
          <Label htmlFor="fullWidth">
            {t("pageBuilder.blocks.pageLayout.fullWidth")}
          </Label>
        </div>
      </>
    );
  },
);
