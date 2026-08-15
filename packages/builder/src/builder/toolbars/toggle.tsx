import { Leaves } from "@hacado/types";
import { Toggle, useOpenState } from "@hacado/ui";
import { destructAndReplace, resolveProperty } from "@hacado/utils";
import { ReactNode } from "react";
import { ConfigurationProps } from "../../documents/types";

export type ToolbarToggleProps<T> = ConfigurationProps<T> & {
  property: Leaves<T>;
  tooltip: string;
  icon: ReactNode;
};

export const ToolbarToggle = <T,>({
  data,
  setData,
  property,
  tooltip,
  icon: Icon,
}: ToolbarToggleProps<T>) => {
  const openState = useOpenState();
  const propValue = resolveProperty(data, property);

  return (
    <Toggle
      tooltip={tooltip}
      className="[&>svg]:size-4"
      pressed={!!propValue}
      onPressedChange={(value: boolean) => {
        setData(destructAndReplace(data, property, value) as unknown as any);
      }}
    >
      {Icon}
    </Toggle>
  );
};
