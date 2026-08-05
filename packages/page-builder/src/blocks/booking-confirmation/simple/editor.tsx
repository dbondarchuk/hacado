"use client";

import {
  useBlockEditor,
  useCurrentBlock,
  useEditorArgs,
} from "@hacado/builder";
import {
  BlockStyle,
  ReplaceOriginalColors,
  useClassName,
} from "@hacado/page-builder-base";
import { Appointment } from "@hacado/types";
import { cn } from "@hacado/ui";
import { useMemo } from "react";
import { ConfirmationCard } from "./confirmation-card";
import { BookingConfirmationProps } from "./schema";
import { styles } from "./styles";

const useAppointment = () => {
  const args = useEditorArgs();

  const appointment = useMemo(
    () => args.appointment as Appointment,
    [JSON.stringify(args.appointment)],
  );

  return appointment;
};

export const BookingConfirmationEditor = ({
  props,
  style,
}: BookingConfirmationProps) => {
  const currentBlock = useCurrentBlock<BookingConfirmationProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const appointment = useAppointment();

  const className = useClassName();
  const base = currentBlock.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <ReplaceOriginalColors />
      <ConfirmationCard
        className={cn(className, base?.className)}
        id={base?.id}
        appointment={appointment}
        {...overlayProps}
      />
    </>
  );
};
