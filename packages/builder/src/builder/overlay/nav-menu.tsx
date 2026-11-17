import { useI18n } from "@hacado/i18n/client";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@hacado/ui/breadcrumb";
import { cn } from "@hacado/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@hacado/ui/dropdown-menu";
import { useIsMobile } from "@hacado/ui/hooks";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from "@hacado/ui/toolbar";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpFromLine,
  Copy,
  Slash,
  Trash,
} from "lucide-react";
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { ToolbarSectionButtons } from "../template-panel/toolbar/toolbar-buttons";

type Props = {
  blockId: string;
  disable?: BlockDisableOptions;
  /** Selected block left offset within the overlay host. */
  blockLeft: number;
  /** Selected block width within the overlay host. */
  blockWidth: number;
};

type Align = "left" | "right";
/** full crumb trail → ../current → split action buttons */
type CompactLevel = "full" | "crumb" | "split";

const EDGE_PADDING = 4;
/** Only loosen compaction when this much spare room exists at the wider layout. */
const EXPAND_HYSTERESIS_PX = 64;
const MAX_DISPLAY_LAST_ELEMENTS = 3;
const MOBILE_DISPLAY_LAST_ELEMENTS = 2;

export const NavMenu: React.FC<Props> = memo(
  ({ blockId, disable, blockLeft, blockWidth }) => {
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

    const { document: documentElement, overlayHost } = usePortalContext();
    const isMobile = useIsMobile(documentElement?.defaultView);

    const blockHierarchy = useBlockHierarchy(blockId) || [];
    const blocks = useBlocks();
    const hierarchy = useMemo(() => {
      return blockHierarchy.map((block) => ({
        ...block,
        displayName: blocks[block.type].displayName,
      }));
    }, [blockHierarchy, blocks]);

    const current = hierarchy[hierarchy.length - 1];
    const parent =
      hierarchy.length > 1 ? hierarchy[hierarchy.length - 2] : null;

    const toolbarRef = useRef<HTMLDivElement>(null);
    const widthsRef = useRef<Partial<Record<CompactLevel, number>>>({});
    const [align, setAlign] = useState<Align>("left");
    const [compactLevel, setCompactLevel] = useState<CompactLevel>("full");
    const [moveMenuOpen, setMoveMenuOpen] = useState(false);
    const [actionsMenuOpen, setActionsMenuOpen] = useState(false);

    useEffect(() => {
      setAlign("left");
      setCompactLevel("full");
      widthsRef.current = {};
    }, [blockId]);

    const hostWidth = overlayHost?.clientWidth ?? 0;

    const overflowFor = useCallback(
      (side: Align, width: number) => {
        if (hostWidth <= 0 || width <= 0) return 0;

        if (side === "left") {
          return Math.max(0, blockLeft + width - (hostWidth - EDGE_PADDING));
        }

        return Math.max(0, width - (blockLeft + blockWidth) + EDGE_PADDING);
      },
      [blockLeft, blockWidth, hostWidth],
    );

    const spareFor = useCallback(
      (side: Align, width: number) => {
        if (hostWidth <= 0 || width <= 0) return 0;

        if (side === "left") {
          return hostWidth - EDGE_PADDING - (blockLeft + width);
        }

        return blockLeft + blockWidth - EDGE_PADDING - width;
      },
      [blockLeft, blockWidth, hostWidth],
    );

    const recomputeLayout = useCallback(() => {
      const toolbar = toolbarRef.current;

      if (!toolbar || hostWidth <= 0) return;

      const currentWidth = toolbar.offsetWidth;

      if (currentWidth > 0) {
        widthsRef.current[compactLevel] = currentWidth;
      }

      const leftOverflow = overflowFor("left", currentWidth);
      const rightOverflow = overflowFor("right", currentWidth);

      let nextAlign: Align = align;

      if (align === "left") {
        if (leftOverflow > 0 && rightOverflow < leftOverflow) {
          nextAlign = "right";
        }
      } else if (rightOverflow > 0 && leftOverflow === 0) {
        nextAlign = "left";
      } else if (rightOverflow > 0 && leftOverflow < rightOverflow) {
        nextAlign = "left";
      }

      if (nextAlign !== align) {
        setAlign(nextAlign);
        return;
      }

      const overflow = overflowFor(nextAlign, currentWidth);

      if (overflow > 0) {
        if (compactLevel === "full") {
          setCompactLevel("crumb");
          return;
        }

        if (compactLevel === "crumb") {
          setCompactLevel("split");
          return;
        }
      }

      if (compactLevel === "split") {
        const crumbWidth = widthsRef.current.crumb ?? currentWidth;
        const crumbOverflow = overflowFor(nextAlign, crumbWidth);

        if (
          crumbOverflow <= 0 &&
          spareFor(nextAlign, crumbWidth) >= EXPAND_HYSTERESIS_PX
        ) {
          setCompactLevel("crumb");
          return;
        }
      }

      if (compactLevel === "crumb") {
        const fullWidth = widthsRef.current.full;

        if (
          fullWidth &&
          overflowFor(nextAlign, fullWidth) <= 0 &&
          spareFor(nextAlign, fullWidth) >= EXPAND_HYSTERESIS_PX
        ) {
          setCompactLevel("full");
        }
      }
    }, [align, compactLevel, hostWidth, overflowFor, spareFor]);

    useLayoutEffect(() => {
      recomputeLayout();
    }, [recomputeLayout]);

    useEffect(() => {
      const toolbar = toolbarRef.current;

      if (!toolbar || typeof ResizeObserver === "undefined") return;

      const observer = new ResizeObserver(() => {
        recomputeLayout();
      });

      observer.observe(toolbar);

      if (overlayHost) observer.observe(overlayHost);

      return () => observer.disconnect();
    }, [overlayHost, recomputeLayout]);

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
    }, [blockId, dispatchAction]);

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
      (e?: React.MouseEvent) => {
        e?.stopPropagation();
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

    const showMove = !disable?.move;
    const showClone = !disable?.clone;
    const showDelete = !disable?.delete;
    const showActions = showClone || showDelete;
    const useSplit = compactLevel === "split";
    const useCompactCrumb = compactLevel !== "full";
    const splitActions = useSplit && showClone && showDelete;

    return (
      <div
        className={cn(
          "absolute -translate-y-full top-[-2px] z-[10] hover:z-50 pointer-events-auto",
          align === "left" ? "left-[-2px]" : "right-[-2px] left-auto",
        )}
      >
        <Toolbar
          ref={toolbarRef}
          role="presentation"
          aria-label="breadcrumb"
          className="bg-background shadow p-1 w-max flex-nowrap"
        >
          <ToolbarSectionButtons section="selection" position="start" />
          <ToolbarSectionButtons section="selection" position="end" />

          {showMove &&
            (useSplit ? (
              <ToolbarGroup>
                <ToolbarSplitButton
                  pressed={moveMenuOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveClick("up");
                  }}
                >
                  <ToolbarSplitButtonPrimary
                    tooltip={tBuilder("baseBuilder.navMenu.moveUp")}
                  >
                    <ArrowUp fontSize="small" />
                  </ToolbarSplitButtonPrimary>
                  <DropdownMenu
                    open={moveMenuOpen}
                    onOpenChange={setMoveMenuOpen}
                    modal={false}
                  >
                    <DropdownMenuTrigger asChild>
                      <ToolbarSplitButtonSecondary />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        onSelect={() => {
                          handleMoveClick("down");
                        }}
                      >
                        <ArrowDown className="size-4" />
                        {tBuilder("baseBuilder.navMenu.moveDown")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!canMoveOut}
                        onSelect={() => {
                          handleMoveOutClick();
                        }}
                      >
                        <ArrowUpFromLine className="size-4" />
                        {tBuilder("baseBuilder.navMenu.moveOut")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ToolbarSplitButton>
              </ToolbarGroup>
            ) : (
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
            ))}

          {showActions &&
            (splitActions ? (
              <ToolbarGroup>
                <ToolbarSplitButton
                  pressed={actionsMenuOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloneClick();
                  }}
                >
                  <ToolbarSplitButtonPrimary
                    tooltip={tBuilder("baseBuilder.navMenu.clone")}
                  >
                    <Copy fontSize="small" />
                  </ToolbarSplitButtonPrimary>
                  <DropdownMenu
                    open={actionsMenuOpen}
                    onOpenChange={setActionsMenuOpen}
                    modal={false}
                  >
                    <DropdownMenuTrigger asChild>
                      <ToolbarSplitButtonSecondary />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        onSelect={() => {
                          handleDeleteClick();
                        }}
                      >
                        <Trash className="size-4" />
                        {tBuilder("baseBuilder.navMenu.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ToolbarSplitButton>
              </ToolbarGroup>
            ) : (
              <ToolbarGroup>
                {showClone && (
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
                {showDelete && (
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
            ))}

          <Breadcrumb aria-label="breadcrumb">
            <BreadcrumbList className="gap-0.5 sm:gap-0.5 text-xs text-foreground flex-nowrap whitespace-nowrap">
              {useCompactCrumb ? (
                <>
                  {parent ? (
                    <>
                      <span
                        className="hover:underline cursor-pointer text-muted-foreground"
                        role="link"
                        title={t(parent.displayName)}
                        onClick={(event) =>
                          handleBlockIdClick(event, parent.id)
                        }
                      >
                        ..
                      </span>
                      <BreadcrumbSeparator className="[&>svg]:size-3">
                        <Slash />
                      </BreadcrumbSeparator>
                    </>
                  ) : null}
                  {current ? (
                    <span
                      className="hover:underline cursor-pointer"
                      role="link"
                      onClick={(event) => handleBlockIdClick(event, current.id)}
                    >
                      {t(current.displayName)}
                    </span>
                  ) : null}
                </>
              ) : (
                hierarchy.map(({ id, displayName }, index) => {
                  const maxDisplayElements = isMobile
                    ? MOBILE_DISPLAY_LAST_ELEMENTS
                    : MAX_DISPLAY_LAST_ELEMENTS;

                  const shouldShow = isMobile
                    ? index >= hierarchy.length - maxDisplayElements
                    : index === 0 ||
                      index >= hierarchy.length - maxDisplayElements;

                  const isMiddleElement =
                    !shouldShow &&
                    index > 0 &&
                    index < hierarchy.length - maxDisplayElements;

                  const isLastMiddleElement =
                    isMiddleElement &&
                    !isMobile &&
                    index === hierarchy.length - (maxDisplayElements + 1);

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
                    return null;
                  }

                  return (
                    <React.Fragment key={id}>
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
                })
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </Toolbar>
      </div>
    );
  },
);
