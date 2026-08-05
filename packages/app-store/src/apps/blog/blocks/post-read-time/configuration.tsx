"use client";

import { ConfigurationProps, SelectInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import {
  RawNumberInput,
  StylesConfigurationPanel,
} from "@hacado/page-builder-base";
import { deepMemo } from "@hacado/ui";
import { useCallback, useMemo } from "react";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
  BlogPublicKeys,
  BlogPublicNamespace,
  blogPublicNamespace,
} from "../../translations/types";
import { blogTextShortcuts } from "../text-shortcuts";
import {
  getFormatPreview,
  READ_TIME_FORMAT_KEYS,
  ReadTimeFormatKey,
} from "./formats";
import {
  BlogPostReadTimeProps,
  BlogPostReadTimePropsDefaults,
  styles,
} from "./schema";

export const BlogPostReadTimeConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BlogPostReadTimeProps>) => {
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BlogPostReadTimeProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as BlogPostReadTimeProps["props"] }),
      [setData, data],
    );

    const format =
      data.props?.format ?? BlogPostReadTimePropsDefaults.props.format;
    const wordsPerMinute =
      data.props?.wordsPerMinute ??
      BlogPostReadTimePropsDefaults.props.wordsPerMinute;

    const tAdmin = useI18n<BlogAdminNamespace, BlogAdminKeys>(
      blogAdminNamespace,
    );
    const tPublic = useI18n<BlogPublicNamespace, BlogPublicKeys>(
      blogPublicNamespace,
    );

    const formatOptions = useMemo(() => {
      return READ_TIME_FORMAT_KEYS.map((key: ReadTimeFormatKey) => {
        const preview = getFormatPreview(key, tPublic);
        return {
          value: key,
          label: (
            <div className="flex items-center gap-2">
              <span>{preview}</span>
            </div>
          ),
        };
      });
    }, [tPublic]);

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={blogTextShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <SelectInput
          label={tAdmin(
            "block.postReadTime.format.label" satisfies BlogAdminKeys,
          )}
          defaultValue={format}
          onChange={(newFormat) =>
            updateProps({ ...data.props, format: newFormat })
          }
          options={formatOptions}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {tAdmin(
              "block.postReadTime.wordsPerMinute.label" satisfies BlogAdminKeys,
            )}
          </label>
          <RawNumberInput
            iconLabel={<></>}
            value={wordsPerMinute}
            setValue={(value: number | null) =>
              updateProps({
                ...data.props,
                wordsPerMinute: value ?? wordsPerMinute,
              })
            }
            step={25}
            min={100}
            max={400}
            options={[150, 200, 250, 300]}
            nullable
          />
        </div>
      </StylesConfigurationPanel>
    );
  },
);
