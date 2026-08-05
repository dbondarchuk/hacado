import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@hacado/ui";
import { GripVertical } from "lucide-react";
import { memo, Ref, RefCallback } from "react";

export const DragHandle = memo(
  ({ handleRef }: { handleRef: RefCallback<Element> }) => {
    const t = useI18n();

    return (
      <div className="absolute top-0 -translate-x-full pointer-events-auto z-50 rounded-2xl px-1 py-2 bg-transparent">
        <div className="flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                ref={handleRef as Ref<HTMLButtonElement>}
                className={cn("text-secondary-foreground cursor-grab")}
              >
                <GripVertical fontSize="small" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{t("ui.common.move")}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  },
);
