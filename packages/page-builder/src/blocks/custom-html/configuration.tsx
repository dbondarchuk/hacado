"use client";

import { ConfigurationProps } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { deepMemo, Label, Textarea } from "@hacado/ui";
import { useCallback } from "react";
import { HtmlMonacoEditorDialog } from "./html-monaco-editor-dialog";
import { CustomHTMLProps } from "./schema";
import { styles } from "./styles";

export const CustomHTMLConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<CustomHTMLProps>) => {
    const t = useI18n("builder");
    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as CustomHTMLProps["props"] }),
      [setData, data],
    );
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as CustomHTMLProps["style"] }),
      [setData, data],
    );

    const html = data.props?.html ?? "";

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        base={base}
        onBaseChange={onBaseChange}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="html">
              {t("pageBuilder.blocks.customHtml.html")}
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
      </StylesConfigurationPanel>
    );
  },
);
