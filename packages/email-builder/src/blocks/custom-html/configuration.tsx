"use client";

import { ConfigurationProps } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { deepMemo, Label, Textarea } from "@timelish/ui";
import { useCallback } from "react";
import { HtmlMonacoEditorDialog } from "./html-monaco-editor-dialog";
import { CustomHTMLProps } from "./schema";

export const CustomHTMLConfiguration = deepMemo(
  ({ data, setData }: ConfigurationProps<CustomHTMLProps>) => {
    const t = useI18n("builder");
    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as CustomHTMLProps["props"] }),
      [setData, data],
    );

    const html = data.props?.html ?? "";

    return (
      <>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="html">
              {t("emailBuilder.blocks.customHtml.html")}
            </Label>
            <HtmlMonacoEditorDialog
              value={html}
              onApply={(nextHtml) =>
                updateProps({ ...data.props, html: nextHtml })
              }
            />
          </div>
          <Textarea
            id="html"
            value={html}
            className="w-full text-xs font-mono min-h-[120px]"
            onChange={(e) =>
              updateProps({ ...data.props, html: e.target.value })
            }
          />
        </div>
      </>
    );
  },
);
