import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn, Icon as IconComponent } from "@hacado/ui";
import { IconPropsDefaults, IconReaderProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

export const Icon = ({ props, style, block }: IconReaderProps) => {
  const iconName = props?.icon ?? IconPropsDefaults.props.icon;
  const defaults = getDefaults({ props, style }, false);

  const className = generateClassName();
  const base = block.base;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        defaults={defaults}
      />
      <IconComponent
        name={iconName}
        className={cn(className, base?.className)}
        id={base?.id}
      />
    </>
  );
};
