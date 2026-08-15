import { Checkbox, Label } from "@hacado/ui";
import React, { useId } from "react";

type Props = {
  label: string;
  defaultValue: boolean;
  onChange: (value: boolean) => void;
};

export const BooleanInput: React.FC<Props> = ({
  label,
  defaultValue,
  onChange,
}) => {
  const [value, setValue] = React.useState(defaultValue);
  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, setValue]);

  const id = useId();

  return (
    <div className="flex items-center gap-2 flex-1">
      <Checkbox
        id={id}
        checked={value}
        onCheckedChange={(checked) => {
          setValue(checked === true);
          onChange(checked === true);
        }}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
};
