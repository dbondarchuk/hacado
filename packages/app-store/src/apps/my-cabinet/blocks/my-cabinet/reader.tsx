import { MyCabinetBlockComponent } from "./component";
import { MyCabinetBlockReaderProps } from "./schema";

export const MyCabinetBlockReader = ({
  block,
  style,
}: MyCabinetBlockReaderProps) => {
  const appId = (block?.metadata as { myCabinetAppId?: string } | undefined)
    ?.myCabinetAppId;

  return (
    <MyCabinetBlockComponent
      appId={appId}
      style={style}
      blockBase={block?.base}
      isEditor={false}
      showTitle={block?.data?.props?.showTitle}
      scrollToTop={block?.data?.props?.scrollToTop}
    />
  );
};
