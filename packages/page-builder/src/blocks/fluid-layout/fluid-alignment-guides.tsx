"use client";

import type { FluidAlignmentGuide } from "./alignment-guides";

type FluidAlignmentGuidesProps = {
  guides: FluidAlignmentGuide[];
  cellSize: number;
  gap: number;
  gridRowCount: number;
};

export function FluidAlignmentGuides({
  guides,
  cellSize,
  gap,
  gridRowCount,
}: FluidAlignmentGuidesProps) {
  if (!guides.length) return null;

  const cellW = cellSize + gap;
  const cellH = cellSize + gap;
  const height = gridRowCount * cellH - gap;

  return (
    <>
      {guides.map((guide, index) => {
        const isColumn = guide.type === "column";
        const offset = (guide.position - 1) * (isColumn ? cellW : cellH);

        return (
          <div
            key={`${guide.type}-${guide.position}-${index}`}
            className="pointer-events-none absolute z-[9999]"
            style={
              isColumn
                ? {
                    left: offset,
                    top: 0,
                    width: 1,
                    height,
                    backgroundColor: "#ff00ff",
                    boxShadow: "0 0 2px rgba(255, 0, 255, 0.5)",
                  }
                : {
                    left: 0,
                    top: offset,
                    width: "100%",
                    height: 1,
                    backgroundColor: "#ff00ff",
                    boxShadow: "0 0 2px rgba(255, 0, 255, 0.5)",
                  }
            }
          >
            {guide.label ? (
              <span className="absolute left-1 top-1 rounded bg-[#ff00ff] px-1 text-xs text-white">
                {guide.label}
              </span>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
