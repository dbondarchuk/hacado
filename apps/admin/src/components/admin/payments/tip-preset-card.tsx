import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AllKeys, useI18n, ValidationKeys } from "@hacado/i18n/client";
import {
  Button,
  cn,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
} from "@hacado/ui";
import { cva } from "class-variance-authority";
import { GripVertical, Trash } from "lucide-react";

export type TipPresetCardProps = {
  id: string;
  value: number | undefined;
  disabled?: boolean;
  percentageLabel: string;
  moveLabel: string;
  removeLabel: string;
  errorMessage?: string;
  onChange: (value: number | undefined) => void;
  onBlur: () => void;
  remove: () => void;
};

export const TipPresetCard: React.FC<TipPresetCardProps> = ({
  id,
  value,
  disabled,
  percentageLabel,
  moveLabel,
  removeLabel,
  errorMessage,
  onChange,
  onBlur,
  remove,
}) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: "TipPreset",
    },
    attributes: {
      roleDescription: "TipPreset",
    },
  });

  const tValidation = useI18n("validation");
  const t = useI18n();

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva("", {
    variants: {
      dragging: {
        over: "ring-2 opacity-30",
        overlay: "ring-2 ring-primary",
      },
    },
  });

  const errorMessageTranslated =
    typeof errorMessage === "string"
      ? tValidation.has(errorMessage as ValidationKeys)
        ? tValidation(errorMessage as ValidationKeys)
        : t.has(errorMessage as AllKeys)
          ? t(errorMessage as AllKeys)
          : errorMessage
      : errorMessage;

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-2 px-2 py-2 bg-background rounded",
        variants({
          dragging: isDragging ? "over" : undefined,
        }),
      )}
      ref={setNodeRef}
      style={style}
    >
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        {...attributes}
        {...listeners}
        className="h-auto cursor-grab p-1 text-secondary-foreground/50"
        aria-label={moveLabel}
      >
        <GripVertical className="size-4" />
      </Button>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <InputGroup>
          <InputGroupInput>
            <Input
              type="number"
              min={1}
              max={100}
              disabled={disabled}
              className={InputGroupInputClasses()}
              value={value ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                onChange(raw === "" ? undefined : Number(raw));
              }}
              onBlur={onBlur}
            />
          </InputGroupInput>
          <InputGroupAddon className={InputGroupAddonClasses()}>
            {percentageLabel}
          </InputGroupAddon>
        </InputGroup>
        {errorMessageTranslated ? (
          <p className="text-sm font-medium text-destructive">
            {errorMessageTranslated}
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost-destructive"
        size="icon"
        disabled={disabled}
        aria-label={removeLabel}
        onClick={remove}
      >
        <Trash className="size-4" />
      </Button>
    </div>
  );
};
