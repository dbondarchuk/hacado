import { RadioButtonGroupItem } from "@hacado/ui";
import React from "react";

export type RadioGroupInputItemProps = {
  value: string;
  children: React.ReactNode | React.ReactNode[];
  size?: React.ComponentProps<typeof RadioButtonGroupItem>["size"];
};

export const RadioGroupInputItem: React.FC<RadioGroupInputItemProps> = ({
  value,
  children,
  size = "sm",
}) => {
  const id = React.useId();
  return (
    <div className="inline-flex items-center space-x-2" key={value}>
      <RadioButtonGroupItem value={value} id={value} size={size}>
        {children}
      </RadioButtonGroupItem>
    </div>
  );
};
