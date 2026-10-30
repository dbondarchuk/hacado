"use client";

import { ConfigurationProps } from "@hacado/builder/types";
import { StylesConfigurationPanel } from "@hacado/page-builder-base/configuration-panel";
import { deepMemo } from "@hacado/ui/utils";
import { useCallback } from "react";
import { containerShortcuts } from "../shortcuts";
import { BlogCommentContainerProps, styles } from "./schema";

export const BlogCommentContainerConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BlogCommentContainerProps>) => {
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BlogCommentContainerProps["style"] }),
      [setData, data],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={containerShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      />
    );
  },
);
