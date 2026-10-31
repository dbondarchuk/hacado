import { Leaves } from "@hacado/types/utils";
import { useOpenState } from "@hacado/ui/dropdown-menu";
import { Toggle } from "@hacado/ui/toggle";
import { destructAndReplace, resolveProperty } from "@hacado/utils/object";
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
