import React from "react";

import {
  Button,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hacado/ui";
import { Sketch } from "@uiw/react-color";
import { Plus } from "lucide-react";
import { ResetButton } from "./reset-button";

type Props =
  | {
      nullable: true;
      label: string;
      onChange: (value: string | null) => void;
      defaultValue: string | null;
    }
  | {
      nullable?: false;
      label: string;
      onChange: (value: string) => void;
      defaultValue: string;
    };

export const ColorInput: React.FC<Props> = ({
  label,
  defaultValue,
  onChange,
  nullable,
}) => {
  const [value, setValue] = React.useState(defaultValue);
  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, setValue]);

  const renderOpenButton = () => {
    if (value) {
      return (
        <Button
          variant="ghost"
          size="icon"
          className="border border-secondary"
          style={{ background: value }}
        />
      );
    }
    return (
      <Button
        variant="ghost"
        size="icon"
        className="bg-background border border-secondary"
      >
        <Plus size={16} />
      </Button>
    );
  };

  return (
    <div className="items-start">
      <div className="flex flex-col gap-2">
        <Label>{label}</Label>
        <div className="flex w-full">
          <Popover>
            <div className="flex flex-row gap-1">
              <PopoverTrigger asChild>{renderOpenButton()}</PopoverTrigger>
              {nullable && (
                <ResetButton
                  onClick={() => {
                    setValue(null);
                    onChange(null);
                  }}
                />
              )}
            </div>
            <PopoverContent className="bg-transparent border-none shadow-none w-fit">
              <Sketch
                color={value || undefined}
                disableAlpha
                onChange={(c) => {
                  setValue(c.hex);
                  onChange(c.hex);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
