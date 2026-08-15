import { PlateStaticEditor } from "@hacado/rte";
import { TextProps } from "./schema";
import { getStyles } from "./styles";

export const TextReader = ({ style, props }: TextProps) => {
  const styles = getStyles({ style });
  const value = props?.value ?? [];
  return (
    <div style={styles}>
      <PlateStaticEditor value={value} />
    </div>
  );
};
