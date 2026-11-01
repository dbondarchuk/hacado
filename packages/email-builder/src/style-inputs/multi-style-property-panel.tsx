import React from "react";

import { TStyle } from "./helpers/TStyle";

import { SingleStylePropertyPanel } from "./single-style-property-panel";

type MultiStylePropertyPanelProps = {
  names: (keyof TStyle)[];
  value: TStyle | undefined | null;
  onChange: (style: TStyle) => void;
};

export const MultiStylePropertyPanel: React.FC<
  MultiStylePropertyPanelProps
> = ({ names, value, onChange }) => {
  return (
    <>
      {names.map((name) => (
        <SingleStylePropertyPanel
          key={name}
          name={name}
          value={value || {}}
          onChange={onChange}
        />
      ))}
    </>
  );
};
