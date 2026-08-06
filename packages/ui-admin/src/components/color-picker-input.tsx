"use client";

import {
  Button,
  cn,
  Input,
  InputGroup,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  InputProps,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hacado/ui";
import { Sketch, SketchProps } from "@uiw/react-color";
import { Palette } from "lucide-react";
import React from "react";

export type ColorPickerInputProps = Omit<
  InputProps,
  "value" | "onChange" | "onBlur"
> & {
  enableAlpha?: boolean;
  value?: string;
  onChange?: (value?: string) => void;
  onBlur?: () => void;
};

export const ColorPickerInput: React.FC<ColorPickerInputProps> = ({
  value,
  onChange,
  disabled,
  enableAlpha,
  ...props
}) => {
  const onColorChange: SketchProps["onChange"] = (color) => {
    const newValue =
      (color.rgba.a ?? 1) === 1
        ? color.hex
        : `rgba(${color.rgba.r}, ${color.rgba.g}, ${color.rgba.b}, ${color.rgba.a})`;

    onChange?.(newValue);
  };

  return (
    <InputGroup>
      <div
        className={cn(
          InputGroupAddonClasses({ variant: "prefix" }),
          "size-9",
          "transition-colors",
        )}
        style={{ backgroundColor: value }}
      ></div>
      <InputGroupInput>
        <Input
          disabled={disabled}
          className={cn(
            InputGroupInputClasses({ variant: "prefix" }),
            InputGroupInputClasses({ variant: "suffix" }),
          )}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        />
      </InputGroupInput>
      <Popover onOpenChange={(open) => !open && props.onBlur?.()}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            className={InputGroupAddonClasses()}
          >
            <Palette size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="bg-transparent border-none shadow-none w-fit">
          <Sketch
            color={value}
            onChange={onColorChange}
            disableAlpha={!enableAlpha}
          />
        </PopoverContent>
      </Popover>
    </InputGroup>
  );
};
