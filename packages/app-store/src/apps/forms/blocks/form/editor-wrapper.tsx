"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  BlockStyle,
  generateClassName,
  ReplaceOriginalColors,
} from "@timelish/page-builder-base/reader";
import { cn, Spinner } from "@timelish/ui";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { FormBlockComponent } from "./component";
import { FormBlockProps, FormBlockPropsDefaults, styles } from "./schema";
import { useFormById } from "./use-form-by-id";

type FormBlockEditorWrapperProps = {
  props: FormBlockProps["props"];
  style: FormBlockProps["style"];
  blockBase?: { className?: string; id?: string };
  appId?: string;
  args?: unknown;
};

export const FormBlockEditorWrapper = ({
  props,
  style,
  blockBase,
  appId,
}: FormBlockEditorWrapperProps) => {
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  const formId = props?.formId ?? FormBlockPropsDefaults.props?.formId ?? null;

  const { status, form, error } = useFormById(appId, formId);

  const className = generateClassName();

  if (!appId || !formId) {
    return (
      <>
        <BlockStyle
          name={className}
          styleDefinitions={styles}
          styles={style ?? {}}
          isEditor
        />
        <ReplaceOriginalColors />
        <div
          className={cn(
            className,
            blockBase?.className,
            "min-h-[120px] flex items-center justify-center rounded-md border border-dashed",
          )}
          id={blockBase?.id}
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
          styles={style ?? {}}
          isEditor
        />
        <ReplaceOriginalColors />
        <div
          className={cn(
            className,
            blockBase?.className,
            "min-h-[120px] flex items-center justify-center rounded-md border border-dashed",
          )}
          id={blockBase?.id}
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
          styles={style ?? {}}
          isEditor
        />
        <ReplaceOriginalColors />
        <div className={cn(className, blockBase?.className)} id={blockBase?.id}>
          <FormBlockComponent
            form={form}
            appId={appId}
            style={style ?? {}}
            blockBase={blockBase}
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
        styles={style ?? {}}
        isEditor
      />
      <ReplaceOriginalColors />
      <div
        className={cn(
          className,
          blockBase?.className,
          "min-h-[120px] flex items-center justify-center rounded-md border border-dashed",
        )}
        id={blockBase?.id}
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
