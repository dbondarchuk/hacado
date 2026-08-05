import { ReaderBlock } from "@hacado/builder";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { BeforeAfterSlider } from "./before-after-slider";
import { NoImagesMessage } from "./no-images-message";
import { BeforeAfterReaderProps } from "./schema";
import { styles } from "./styles";

export const BeforeAfterReader = ({
  props,
  style,
  block,
  ...rest
}: BeforeAfterReaderProps) => {
  if (!props) return null;

  const { sliderPosition, showLabels, orientation } = props;

  const before = props?.before?.children?.[0];
  const after = props?.after?.children?.[0];
  const beforeLabel = props?.beforeLabel?.children?.[0];
  const afterLabel = props?.afterLabel?.children?.[0];

  if (!before || !after) {
    return <NoImagesMessage />;
  }

  const className = generateClassName();
  const base = block.base;

  return (
    <div className="relative w-full h-full">
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <BeforeAfterSlider
        className={cn(className, base?.className)}
        id={base?.id}
        sliderPosition={sliderPosition}
        showLabels={showLabels}
        beforeLabel={
          beforeLabel ? (
            <ReaderBlock {...rest} block={beforeLabel} key={beforeLabel.id} />
          ) : null
        }
        afterLabel={
          afterLabel ? (
            <ReaderBlock {...rest} block={afterLabel} key={afterLabel.id} />
          ) : null
        }
        orientation={orientation}
        before={<ReaderBlock {...rest} block={before} key={before.id} />}
        after={<ReaderBlock {...rest} block={after} key={after.id} />}
      />
    </div>
  );
};
