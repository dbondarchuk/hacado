import { MyCabinetBlockComponent } from "./component";
import { MyCabinetBlockReaderProps } from "./schema";

export const MyCabinetBlockReader = ({
  block,
  style,
}: MyCabinetBlockReaderProps) => {
  const appId = (block?.metadata as { myCabinetAppId?: string } | undefined)
    ?.myCabinetAppId;
  const waitlistAppId = (
    block?.metadata as { waitlistAppId?: string } | undefined
  )?.waitlistAppId;

  return (
    <MyCabinetBlockComponent
      appId={appId}
      waitlistAppId={waitlistAppId}
      style={style}
      blockBase={block?.base}
      isEditor={false}
      showTitle={block?.data?.props?.showTitle}
      scrollToTop={block?.data?.props?.scrollToTop}
    />
  );
};
