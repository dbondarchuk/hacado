import { deepEqual } from "@hacado/utils";
import { ComponentProps, ComponentType, memo } from "react";

export const genericMemo: <T extends ComponentType<any>>(
  component: T,
  propsAreEqual?: (
    prevProps: Readonly<ComponentProps<T>>,
    nextProps: Readonly<ComponentProps<T>>,
  ) => boolean,
) => T = memo;

export function deepMemo<T extends ComponentType<any>>(component: T): T {
  return memo(
    component,
    (
      prevProps: Readonly<ComponentProps<T>>,
      nextProps: Readonly<ComponentProps<T>>,
    ) => deepEqual(prevProps, nextProps),
  ) as unknown as T;
}
