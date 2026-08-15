import { colors } from "@hacado/types";

export const ReplaceOriginalColors = () => {
  const values = colors
    .map((color) => `--${color}: var(--value-${color}-color);`)
    .join("\n");

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `@scope  { 
    ${values}

    color: hsl(var(--value-foreground-color));
}`,
      }}
    />
  );
};
