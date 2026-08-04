"use client";

import { useBlockEditor, useCurrentBlock } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import {
  BlockStyle,
  ReplaceOriginalColors,
  useClassName,
} from "@timelish/page-builder-base";
import { cn, Spinner } from "@timelish/ui";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { FormBlockComponent } from "./component";
import { FormBlockProps, FormBlockPropsDefaults, styles } from "./schema";
import { useFormById } from "./use-form-by-id";

export const FormBlockEditor = ({ props, style }: FormBlockProps) => {
  const currentBlock = useCurrentBlock<FormBlockProps>();
  const overlayProps = useBlockEditor(currentBlock?.id);
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);

  const appId = (currentBlock?.metadata as { formsAppId?: string })?.formsAppId;
  const formId =
    currentBlock?.data?.props?.formId ??
    props?.formId ??
    FormBlockPropsDefaults.props?.formId ??
    null;

  const { status, form, error } = useFormById(appId, formId);

  const className = useClassName();
  const base = currentBlock?.base;

  if (!appId || !formId) {
    return (
      <>
        <BlockStyle
          name={className}
          styleDefinitions={styles}
          styles={style}
          isEditor
        />
        <div
          className={cn(
            className,
            base?.className,
            "min-h-[120px] flex items-center justify-center rounded-md border border-dashed",
          )}
          id={base?.id}
          {...overlayProps}
        >
          <span className="text-muted-foreground text-sm">
            {t("block.form.selectForm" as FormsAdminKeys)}
          </span>
        </div>
      </>
    );
  }

  if (status === "loading") {
    return (
      <>
        <BlockStyle
          name={className}
          styleDefinitions={styles}
          styles={style}
          isEditor
        />
        <div
          className={cn(
            className,
            base?.className,
            "min-h-[120px] flex items-center justify-center rounded-md border border-dashed",
          )}
          id={base?.id}
          {...overlayProps}
        >
          <Spinner className="w-5 h-5 text-muted-foreground" />
        </div>
      </>
    );
  }

  if (status === "success" && form) {
    return (
      <>
        <BlockStyle
          name={className}
          styleDefinitions={styles}
          styles={style}
          isEditor
        />
        <div
          className={cn(className, base?.className)}
          id={base?.id}
          {...overlayProps}
        >
          <ReplaceOriginalColors />
          <FormBlockComponent
            form={form}
            appId={appId}
            style={style ?? {}}
            blockBase={base}
            isEditor
          />
        </div>
      </>
    );
  }

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        isEditor
      />
      <div
        className={cn(
          className,
          base?.className,
          "min-h-[120px] flex items-center justify-center rounded-md border border-dashed",
        )}
        id={base?.id}
        {...overlayProps}
      >
        <span className="text-muted-foreground text-sm">
          {error
            ? t("block.form.loadError" as FormsAdminKeys)
            : t("block.form.preview" as FormsAdminKeys)}
        </span>
      </div>
    </>
  );
};
