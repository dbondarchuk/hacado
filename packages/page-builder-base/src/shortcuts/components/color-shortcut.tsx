import { BuilderKeys } from "@hacado/i18n";
import { ColorExtendedInput } from "../../style-inputs/base/color-exteneded-input";
import { StyleValue } from "../../style/css-renderer";
import { BaseStyleDictionary } from "../../style/types";
import { ShortcutWithColor } from "../types";

/**
 * Helper function to create color shortcuts
 */
export const createColorShortcut = <T extends BaseStyleDictionary>(
  label: BuilderKeys,
  icon: (props: { className?: string }) => React.ReactNode,
  targetStyle: keyof T,
): ShortcutWithColor<T> => {
  return {
    label,
    icon,
    inputType: "color",
    targetStyle,
  };
};

export const ColorShortcut = <T extends BaseStyleDictionary>({
  shortcut,
  styles,
  onStylesChange,
}: {
  shortcut: ShortcutWithColor<T>;
  styles: StyleValue<T>;
  onStylesChange: (styles: StyleValue<T>) => void;
}) => {
  // Get current color value from the target style
  const currentStyle = styles[shortcut.targetStyle]?.find(
    (s) => !s.breakpoint?.length && !s.state?.length,
  );

  const currentColorValue: string | null = currentStyle?.value || null;

  const handleValueChange = (value: string | null) => {
    const newStyles = { ...styles };

    if (!value) {
      if (newStyles[shortcut.targetStyle]) {
        delete newStyles[shortcut.targetStyle];
      }

      onStylesChange(newStyles);
      return;
    }

    if (newStyles[shortcut.targetStyle]) {
      // Update existing style variants
      const currentVariants = newStyles[shortcut.targetStyle];
      if (currentVariants && currentVariants.length > 0) {
        const updatedVariants = currentVariants.map((variant) => ({
          ...variant,
          value,
        }));
        newStyles[shortcut.targetStyle] =
          updatedVariants as StyleValue<T>[keyof T];
      }
    } else {
      // Create new style variant
      newStyles[shortcut.targetStyle] = [
        {
          breakpoint: [],
          state: [],
          value,
        },
      ] as unknown as StyleValue<T>[keyof T];
    }

    onStylesChange(newStyles);
  };

  return (
    <ColorExtendedInput
      defaultValue={currentColorValue}
      onChange={handleValueChange}
      nullable
    />
  );
};
