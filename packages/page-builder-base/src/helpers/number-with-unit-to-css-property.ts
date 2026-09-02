import { NumberValueWithUnitOrUnitless } from "../style/zod";

export const numberWithUnitToCssProperty = (
  value?: NumberValueWithUnitOrUnitless | null,
) => {
  if (!value) return undefined;
  return `${value.value}${value.unit}`;
};
