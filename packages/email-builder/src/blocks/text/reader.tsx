import { PlateStaticEditor } from "@hacado/rte";
import { coerceEmailTextValue } from "./coerce-value";
import { TextProps } from "./schema";
import { getStyles } from "./styles";

export const TextReader = ({ style, props }: TextProps) => {
  const styles = getStyles({ style });
  const value = coerceEmailTextValue(props?.value);

  return (
    <div style={styles}>
      <PlateStaticEditor value={value} />
    </div>
  );
};
