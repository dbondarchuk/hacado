"use client";

import { ConfigurationProps } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import {
  RawNumberInput,
  StylesConfigurationPanel,
} from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
import { useCallback } from "react";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";
import { containerShortcuts } from "../shortcuts";
import { BlogCommentsContainerProps, styles } from "./schema";

export const BlogCommentsContainerConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BlogCommentsContainerProps>) => {
    const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);

    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BlogCommentsContainerProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as BlogCommentsContainerProps["props"] }),
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
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t(
              "block.commentsContainer.commentsPerPage.label" satisfies BlogAdminKeys,
            )}
          </label>
          <RawNumberInput
            iconLabel={<></>}
            value={data.props?.commentsPerPage ?? 10}
            setValue={(value: number | null) =>
              updateProps({
                ...data.props,
                commentsPerPage: value ?? 10,
              })
            }
            step={1}
            min={1}
            max={100}
            options={[5, 10, 20, 50]}
            nullable
          />
        </div>
      </StylesConfigurationPanel>
    );
  },
);
