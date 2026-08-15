"use client";

import { ConfigurationProps } from "@hacado/builder";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { deepMemo } from "@hacado/ui";
import { useCallback } from "react";
import { blogTextShortcuts } from "../text-shortcuts";
import { BlogPostTitleProps, styles } from "./schema";

export const BlogPostTitleConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BlogPostTitleProps>) => {
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BlogPostTitleProps["style"] }),
      [setData, data],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={blogTextShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      />
    );
  },
);
