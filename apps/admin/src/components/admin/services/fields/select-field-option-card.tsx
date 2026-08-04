import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@timelish/i18n/client";
import { WithId } from "@timelish/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  cn,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@timelish/ui";
import { cva } from "class-variance-authority";
import { GripVertical, Trash } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

export type SelectFieldOptionProps = {
  item: WithId<{
    option: string;
  }>;
  name: string;
  form: UseFormReturn<any>;
  disabled?: boolean;
  isOverlay?: boolean;
  remove: () => void;
};

export type SelectFieldOptionType = "SelectFieldOption";

export interface SelectFieldOptionDragData {
  type: SelectFieldOptionType;
  item: WithId<{
    option: string;
  }>;
}

export const SelectFieldOptionCard: React.FC<SelectFieldOptionProps> = ({
  item,
  form,
  name,
  disabled,
  isOverlay,
  remove,
}) => {
  const t = useI18n("admin");
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: "SelectFieldOption",
      item,
    } satisfies SelectFieldOptionDragData,
    attributes: {
      roleDescription: "SelectFieldOption",
    },
  });

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

  return (
    <div
      className={cn(
        "flex flex-row gap-2 px-2 py-4 bg-background rounded",
        variants({
          dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
        }),
      )}
      ref={setNodeRef}
      style={style}
    >
      <Button
        type="button"
        variant={"ghost"}
        {...attributes}
        {...listeners}
        className="h-auto cursor-grab p-1 text-secondary-foreground/50"
      >
        <></>
        <span className="sr-only">
          {t("services.fields.selectFieldOptionCard.moveOption")}
        </span>
        <GripVertical />
      </Button>
      <div className="flex flex-col md:flex-row gap-2 flex-grow w-full">
        <FormField
          control={form.control}
          name={`${name}.option`}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>
                {t("services.fields.selectFieldOptionCard.option")}
              </FormLabel>

              <FormControl>
                <Input disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="flex flex-row items-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={disabled}
              variant="ghost-destructive"
              size="icon"
              type="button"
            >
              <Trash size={20} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("services.fields.selectFieldOptionCard.deleteConfirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  "services.fields.selectFieldOptionCard.deleteConfirmDescription",
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("common.buttons.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction asChild variant="destructive">
                <Button onClick={remove}>{t("common.buttons.delete")}</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
