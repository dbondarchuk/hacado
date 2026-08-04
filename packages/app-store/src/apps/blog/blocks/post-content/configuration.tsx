"use client";

import { BooleanInput, ConfigurationProps } from "@timelish/builder";
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
import { blogTextShortcuts } from "../text-shortcuts";
import {
  BlogPostContentProps,
  BlogPostContentPropsDefaults,
  BlogPostShortContentProps,
  styles,
} from "./schema";

export const BlogPostContentConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BlogPostContentProps>) => {
    const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BlogPostContentProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as BlogPostContentProps["props"] }),
      [setData, data],
    );

    const showShort =
      data.props?.showShort ?? BlogPostContentPropsDefaults.props.showShort;
    const maxParagraphs =
      !!data.props &&
      "maxParagraphs" in data.props &&
      !!data.props.maxParagraphs
        ? data.props.maxParagraphs
        : BlogPostShortContentProps.maxParagraphs;
    const showOnlyTextParagraphs =
      !!data.props &&
      "showOnlyTextParagraphs" in data.props &&
      typeof data.props.showOnlyTextParagraphs === "boolean"
        ? data.props.showOnlyTextParagraphs
        : BlogPostShortContentProps.showOnlyTextParagraphs;

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={blogTextShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <BooleanInput
          label={t("block.postContent.showShort.label")}
          defaultValue={showShort}
          onChange={(value) => updateProps({ ...data.props, showShort: value })}
        />
        {showShort && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t(
                  "block.postContent.maxParagraphs.label" satisfies BlogAdminKeys,
                )}
              </label>
              <RawNumberInput
                iconLabel={<></>}
                value={maxParagraphs}
                setValue={(value: number | null) =>
                  updateProps({
                    ...data.props,
                    maxParagraphs: value ?? maxParagraphs,
                  })
                }
                step={1}
                min={1}
                max={10}
                options={[1, 3, 5, 10]}
                nullable
              />
            </div>
            <BooleanInput
              label={t(
                "block.postContent.showOnlyTextParagraphs.label" satisfies BlogAdminKeys,
              )}
              defaultValue={showOnlyTextParagraphs}
              onChange={(value) =>
                updateProps({ ...data.props, showOnlyTextParagraphs: value })
              }
            />
          </>
        )}
      </StylesConfigurationPanel>
    );
  },
);
