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
import {
  BlogPostNavigationButtonProps,
  BlogPostNavigationButtonPropsDefaults,
  styles,
} from "./schema";
import { blogPostNavigationButtonShortcuts } from "./shortcuts";

export const BlogPostNavigationButtonConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BlogPostNavigationButtonProps>) => {
    const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);

    const updateStyle = useCallback(
      (s: unknown) =>
        setData({
          ...data,
          style: s as BlogPostNavigationButtonProps["style"],
        }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({
          ...data,
          props: p as BlogPostNavigationButtonProps["props"],
        }),
      [setData, data],
    );

    const direction =
      data.props?.direction ??
      BlogPostNavigationButtonPropsDefaults.props.direction;

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
            "block.postNavigationButton.direction.label" satisfies BlogAdminKeys,
          )}
          defaultValue={direction}
          onChange={(newDirection) =>
            updateProps({ ...data.props, direction: newDirection })
          }
          options={[
            {
              value: "prev",
              label: t(
                "block.postNavigationButton.direction.options.prev" satisfies BlogAdminKeys,
              ),
            },
            {
              value: "next",
              label: t(
                "block.postNavigationButton.direction.options.next" satisfies BlogAdminKeys,
              ),
            },
          ]}
        />
      </StylesConfigurationPanel>
    );
  },
);
