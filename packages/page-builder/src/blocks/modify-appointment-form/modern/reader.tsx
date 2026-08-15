import {
  BlockStyle,
  generateClassName,
  ReplaceOriginalColors,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { ModifyAppointmentForm } from "./components/modify-appointment-form";
import { ModifyAppointmentFormReaderProps } from "./schema";
import { styles } from "./styles";

export const ModifyAppointmentFormReader = ({
  props,
  style,
  args,
  isEditor,
  ...rest
}: ModifyAppointmentFormReaderProps) => {
  const className = generateClassName();
  const base = rest.block.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      {isEditor && <ReplaceOriginalColors />}
      <ModifyAppointmentForm
        className={cn(className, base?.className)}
        id={base?.id}
        hideTitle={props.hideTitle}
        hideSteps={props.hideSteps}
        scrollToTop={props.scrollToTop}
      />
    </>
  );
};
