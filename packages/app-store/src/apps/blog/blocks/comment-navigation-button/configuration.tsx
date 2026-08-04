"use client";

import { ConfigurationProps, SelectInput } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
import { useCallback } from "react";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";
import { blogPostNavigationButtonShortcuts } from "../post-navigation-button/shortcuts";
import {
  BlogCommentNavigationButtonProps,
  BlogCommentNavigationButtonPropsDefaults,
  styles,
} from "./schema";

export const BlogCommentNavigationButtonConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BlogCommentNavigationButtonProps>) => {
    const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);

    const updateStyle = useCallback(
      (s: unknown) =>
        setData({
          ...data,
          style: s as BlogCommentNavigationButtonProps["style"],
        }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({
          ...data,
          props: p as BlogCommentNavigationButtonProps["props"],
        }),
      [setData, data],
    );

    const direction =
      data.props?.direction ??
      BlogCommentNavigationButtonPropsDefaults.props.direction;

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        base={base}
        onBaseChange={onBaseChange}
        shortcuts={blogPostNavigationButtonShortcuts}
      >
        <SelectInput
          label={t(
            "block.commentNavigationButton.direction.label" satisfies BlogAdminKeys,
          )}
          defaultValue={direction}
          onChange={(newDirection) =>
            updateProps({ ...data.props, direction: newDirection })
          }
          options={[
            {
              value: "prev",
              label: t(
                "block.commentNavigationButton.direction.prev" satisfies BlogAdminKeys,
              ),
            },
            {
              value: "next",
              label: t(
                "block.commentNavigationButton.direction.next" satisfies BlogAdminKeys,
              ),
            },
          ]}
        />
      </StylesConfigurationPanel>
    );
  },
);
