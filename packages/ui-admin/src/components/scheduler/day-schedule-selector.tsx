"use client";

import { useI18n } from "@timelish/i18n/client";
import { AvailablePeriod, Shift } from "@timelish/types";
import { cn, use12HourFormat } from "@timelish/ui";
import { GripHorizontal, X } from "lucide-react";
import { DateTime } from "luxon";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  formatTime,
  generateId,
  generateTimeSlots,
  getWeekDayMap,
  minutesToTime,
  timeToMinutes,
} from "./utils";

// Define types
export interface DayScheduleSelectorProps {
  days?: number[];
  interval?: number;
  startHour?: number;
  endHour?: number;
  scrollToHour?: number;
  value?: AvailablePeriod[];
  onChange?: (value: AvailablePeriod[]) => void;
  disabled?: boolean;
  weekDate?: Date;
}

interface Block {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
}

type DragState =
  | {
      type: "resize-start" | "resize-end";
      blockId: string;
      day: number;
      startTime: string;
      initialY: number;
    }
  | {
      type: "move";
      blockId: string;
      day: number;
      startTime: string;
      initialX: number;
      initialY: number;
      offsetX: number;
      offsetY: number;
    }
  | null;

// Define grid classes
const gridColsClasses = {
  1: "grid-cols-[100px_1fr]",
  2: "grid-cols-[100px_repeat(2,minmax(150px,_1fr))]",
  3: "grid-cols-[100px_repeat(3,minmax(150px,_1fr))]",
  4: "grid-cols-[100px_repeat(4,minmax(150px,_1fr))]",
  5: "grid-cols-[100px_repeat(5,minmax(150px,_1fr))]",
  6: "grid-cols-[100px_repeat(6,minmax(150px,_1fr))]",
  7: "grid-cols-[100px_repeat(7,minmax(150px,_1fr))]",
};

export const DayScheduleSelector: React.FC<DayScheduleSelectorProps> = ({
  days = [1, 2, 3, 4, 5, 6, 7],
  interval = 5,
  startHour = 0,
  endHour = 23,
  scrollToHour = 8,
  value = [],
  onChange,
  disabled,
  weekDate,
}) => {
  const t = useI18n("ui");
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{
    day: number;
    time: string;
  } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{
    day: number;
    time: string;
  } | null>(null);

  const uses12HourFormat = use12HourFormat();
  const [cellDimensions, setCellDimensions] = useState<
    Record<number, { width: number; height: number }>
  >({});

  const [timeCellDimensions, setTimeCellDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [dragState, setDragState] = useState<DragState>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // Generate time slots based on props
  const timeSlots = useMemo(() => {
    return generateTimeSlots(
      { hour: startHour, minute: 0 },
      { hour: endHour, minute: 59 },
      interval,
    );
  }, [startHour, endHour, interval]);

  const weekDayMap = getWeekDayMap(
    t("calendar.monday"),
    t("calendar.tuesday"),
    t("calendar.wednesday"),
    t("calendar.thursday"),
    t("calendar.friday"),
    t("calendar.saturday"),
    t("calendar.sunday"),
  );

  // Store blocks directly instead of using a grid
  const [blocks, setBlocks] = useState<Block[]>(() => {
    const initialBlocks: Block[] = [];

    // Convert the provided value to blocks
    value.forEach((period) => {
      period.shifts.forEach((shift) => {
        initialBlocks.push({
          id: generateId(),
          day: period.weekDay,
          startTime: shift.start,
          endTime: shift.end,
        });
      });
    });

    return initialBlocks;
  });

  // Format time with the utility function
  const formatTimeWithLocale = (
    time: string,
    amLabel = "AM",
    pmLabel = "PM",
  ) => {
    return formatTime(time, uses12HourFormat, amLabel, pmLabel);
  };

  // Convert blocks to AvailablePeriod[] format
  const blocksToAvailablePeriods = useCallback(
    (blocks: Block[]): AvailablePeriod[] => {
      const periodMap: Record<number, Shift[]> = {};

      // Group shifts by day
      blocks.forEach((block) => {
        if (!periodMap[block.day]) {
          periodMap[block.day] = [];
        }

        periodMap[block.day].push({
          start: block.startTime,
          end: block.endTime,
        });
      });

      // Convert to AvailablePeriod[]
      const periods: AvailablePeriod[] = [];
      Object.entries(periodMap).forEach(([day, shifts]) => {
        periods.push({
          weekDay: Number.parseInt(day),
          shifts,
        });
      });

      return periods;
    },
    [],
  );

  // Update blocks when value prop changes
  useEffect(() => {
    // Skip if we're in the middle of updating from blocks to value
    if (isUpdatingRef.current || isUserInteracting) return;

    // // Compare current blocks with value to avoid unnecessary updates
    // const currentPeriods = blocksToAvailablePeriods(blocks);

    // // Simple check if the arrays have the same length
    // if (currentPeriods.length === value.length) {
    //   // Skip update if the arrays seem to represent the same data
    //   // This is a simple check that could be made more robust
    //   let seemsEqual = true;

    //   for (let i = 0; i < value.length; i++) {
    //     const valuePeriod = value[i];
    //     const currentPeriod = currentPeriods.find(
    //       (p) => p.weekDay === valuePeriod.weekDay
    //     );

    //     if (
    //       !currentPeriod ||
    //       currentPeriod.shifts.length !== valuePeriod.shifts.length
    //     ) {
    //       seemsEqual = false;
    //       break;
    //     }

    //     if (
    //       currentPeriod.shifts.some(
    //         (ps) =>
    //           !valuePeriod.shifts.some(
    //             (vs) => ps.start === vs.start && ps.end === vs.end
    //           )
    //       )
    //     ) {
    //       seemsEqual = false;
    //       break;
    //     }
    //   }

    //   if (seemsEqual) return;
    // }

    const newBlocks: Block[] = [];

    // Convert the provided value to blocks
    value.forEach((period) => {
      period.shifts.forEach((shift) => {
        newBlocks.push({
          id: generateId(),
          day: period.weekDay,
          startTime: shift.start,
          endTime: shift.end,
        });
      });
    });

    setBlocks(newBlocks);
  }, [value, blocksToAvailablePeriods]);

  // Calculate cell dimensions
  useEffect(() => {
    if (!gridRef.current) return;

    const updateDimensions = () => {
      const sizes: typeof cellDimensions = {};
      for (const day of days) {
        const cells = gridRef.current?.querySelectorAll(
          `.grid-cell-day-${day}`,
        );
        if (cells && cells.length > 0) {
          const cell = cells[0] as HTMLElement;
          const rect = cell.getBoundingClientRect();
          sizes[day] = {
            width: rect.width,
            height: rect.height,
          };
        }
      }
      setCellDimensions(sizes);

      const timeCells = gridRef.current?.querySelectorAll(".time-cell");
      if (timeCells && timeCells.length > 0) {
        const cell = timeCells[0] as HTMLElement;
        setTimeCellDimensions({
          width: cell.offsetWidth,
          height: cell.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(gridRef.current);

    // Add a small delay to ensure the grid has rendered
    const timeoutId = setTimeout(updateDimensions, 100);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, []);

  // Scroll to the specified hour
  useEffect(() => {
    if (!containerRef.current || !scrollToHour) return;

    // Find the time slot closest to the scrollTo hour
    const targetTime = `${scrollToHour.toString().padStart(2, "0")}:00`;
    const timeIndex = timeSlots.findIndex((time) => time === targetTime);

    if (timeIndex !== -1) {
      // Find the element for this time slot
      const timeRowElement = containerRef.current.querySelector(
        `[data-time-index="${timeIndex}"]`,
      );
      if (timeRowElement) {
        // Scroll to the element with some offset
        containerRef.current.scrollTop =
          (timeRowElement as HTMLElement).offsetTop - 100;
      }
    }
  }, [scrollToHour, timeSlots]);

  // Check if two blocks overlap
  const blocksOverlap = (block1: Block, block2: Block): boolean => {
    if (block1.day !== block2.day) return false;

    const start1 = timeToMinutes(block1.startTime);
    const end1 = timeToMinutes(block1.endTime);
    const start2 = timeToMinutes(block2.startTime);
    const end2 = timeToMinutes(block2.endTime);

    return start1 < end2 && end1 > start2;
  };

  // Check if two blocks are touching
  const blocksTouching = (block1: Block, block2: Block): boolean => {
    if (block1.day !== block2.day) return false;

    const start1 = timeToMinutes(block1.startTime);
    const end1 = timeToMinutes(block1.endTime);
    const start2 = timeToMinutes(block2.startTime);
    const end2 = timeToMinutes(block2.endTime);

    return end1 === start2 || end2 === start1;
  };

  // Merge overlapping or touching blocks
  const mergeBlocks = (blockList: Block[]): Block[] => {
    if (blockList.length <= 1) return blockList;

    // Group blocks by day
    const blocksByDay: Record<number, Block[]> = {};
    blockList.forEach((block) => {
      if (!blocksByDay[block.day]) {
        blocksByDay[block.day] = [];
      }
      blocksByDay[block.day].push(block);
    });

    const mergedBlocks: Block[] = [];

    // Process each day separately
    Object.values(blocksByDay).forEach((dayBlocks) => {
      // Sort blocks by start time
      dayBlocks.sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
      );

      let currentBlock = dayBlocks[0];

      for (let i = 1; i < dayBlocks.length; i++) {
        const nextBlock = dayBlocks[i];

        // Check if blocks overlap or touch
        if (
          blocksOverlap(currentBlock, nextBlock) ||
          blocksTouching(currentBlock, nextBlock)
        ) {
          // Merge the blocks
          currentBlock = {
            ...currentBlock,
            startTime:
              timeToMinutes(currentBlock.startTime) <
              timeToMinutes(nextBlock.startTime)
                ? currentBlock.startTime
                : nextBlock.startTime,
            endTime:
              timeToMinutes(currentBlock.endTime) >
              timeToMinutes(nextBlock.endTime)
                ? currentBlock.endTime
                : nextBlock.endTime,
          };
        } else {
          // Add the current block and move to the next one
          mergedBlocks.push(currentBlock);
          currentBlock = nextBlock;
        }
      }

      // Add the last block
      mergedBlocks.push(currentBlock);
    });

    return mergedBlocks;
  };

  // Update the parent component when blocks change
  useEffect(() => {
    if (onChange) {
      // Set flag to prevent circular updates
      isUpdatingRef.current = true;

      const periods = blocksToAvailablePeriods(blocks);
      onChange(periods);

      // Reset the flag after a short delay to allow React to process the update
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [blocks, blocksToAvailablePeriods]);

  // Calculate position and size for a block
  const getBlockStyle = (block: Block) => {
    if (cellDimensions[block.day].width === 0) return { display: "none" };

    const dayIndex = days.indexOf(block.day);
    const startTimeIndex = timeSlots.indexOf(block.startTime);
    const endTimeIndex =
      block.endTime === "24:00"
        ? timeSlots.length
        : timeSlots.indexOf(block.endTime);

    if (dayIndex === -1 || startTimeIndex === -1) return { display: "none" };

    const daysWidth = Object.entries(cellDimensions)
      .filter(([day]) => parseInt(day) < block.day)
      .reduce((sum, [_, value]) => (sum += value.width), 0);

    const left = timeCellDimensions.width + daysWidth;
    const top =
      timeCellDimensions.height +
      startTimeIndex * cellDimensions[block.day].height;
    const height =
      (endTimeIndex - startTimeIndex) * cellDimensions[block.day].height;

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${cellDimensions[block.day].width}px`,
      height: `${height}px`,
    };
  };

  const getSelectionPreviewStyle = () => {
    if (
      !isSelecting ||
      !selectionStart ||
      !selectionEnd ||
      cellDimensions[selectionStart.day].width === 0
    )
      return { display: "none" };

    const dayIndex = days.indexOf(selectionStart.day);

    // Get start and end time indices
    const startTimeIndex = timeSlots.indexOf(selectionStart.time);
    const endTimeIndex = timeSlots.indexOf(selectionEnd.time);

    // Determine which is earlier (in case user dragged upward)
    const actualStartIndex = Math.min(startTimeIndex, endTimeIndex);
    const actualEndIndex = Math.max(startTimeIndex, endTimeIndex);

    const daysWidth = Object.entries(cellDimensions)
      .filter(([day]) => parseInt(day) < selectionStart.day)
      .reduce((sum, [_, value]) => (sum += value.width), 0);

    const left = timeCellDimensions.width + daysWidth;

    const top =
      timeCellDimensions.height +
      actualStartIndex * cellDimensions[selectionStart.day].height;
    const height =
      (actualEndIndex - actualStartIndex + 1) *
      cellDimensions[selectionStart.day].height;

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${cellDimensions[selectionStart.day].width}px`,
      height: `${height}px`,
    };
  };

  // Handle cell click to create a new block
  const handleCellMouseDown = (
    day: number,
    time: string,
    e?: React.MouseEvent | React.TouchEvent,
  ) => {
    e?.preventDefault(); // Prevent text selection
    if (disabled) return;

    setIsUserInteracting(true);
    setIsSelecting(true);
    setSelectionStart({ day, time });
    setSelectionEnd({ day, time });
  };

  // Add a touch handler for cells
  const handleCellTouchStart = (
    day: number,
    time: string,
    e: React.TouchEvent,
  ) => {
    handleCellMouseDown(day, time, e);
  };

  const handleCellMouseEnter = (day: number, time: string) => {
    if (disabled) return;
    if (!isSelecting || !selectionStart) return;

    // We only allow selection within the same day
    if (day !== selectionStart.day) return;

    setSelectionEnd({ day, time });
  };

  const handleCellMouseUp = () => {
    if (disabled) return;

    if (isSelecting && selectionStart && selectionEnd) {
      // Get start and end time indices
      const startTimeIndex = timeSlots.indexOf(selectionStart.time);
      const endTimeIndex = timeSlots.indexOf(selectionEnd.time);

      // Determine which is earlier (in case user dragged upward)
      const actualStartIndex = Math.min(startTimeIndex, endTimeIndex);
      const actualEndIndex = Math.max(startTimeIndex, endTimeIndex);

      // Get the next time slot for the end time (to make it exclusive)
      const nextTimeSlotIndex = Math.min(
        actualEndIndex + 1,
        timeSlots.length - 1,
      );

      // Create a new block with the selected range
      const newBlock: Block = {
        id: generateId(),
        day: selectionStart.day,
        startTime: timeSlots[actualStartIndex],
        endTime: timeSlots[nextTimeSlotIndex],
      };

      // Set flag to prevent circular updates
      isUpdatingRef.current = true;

      // Add the new block and merge if needed
      const updatedBlocks = mergeBlocks([...blocks, newBlock]);
      setBlocks(updatedBlocks);
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);

    // Set a timeout to reset the user interaction flag
    setTimeout(() => {
      setIsUserInteracting(false);
    }, 100);
  };

  // Handle mouse down on block resize handles
  const handleBlockResizeStart = (
    e: React.MouseEvent | React.TouchEvent,
    block: Block,
    type: "resize-start" | "resize-end",
  ) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    if (disabled) return;

    setIsUserInteracting(true);
    setActiveBlockId(block.id);

    setDragState({
      type,
      blockId: block.id,
      day: block.day,
      startTime: type === "resize-start" ? block.startTime : block.endTime,
      initialY:
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY,
    });
  };

  // Handle mouse down for moving a block
  const handleBlockMoveStart = (
    e: React.MouseEvent | React.TouchEvent,
    block: Block,
  ) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection

    if (disabled) return;

    setIsUserInteracting(true);
    setActiveBlockId(block.id);

    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    // Get the position of the block
    const blockElement = (e.target as HTMLElement).closest(".shift-block");
    if (!blockElement) return;

    const rect = blockElement.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    setDragState({
      type: "move",
      blockId: block.id,
      day: block.day,
      startTime: block.startTime,
      initialX: clientX,
      initialY: clientY,
      offsetX,
      offsetY,
    });
  };

  // Handle mouse/touch move for resizing and moving
  const handleMouseMove = (e: React.MouseEvent | TouchEvent) => {
    if (
      !dragState ||
      !gridRef.current ||
      cellDimensions[dragState.day].height === 0 ||
      disabled
    )
      return;

    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const gridRect = gridRef.current.getBoundingClientRect();

    if (dragState.type === "resize-start" || dragState.type === "resize-end") {
      // Get grid position
      const relativeY = clientY - gridRect.top;

      // Calculate time index from position
      const timeIndex = Math.floor(
        (relativeY - timeCellDimensions.height) /
          cellDimensions[dragState.day].height,
      );
      const boundedTimeIndex = Math.max(
        0,
        Math.min(timeIndex, timeSlots.length - 1),
      );
      const newTime = timeSlots[boundedTimeIndex];

      // Update the block based on the resize
      const blockIndex = blocks.findIndex((b) => b.id === dragState.blockId);

      if (blockIndex !== -1) {
        const block = blocks[blockIndex];
        const newBlocks = [...blocks];

        if (dragState.type === "resize-start") {
          // Ensure start time is before end time
          if (timeToMinutes(newTime) < timeToMinutes(block.endTime)) {
            newBlocks[blockIndex] = {
              ...block,
              startTime: newTime,
            };

            // Set flag to prevent circular updates
            isUpdatingRef.current = true;

            // Merge blocks if needed
            setBlocks(mergeBlocks(newBlocks));
          }
        } else {
          // resize-end
          // Ensure end time is after start time
          if (timeToMinutes(newTime) > timeToMinutes(block.startTime)) {
            newBlocks[blockIndex] = {
              ...block,
              endTime: newTime,
            };

            // Set flag to prevent circular updates
            isUpdatingRef.current = true;

            // Merge blocks if needed
            setBlocks(mergeBlocks(newBlocks));
          }
        }
      }
    } else if (dragState.type === "move") {
      // Handle moving the block
      const blockIndex = blocks.findIndex((b) => b.id === dragState.blockId);

      if (blockIndex !== -1) {
        const block = blocks[blockIndex];

        // Calculate the new position (only vertical movement, keep same day)
        const relativeY = clientY - gridRect.top - (dragState.offsetY || 0);

        // Calculate time from position
        const timeIndex = Math.floor(
          (relativeY - timeCellDimensions.height) /
            cellDimensions[dragState.day].height,
        );
        const boundedTimeIndex = Math.max(
          0,
          Math.min(timeIndex, timeSlots.length - 1),
        );
        const newStartTime = timeSlots[boundedTimeIndex];

        // Calculate the duration of the block
        const duration =
          timeToMinutes(block.endTime) - timeToMinutes(block.startTime);

        // Calculate the new end time
        const newEndTimeMinutes = timeToMinutes(newStartTime) + duration;
        const newEndTime =
          newEndTimeMinutes >= 24 * 60
            ? "24:00"
            : minutesToTime(newEndTimeMinutes);

        // Only update if the position has changed and the block fits within the day
        if (
          newStartTime !== block.startTime &&
          timeToMinutes(newEndTime) <= 24 * 60
        ) {
          const newBlocks = [...blocks];
          newBlocks[blockIndex] = {
            ...block,
            startTime: newStartTime,
            endTime: newEndTime,
          };

          // Set flag to prevent circular updates
          isUpdatingRef.current = true;

          // Merge blocks if needed
          setBlocks(mergeBlocks(newBlocks));
        }
      }
    }
  };

  // Handle mouse up for resizing and moving
  const handleMouseUp = () => {
    if (dragState) {
      setDragState(null);
      setActiveBlockId(null);

      // Set a timeout to reset the user interaction flag
      setTimeout(() => {
        setIsUserInteracting(false);
      }, 100);
    }
  };

  // Handle deleting a block
  const handleDeleteBlock = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (disabled) return;

    // Set flag to prevent circular updates
    isUpdatingRef.current = true;

    setBlocks(blocks.filter((block) => block.id !== blockId));
  };

  // Check if time slot is at the start of an hour (for styling)
  const isHourStart = (time: string) => {
    return time.endsWith(":00");
  };

  // Add event listener to handle mouse/touch up outside the grid
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        handleCellMouseUp();
      }
      if (dragState) {
        handleMouseUp();
      }
    };

    const handleGlobalTouchEnd = () => {
      handleGlobalMouseUp();
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (dragState) {
        e.preventDefault(); // Prevent scrolling when dragging
        handleMouseMove(e);
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("mousemove", handleMouseMove as any);
    window.addEventListener("touchend", handleGlobalTouchEnd);
    window.addEventListener("touchcancel", handleGlobalTouchEnd);
    window.addEventListener("touchmove", handleGlobalTouchMove, {
      passive: false,
    });

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("mousemove", handleMouseMove as any);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
      window.removeEventListener("touchcancel", handleGlobalTouchEnd);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
    };
  }, [
    isSelecting,
    dragState,
    blocks,
    timeSlots,
    handleMouseMove,
    handleCellMouseUp,
    handleMouseUp,
  ]);

  return (
    <div className="grid space-y-6 select-none touch-none w-full">
      <div
        className="border rounded-lg overflow-auto max-h-[80vh] relative w-full"
        ref={containerRef}
      >
        <div
          className={cn(
            "grid min-w-[800px]",
            gridColsClasses[days.length as keyof typeof gridColsClasses],
          )}
          ref={gridRef}
        >
          {/* Header row */}
          <div className="time-cell bg-muted text-center p-2 font-medium border-b border-r sticky top-0 left-0 z-[13] select-none">
            Time
          </div>
          {days.map((day, index) => (
            <div
              key={day}
              className={cn(
                "bg-muted p-2 text-center font-medium border-b",
                index < days.length - 1 && "border-r",
                "sticky top-0 z-[11] select-none",
              )}
            >
              {weekDate
                ? DateTime.fromJSDate(weekDate)
                    .startOf("week")
                    .plus({ days: day - 1 })
                    .toFormat("EEE, MMM d")
                : weekDayMap[day]}
            </div>
          ))}

          {/* Time slots and cells */}
          {timeSlots.map((time, timeIndex) => (
            <React.Fragment key={time}>
              <div
                data-time-index={timeIndex}
                className={cn(
                  "p-1 flex justify-center items-center border-b border-r font-mono text-xs leading-none sticky z-[12] left-0 bg-background select-none",
                  isHourStart(time) && "border-t-2 border-t-gray-300 pt-2",
                )}
              >
                {formatTimeWithLocale(
                  time,
                  t("timePicker.am"),
                  t("timePicker.pm"),
                )}
              </div>
              {days.map((day, dayIndex) => (
                <div
                  key={`${day}-${time}`}
                  className={cn(
                    "p-0.5 border-b",
                    dayIndex < days.length - 1 && "border-r",
                    "h-7",
                    isHourStart(time) && "border-t-2 border-t-gray-300",
                    "grid-cell",
                    `grid-cell-day-${day}`,
                    !dragState && "hover:bg-primary/20",
                    disabled
                      ? "cursor-not-allowed"
                      : isSelecting
                        ? "cursor-cell"
                        : "cursor-pointer",
                  )}
                  onMouseDown={(e) => handleCellMouseDown(day, time, e)}
                  onTouchStart={(e) => handleCellTouchStart(day, time, e)}
                  onMouseEnter={() => handleCellMouseEnter(day, time)}
                  onMouseUp={handleCellMouseUp}
                  onTouchEnd={handleCellMouseUp}
                >
                  {/* We don't render individual cell selections anymore */}
                </div>
              ))}
            </React.Fragment>
          ))}

          {/* Render blocks as absolute positioned elements */}
          {Object.keys(cellDimensions).length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Selection preview */}
              {isSelecting && selectionStart && selectionEnd && (
                <div
                  className="absolute rounded border border-dashed border-primary bg-primary/10 z-10 transition-colors duration-150"
                  style={getSelectionPreviewStyle()}
                />
              )}

              {/* Existing blocks */}
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className={cn(
                    "shift-block absolute rounded border pointer-events-auto transition-colors duration-150",
                    activeBlockId === block.id
                      ? "bg-primary/60 border-primary shadow-lg z-20"
                      : "bg-primary/40 border-primary/30 hover:bg-primary/50",
                  )}
                  style={getBlockStyle(block)}
                >
                  {/* Top resize handle */}
                  <div
                    className={cn(
                      "absolute top-0 left-0 w-full h-2 bg-primary/10 hover:bg-primary/20 z-10",
                      disabled ? "cursor-not-allowed" : "cursor-ns-resize",
                    )}
                    onMouseDown={(e) =>
                      handleBlockResizeStart(e, block, "resize-start")
                    }
                    onTouchStart={(e) =>
                      handleBlockResizeStart(e, block, "resize-start")
                    }
                  >
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
                      <GripHorizontal className="h-3 w-3 text-primary/70" />
                    </div>
                  </div>

                  {/* Time display and delete button */}
                  <div
                    className={cn(
                      "absolute inset-2 flex items-center justify-between px-2",
                      disabled ? "cursor-not-allowed" : "cursor-move",
                    )}
                    onMouseDown={(e) => handleBlockMoveStart(e, block)}
                    onTouchStart={(e) => handleBlockMoveStart(e, block)}
                  >
                    <div className="text-xs font-medium select-none">
                      <span>
                        {formatTimeWithLocale(
                          block.startTime,
                          t("timePicker.am"),
                          t("timePicker.pm"),
                        )}
                      </span>
                      <span> - </span>
                      <span>
                        {formatTimeWithLocale(
                          block.endTime,
                          t("timePicker.am"),
                          t("timePicker.pm"),
                        )}
                      </span>
                    </div>
                    <button
                      disabled={disabled}
                      className="h-5 w-5 rounded-full bg-white text-primary flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors"
                      onClick={(e) => handleDeleteBlock(e, block.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Bottom resize handle */}
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 w-full h-2 bg-primary/10 hover:bg-primary/20 z-10",
                      disabled ? "cursor-not-allowed" : "cursor-ns-resize",
                    )}
                    onMouseDown={(e) =>
                      handleBlockResizeStart(e, block, "resize-end")
                    }
                    onTouchStart={(e) =>
                      handleBlockResizeStart(e, block, "resize-end")
                    }
                  >
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                      <GripHorizontal className="h-3 w-3 text-primary/70" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
