"use client";

import { useBlockEditor, useCurrentBlock } from "@hacado/builder";
import { MyCabinetBlockComponent } from "./component";
import { MyCabinetBlockProps } from "./schema";

export const MyCabinetBlockEditor = () => {
  const block = useCurrentBlock<MyCabinetBlockProps>();
  const overlayProps = useBlockEditor(block?.id);
  const appId = (block?.metadata as { myCabinetAppId?: string } | undefined)
    ?.myCabinetAppId;
  const waitlistAppId = (
    block?.metadata as { waitlistAppId?: string } | undefined
  )?.waitlistAppId;

  return (
    <div {...overlayProps}>
      <MyCabinetBlockComponent
        appId={appId}
        waitlistAppId={waitlistAppId}
        style={block?.data?.style ?? {}}
        blockBase={block?.base}
        isEditor
        showTitle={block?.data?.props?.showTitle}
        scrollToTop={block?.data?.props?.scrollToTop}
      />
    </div>
  );
};
