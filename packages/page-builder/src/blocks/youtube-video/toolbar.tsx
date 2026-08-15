import { ShortcutsToolbar } from "@hacado/page-builder-base";
import { YouTubeVideoProps } from "./schema";
import { youtubeVideoShortcuts } from "./shortcuts";

interface YouTubeVideoToolbarProps {
  data: YouTubeVideoProps;
  setData: (data: YouTubeVideoProps) => void;
}

export const YouTubeVideoToolbar: React.FC<YouTubeVideoToolbarProps> = ({
  data,
  setData,
}) => {
  return (
    <ShortcutsToolbar
      data={data}
      setData={setData}
      shortcuts={youtubeVideoShortcuts}
    />
  );
};
