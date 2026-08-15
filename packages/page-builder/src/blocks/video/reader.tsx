import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { forwardRef, HTMLAttributes } from "react";
import { VideoPropsDefaults, VideoReaderProps } from "./schema";
import { styles } from "./styles";
import { getDefaults } from "./styles.default";

// Define the shape for the video props
interface VideoInnerProps {
  src?: string | null;
  poster?: string | null;
  controls?: boolean | null;
  autoplay?: boolean | null;
  loop?: boolean | null;
  muted?: boolean | null;
  preload?: "none" | "metadata" | "auto" | null;
}

export const Video = forwardRef<
  HTMLVideoElement,
  Pick<HTMLAttributes<HTMLVideoElement>, "onClick"> &
    Pick<VideoReaderProps, "style" | "props" | "block">
>(({ style, props, block, ...rest }, ref) => {
  const base = block?.base;
  const className = generateClassName();
  const safeProps: VideoInnerProps = {
    ...VideoPropsDefaults.props,
    ...(props ?? {}),
  };
  const safeStyle = style ?? {};

  const videoElement = (
    <video
      {...rest}
      className={cn("block", className, base?.className)}
      src={safeProps.src ?? ""}
      poster={safeProps.poster ?? undefined}
      controls={safeProps.controls ?? true}
      autoPlay={safeProps.autoplay ?? false}
      loop={safeProps.loop ?? false}
      muted={safeProps.muted ?? false}
      preload={safeProps.preload ?? "metadata"}
      id={base?.id}
      ref={ref}
    />
  );

  const defaults = getDefaults({ props: safeProps, style: safeStyle }, false);

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={safeStyle}
        defaults={defaults}
        isEditor={false}
      />
      {videoElement}
    </>
  );
});
