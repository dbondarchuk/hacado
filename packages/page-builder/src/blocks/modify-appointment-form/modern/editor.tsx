"use client";

import { useBlockEditor, useCurrentBlock } from "@hacado/builder";
import {
  BlockStyle,
  ReplaceOriginalColors,
  useClassName,
} from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { ModifyAppointmentForm } from "./components/modify-appointment-form";
import { ModifyAppointmentFormProps } from "./schema";
import { styles } from "./styles";

export const ModifyAppointmentFormEditor = ({
  props,
  style,
}: ModifyAppointmentFormProps) => {
  const currentBlock = useCurrentBlock<ModifyAppointmentFormProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  const className = useClassName();
  const base = currentBlock.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <ReplaceOriginalColors />
      <ModifyAppointmentForm
        className={cn(className, base?.className)}
        id={base?.id}
        isEditor
        hideTitle={props.hideTitle}
        hideSteps={props.hideSteps}
        scrollToTop={props.scrollToTop}
        {...overlayProps}
      />
    </>
  );
};
