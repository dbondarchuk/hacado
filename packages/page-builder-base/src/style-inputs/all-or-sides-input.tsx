"use client";

import { BuilderKeys, useI18n } from "@hacado/i18n/client";
import { Button } from "@hacado/ui";
import { Link2, Unlink2 } from "lucide-react";
import React from "react";
import {
  AllOrPerCorner,
  AllOrPerSide,
  collapseCornersToAll,
  collapseSidesToAll,
  expandAllToCorners,
  expandAllToSides,
  isPerCornerValue,
  isPerSideValue,
  PerCornerKey,
  PerSideKey,
} from "../style/zod";

const visualSideKeys = [
  "top",
  "bottom",
  "left",
  "right",
] as const satisfies readonly PerSideKey[];

const visualCornerKeys = [
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight",
] as const satisfies readonly PerCornerKey[];

type RenderInputProps<T, S extends PerSideKey | PerCornerKey> = {
  value: T | null | undefined;
  onChange: (value: T | null) => void;
  side: S | "all";
  nullable: boolean;
};

type BaseProps<T> = {
  defaultAllValue: T;
};

type AllOrSidesInputProps<T> = BaseProps<T> &
  (
    | {
        layout: "sides";
        value: AllOrPerSide<T> | null | undefined;
        onChange: (value: AllOrPerSide<T>) => void;
        renderInput: (
          props: RenderInputProps<T, PerSideKey>,
        ) => React.ReactNode;
      }
    | {
        layout: "corners";
        value: AllOrPerCorner<T> | null | undefined;
        onChange: (value: AllOrPerCorner<T>) => void;
        renderInput: (
          props: RenderInputProps<T, PerCornerKey>,
        ) => React.ReactNode;
      }
  );

export const AllOrSidesInput = <T,>(props: AllOrSidesInputProps<T>) => {
  const t = useI18n("builder");
  const isIndividual =
    props.layout === "sides"
      ? isPerSideValue(props.value)
      : isPerCornerValue(props.value);

  const switchToAll = () => {
    if (!isIndividual) return;
    if (props.layout === "sides" && isPerSideValue(props.value)) {
      props.onChange(collapseSidesToAll(props.value, props.defaultAllValue));
      return;
    }
    if (props.layout === "corners" && isPerCornerValue(props.value)) {
      props.onChange(collapseCornersToAll(props.value, props.defaultAllValue));
    }
  };

  const switchToIndividual = () => {
    if (isIndividual) return;
    const allValue =
      (props.value as T | null | undefined) ?? props.defaultAllValue;
    if (props.layout === "sides") {
      props.onChange(expandAllToSides(allValue));
      return;
    }
    props.onChange(expandAllToCorners(allValue));
  };

  const handleAllChange = (next: T | null) => {
    if (next == null) return;
    props.onChange(next);
  };

  const allInput = props.renderInput({
    value: (props.value as T | null | undefined) ?? props.defaultAllValue,
    onChange: handleAllChange,
    nullable: false,
    side: "all",
  });

  const sidesValue =
    props.layout === "sides" && isPerSideValue(props.value)
      ? props.value
      : null;
  const cornersValue =
    props.layout === "corners" && isPerCornerValue(props.value)
      ? props.value
      : null;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="grid grid-cols-2 gap-1">
        <Button
          type="button"
          size="xs"
          variant={isIndividual ? "outline" : "secondary"}
          className="h-7 px-2 w-full"
          onClick={switchToAll}
          aria-pressed={!isIndividual}
        >
          <Link2 />
          {t("pageBuilder.styles.allSides" as BuilderKeys)}
        </Button>
        <Button
          type="button"
          size="xs"
          variant={isIndividual ? "secondary" : "outline"}
          className="h-7 px-2 w-full"
          onClick={switchToIndividual}
          aria-pressed={isIndividual}
        >
          <Unlink2 />
          {t("pageBuilder.styles.individualSides" as BuilderKeys)}
        </Button>
      </div>

      {!isIndividual ? (
        allInput
      ) : sidesValue && props.layout === "sides" ? (
        <div className="flex flex-col gap-2 w-full">
          {visualSideKeys.map((slot) => (
            <SlotField
              key={slot}
              label={t(`pageBuilder.styles.sides.${slot}` as BuilderKeys)}
            >
              {props.renderInput({
                value: sidesValue[slot],
                nullable: true,
                side: slot,
                onChange: (next) =>
                  props.onChange({
                    ...sidesValue,
                    [slot]: next,
                  }),
              })}
            </SlotField>
          ))}
        </div>
      ) : cornersValue && props.layout === "corners" ? (
        <div className="grid grid-cols-1 gap-2 w-full">
          {visualCornerKeys.map((slot) => (
            <SlotField
              key={slot}
              label={t(`pageBuilder.styles.corners.${slot}` as BuilderKeys)}
            >
              {props.renderInput({
                value: cornersValue[slot],
                nullable: true,
                side: slot,
                onChange: (next) =>
                  props.onChange({
                    ...cornersValue,
                    [slot]: next,
                  }),
              })}
            </SlotField>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const SlotField: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    {children}
  </div>
);
