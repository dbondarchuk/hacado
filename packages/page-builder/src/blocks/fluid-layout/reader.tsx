import { ReaderBlock } from "@hacado/builder";
import {
  BackgroundVideoLayer,
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { placementToChildCss, resolveEffectivePlacements } from "./responsive";
import {
  FLUID_COLUMNS,
  FLUID_MOBILE_COLUMNS,
  FLUID_MOBILE_MAX_WIDTH,
  FLUID_TABLET_COLUMNS,
  FLUID_TABLET_MAX_WIDTH,
  FluidLayoutReaderProps,
  styles,
} from "./schema";
import { getGridRowCount, placementsForChildIds } from "./utils";

function squareRowCss(columns: number, gap: number): string {
  return `calc((100cqw - ${(columns - 1) * gap}px) / ${columns})`;
}

export const FluidLayoutReader = ({
  style,
  props,
  block,
  ...rest
}: FluidLayoutReaderProps) => {
  const children = props?.children ?? [];
  const basePlacements = props?.placements ?? {};
  const placementOverrides = props?.placementOverrides ?? {};
  const childIds = children.map((child) => child.id);
  const gap = props?.gap ?? 8;

  const desktopPlacements = resolveEffectivePlacements({
    childIds,
    base: basePlacements,
    overrides: placementOverrides,
    tier: "desktop",
  });
  const tabletPlacements = resolveEffectivePlacements({
    childIds,
    base: basePlacements,
    overrides: placementOverrides,
    tier: "tablet",
  });
  const mobilePlacements = resolveEffectivePlacements({
    childIds,
    base: basePlacements,
    overrides: placementOverrides,
    tier: "mobile",
  });
  const landscapePlacements = resolveEffectivePlacements({
    childIds,
    base: basePlacements,
    overrides: placementOverrides,
    tier: "mobileLandscape",
  });

  const desktopRowCount = getGridRowCount(
    placementsForChildIds(childIds, desktopPlacements),
    0,
  );
  const tabletRowCount = getGridRowCount(
    placementsForChildIds(childIds, tabletPlacements),
    0,
  );
  const mobileRowCount = getGridRowCount(
    placementsForChildIds(childIds, mobilePlacements),
    0,
  );

  const className = generateClassName();
  const base = block.base;

  const desktopChildCss = children
    .map((child) => {
      const placement = desktopPlacements[child.id];
      if (!placement) return "";
      return placementToChildCss(
        placement,
        `.${className}.fluid-layout-grid > [data-fluid-child="${child.id}"]`,
      );
    })
    .join("\n");

  const tabletChildCss = children
    .map((child) => {
      const placement = tabletPlacements[child.id];
      if (!placement) return "";
      return placementToChildCss(
        placement,
        `.${className}.fluid-layout-grid > [data-fluid-child="${child.id}"]`,
      );
    })
    .join("\n");

  const mobileChildCss = children
    .map((child) => {
      const placement = mobilePlacements[child.id];
      if (!placement) return "";
      return placementToChildCss(
        placement,
        `.${className}.fluid-layout-grid > [data-fluid-child="${child.id}"]`,
      );
    })
    .join("\n");

  const landscapeChildCss = children
    .filter((child) => placementOverrides.mobileLandscape?.[child.id])
    .map((child) => {
      const placement = landscapePlacements[child.id];
      if (!placement) return "";
      return placementToChildCss(
        placement,
        `.${className}.fluid-layout-grid > [data-fluid-child="${child.id}"]`,
      );
    })
    .join("\n");

  const gridCss = `
.${className}.fluid-layout-grid {
  container-type: inline-size;
  display: grid !important;
  grid-template-columns: repeat(${FLUID_COLUMNS}, minmax(0, 1fr));
  grid-template-rows: repeat(${desktopRowCount}, ${squareRowCss(FLUID_COLUMNS, gap)});
  gap: ${gap}px;
  position: relative;
  box-sizing: border-box;
}
.${className}.fluid-layout-grid > [data-fluid-child] {
  width: auto;
  min-width: 0;
  min-height: 0;
}
.${className}.fluid-layout-grid > [data-fluid-child] > .fluid-child-rotate,
.${className}.fluid-layout-grid > [data-fluid-child] > .fluid-child-rotate > *,
.${className}.fluid-layout-grid > [data-fluid-child] > .fluid-child-rotate > * > * {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  box-sizing: border-box;
}
${desktopChildCss}
@media (max-width: ${FLUID_TABLET_MAX_WIDTH}) {
  .${className}.fluid-layout-grid {
    grid-template-columns: repeat(${FLUID_TABLET_COLUMNS}, minmax(0, 1fr)) !important;
    grid-template-rows: repeat(${tabletRowCount}, ${squareRowCss(FLUID_TABLET_COLUMNS, gap)}) !important;
  }
  ${tabletChildCss}
}
@media (max-width: ${FLUID_MOBILE_MAX_WIDTH}) {
  .${className}.fluid-layout-grid {
    grid-template-columns: repeat(${FLUID_MOBILE_COLUMNS}, minmax(0, 1fr)) !important;
    grid-template-rows: repeat(${mobileRowCount}, ${squareRowCss(FLUID_MOBILE_COLUMNS, gap)}) !important;
  }
  ${mobileChildCss}
  ${landscapeChildCss}
}
`;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <style dangerouslySetInnerHTML={{ __html: gridCss }} />
      <div
        className={cn(className, "fluid-layout-grid", base?.className)}
        id={base?.id}
      >
        <BackgroundVideoLayer style={style} />
        {children.map((child) => (
          <div
            key={child.id}
            data-fluid-child={child.id}
            className="min-h-0 min-w-0"
          >
            <div className="fluid-child-rotate h-full w-full min-h-0 min-w-0">
              <ReaderBlock {...rest} block={child} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
