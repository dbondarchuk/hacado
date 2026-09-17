import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { YouTubeVideoPropsDefaults, YouTubeVideoReaderProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";
import { YouTubeVideo } from "./youtube-video";

export const YouTubeVideoReader = ({
  props,
  style,
  block,
}: YouTubeVideoReaderProps) => {
  const base = block?.base;
  const className = generateClassName();
  const safeProps = {
    ...YouTubeVideoPropsDefaults.props,
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
      <YouTubeVideo
        youtubeUrl={safeProps.youtubeUrl}
        autoplay={safeProps.autoplay}
        controls={safeProps.controls}
        loop={safeProps.loop}
        muted={safeProps.muted}
        showInfo={safeProps.showInfo}
        rel={safeProps.rel}
        modestbranding={safeProps.modestbranding}
        start={safeProps.start}
        end={safeProps.end}
        privacy={safeProps.privacy}
        className={className}
        id={base?.id}
      />
    </>
  );
};
