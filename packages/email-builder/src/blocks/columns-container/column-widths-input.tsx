import { TextDimensionInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { useState } from "react";

export const DEFAULT_2_COLUMNS = [6] as [number];
export const DEFAULT_3_COLUMNS = [4, 8] as [number, number];

type TWidthValue = number | null | undefined;
type FixedWidths = [
  //
  number | null | undefined,
  number | null | undefined,
  number | null | undefined,
];
type ColumnsLayoutInputProps = {
  defaultValue: FixedWidths | null | undefined;
  columnsCount?: number;
  onChange: (v: FixedWidths | null | undefined) => void;
};

export const ColumnWidthsInput = ({
  defaultValue,
  columnsCount = 3,
  onChange,
}: ColumnsLayoutInputProps) => {
  const t = useI18n("builder");
  const [currentValue, setCurrentValue] = useState<
    [TWidthValue, TWidthValue, TWidthValue]
  >(() => {
    if (defaultValue) {
      return defaultValue;
    }
    return [null, null, null];
  });

  const setIndexValue = (
    index: 0 | 1 | 2,
    value: number | null | undefined,
  ) => {
    const nValue: FixedWidths = [...currentValue];
    nValue[index] = value;
    setCurrentValue(nValue);
    onChange(nValue);
  };

  let column3 = null;
  if (columnsCount === 3) {
    column3 = (
      <TextDimensionInput
        label={t("emailBuilder.blocks.columnsContainer.column3")}
        nullable
        defaultValue={currentValue?.[2] ?? null}
        onChange={(v) => {
          setIndexValue(2, v);
        }}
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <TextDimensionInput
        label={t("emailBuilder.blocks.columnsContainer.column1")}
        nullable
        defaultValue={currentValue?.[0] ?? null}
        onChange={(v) => {
          setIndexValue(0, v);
        }}
      />
      <TextDimensionInput
        label={t("emailBuilder.blocks.columnsContainer.column2")}
        nullable
        defaultValue={currentValue?.[1] ?? null}
        onChange={(v) => {
          setIndexValue(1, v);
        }}
      />
      {column3}
    </div>
  );
};
