"use client";

import { ConfigurationProps, PageInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { Checkbox, deepMemo, Label } from "@hacado/ui";
import { useCallback } from "react";
import { RedirectDefaultUrl, RedirectProps } from "./schema";

export const RedirectConfiguration = deepMemo(
  ({ data, setData }: ConfigurationProps<RedirectProps>) => {
    const updateProps = useCallback(
      (p: unknown) => setData({ ...data, props: p as RedirectProps["props"] }),
      [setData, data],
    );
    const t = useI18n("builder");

    return (
      <>
        <PageInput
          label={t("pageBuilder.blocks.redirect.url")}
          defaultValue={data.props?.url ?? RedirectDefaultUrl}
          onChange={(url) => {
            updateProps({ ...data.props, url });
          }}
        />
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="permanent"
            checked={!!data.props?.permanent}
            onCheckedChange={(checked) =>
              updateProps({ ...data.props, permanent: !!checked })
            }
          />
          <Label htmlFor="permanent">
            {t("pageBuilder.blocks.redirect.permanent")}
          </Label>
        </div>
      </>
    );
  },
);
