import { useI18n } from "@hacado/i18n/client";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbSeparator,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  useIsMobile,
} from "@hacado/ui";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpFromLine,
  Copy,
  Slash,
  Trash,
} from "lucide-react";
import React, { memo, useCallback, useMemo } from "react";
import {
  useBlockHierarchy,
  useBlockParentData,
  useBlocks,
  useDispatchAction,
  useDocument,
  useRootBlockId,
  useSetSelectedBlockId,
} from "../../documents/editor/context";
import { BlockDisableOptions } from "../../documents/editor/core";
import { getMoveBlockOutTarget } from "../../documents/helpers/blocks";
import { usePortalContext } from "../template-panel/portal-context";

type Props = {
  blockId: string;
  disable?: BlockDisableOptions;
};

const MAX_DISPLAY_LAST_ELEMENTS = 3;
const MOBILE_DISPLAY_LAST_ELEMENTS = 2;

export const NavMenu: React.FC<Props> = memo(({ blockId, disable }) => {
  const setSelectedBlockId = useSetSelectedBlockId();
  const dispatchAction = useDispatchAction();
  const tBuilder = useI18n("builder");
  const t = useI18n();
  const document = useDocument();
  const rootBlockId = useRootBlockId();
  const parentData = useBlockParentData(blockId);
  const parentInGrandparent = useBlockParentData(
    parentData?.parentBlockId ?? null,
  );
  const canMoveOut =
    blockId !== rootBlockId && !!parentInGrandparent?.parentBlockId;

  const { document: documentElement } = usePortalContext();
  const isMobile = useIsMobile(documentElement?.defaultView);

  const blockHierarchy = useBlockHierarchy(blockId) || [];
  const blocks = useBlocks();
  const hierarchy = useMemo(() => {
    return blockHierarchy.map((block) => ({
      ...block,
      displayName: blocks[block.type].displayName,
    }));
  }, [blockHierarchy, blocks]);

  const handleBlockIdClick = useCallback(
    (ev: React.MouseEvent, id: string) => {
      setSelectedBlockId(id);
      ev.stopPropagation();
      ev.preventDefault();
    },
    [setSelectedBlockId],
  );

  const handleDeleteClick = useCallback(() => {
    dispatchAction({
      type: "delete-block",
      value: {
        blockId: blockId,
      },
    });
  }, [blockId, dispatchAction, setSelectedBlockId]);

  const handleMoveClick = useCallback(
    (direction: "up" | "down") => {
      dispatchAction({
        type: direction === "up" ? "move-block-up" : "move-block-down",
        value: {
          blockId: blockId,
        },
      });
    },
    [blockId, dispatchAction],
  );

  const handleCloneClick = useCallback(() => {
    dispatchAction({
      type: "clone-block",
      value: {
        blockId: blockId,
      },
    });
  }, [blockId, dispatchAction]);

  const handleMoveOutClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const target = getMoveBlockOutTarget(document, blockId);
      if (!target) return;
      dispatchAction({
        type: "move-block",
        value: {
          blockId,
          ...target,
        },
      });
    },
    [blockId, dispatchAction, document],
  );

  return (
    <>
      <Toolbar
        role="presentation"
        aria-label="breadcrumb"
        className="bg-background shadow p-1 w-max flex-wrap"
      >
        {!disable?.move && (
          <ToolbarGroup>
            <ToolbarButton
              tooltip={tBuilder("baseBuilder.navMenu.moveUp")}
              onClick={(e) => {
                e.stopPropagation();
                handleMoveClick("up");
              }}
            >
              <ArrowUp fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              onClick={(e) => {
                e.stopPropagation();
                handleMoveClick("down");
              }}
              tooltip={tBuilder("baseBuilder.navMenu.moveDown")}
            >
              <ArrowDown fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              disabled={!canMoveOut}
              onClick={handleMoveOutClick}
              tooltip={tBuilder("baseBuilder.navMenu.moveOut")}
            >
              <ArrowUpFromLine fontSize="small" />
            </ToolbarButton>
          </ToolbarGroup>
        )}
        {(!disable?.delete || !disable?.clone) && (
          <ToolbarGroup>
            {!disable?.clone && (
              <ToolbarButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloneClick();
                }}
                tooltip={tBuilder("baseBuilder.navMenu.clone")}
              >
                <Copy fontSize="small" />
              </ToolbarButton>
            )}
            {!disable?.delete && (
              <ToolbarButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick();
                }}
                tooltip={tBuilder("baseBuilder.navMenu.delete")}
              >
                <Trash fontSize="small" />
              </ToolbarButton>
            )}
          </ToolbarGroup>
        )}
        {/* <ToolbarGroup>
          {BlockToolbar && (
            <BlockToolbar data={block.data} setData={setBlockData} />
          )}
        </ToolbarGroup> */}
        <Breadcrumb aria-label="breadcrumb">
          <BreadcrumbList className="gap-0.5 sm:gap-0.5 text-xs text-foreground">
            {hierarchy?.map(({ id, displayName }, index) => {
              // On mobile: show only last elements with "..." at the beginning
              // On desktop: show first element, last elements, and "..." for middle elements
              const maxDisplayElements = isMobile
                ? MOBILE_DISPLAY_LAST_ELEMENTS
                : MAX_DISPLAY_LAST_ELEMENTS;
              const shouldShow = isMobile
                ? index >= hierarchy.length - maxDisplayElements
                : index === 0 || index >= hierarchy.length - maxDisplayElements;
              const isMiddleElement =
                !shouldShow &&
                index > 0 &&
                index < hierarchy.length - maxDisplayElements;
              const isLastMiddleElement =
                isMiddleElement &&
                !isMobile &&
                index === hierarchy.length - (maxDisplayElements + 1);

              // On mobile, show "..." at the beginning if there are more than 2 elements
              if (
                isMobile &&
                hierarchy.length > maxDisplayElements &&
                index === 0
              ) {
                return (
                  <React.Fragment key="mobile-ellipsis">
                    <span className="text-muted-foreground">...</span>
                    <BreadcrumbSeparator className="[&>svg]:size-3">
                      <Slash />
                    </BreadcrumbSeparator>
                  </React.Fragment>
                );
              }

              if (isMiddleElement && !isLastMiddleElement) {
                return null; // Skip middle elements except the last one
              }

              return (
                <React.Fragment key={index}>
                  {isLastMiddleElement ? (
                    <>
                      <span className="text-muted-foreground">...</span>
                      <BreadcrumbSeparator className="[&>svg]:size-3">
                        <Slash />
                      </BreadcrumbSeparator>
                    </>
                  ) : (
                    <span
                      className="hover:underline cursor-pointer"
                      role="link"
                      onClick={(event) => handleBlockIdClick(event, id)}
                    >
                      {t(displayName)}
                    </span>
                  )}
                  {index < hierarchy.length - 1 && shouldShow && (
                    <BreadcrumbSeparator className="[&>svg]:size-3">
                      <Slash />
                    </BreadcrumbSeparator>
                  )}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </Toolbar>
    </>
  );
});
