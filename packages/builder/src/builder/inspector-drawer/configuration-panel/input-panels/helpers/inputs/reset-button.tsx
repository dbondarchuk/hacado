import { Button, ButtonProps } from "@hacado/ui";
import { X } from "lucide-react";

export const ResetButton: React.FC<{
  onClick: (value: null) => void;
  size?: ButtonProps["size"];
}> = ({ onClick, size = "icon" }) => {
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => {
        onClick(null);
      }}
    >
      <X />
    </Button>
  );
};
