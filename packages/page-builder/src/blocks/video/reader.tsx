import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { VideoPropsDefaults, VideoReaderProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";
import { Video } from "./video";

export const VideoReader = ({ props, style, block }: VideoReaderProps) => {
  const base = block?.base;
  const className = generateClassName();
  const safeProps = {
    ...VideoPropsDefaults.props,
    ...(props ?? {}),
  };
  const safeStyle = style ?? {};
  const defaults = getDefaults({ props: safeProps, style: safeStyle }, false);

  return (
    <>
      <BlockStyle
        name={cn(className, base?.className)}
        styleDefinitions={styles}
        styles={safeStyle}
        defaults={defaults}
        isEditor={false}
      />
      <Video
        src={safeProps.src}
        poster={safeProps.poster}
        controls={safeProps.controls}
        autoplay={safeProps.autoplay}
        loop={safeProps.loop}
        muted={safeProps.muted}
        preload={safeProps.preload}
        className={className}
        id={base?.id}
      />
    </>
  );
};
