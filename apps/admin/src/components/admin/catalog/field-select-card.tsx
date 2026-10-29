import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@hacado/i18n/client";
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
  Card,
  CardContent,
  CardHeader,
  cn,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabelWithRequiredIndicator,
  FormMessage,
} from "@hacado/ui";
import { FieldSelector, SwitchCardFormItem } from "@hacado/ui-admin";
import { cva } from "class-variance-authority";
import { GripVertical, Trash } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

export type FieldSelectProps = {
  item: {
    id: string;
    fields_id: string;
  };
  excludeIds?: string[];
  name: string;
  type: "option" | "addon";
  form: UseFormReturn<any>;
  disabled?: boolean;
  isOverlay?: boolean;
  remove: () => void;
};

export type FieldSelectType = "AddonSelect";

export interface FieldSelectDragData {
  type: FieldSelectType;
  item: {
    fields_id: string;
  };
}

export const FieldSelectCard: React.FC<FieldSelectProps> = ({
  item,
  excludeIds,
  form,
  name,
  type,
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
    id: item.fields_id,
    data: {
      type: "AddonSelect",
      item,
    } satisfies FieldSelectDragData,
    attributes: {
      roleDescription: "Field",
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
    <Card
      className={cn(
        variants({
          dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
        }),
      )}
      ref={setNodeRef}
      style={style}
    >
      <CardHeader className="justify-between relative flex flex-row border-b px-3 py-3 w-full items-center">
        <div className="flex flex-row items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            {...attributes}
            {...listeners}
            className="h-auto cursor-grab p-1 text-secondary-foreground/50"
          >
            <></>
            <span className="sr-only">
              {t("services.fieldSelectCard.moveField", { type })}
            </span>
            <GripVertical />
          </Button>
          <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("services.fieldSelectCard.field")}
          </span>
        </div>
        <div className="flex flex-row items-start">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={disabled}
                variant="ghost-destructive"
                size="icon"
                type="button"
              >
                <Trash />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("services.fieldSelectCard.deleteConfirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("services.fieldSelectCard.deleteConfirmDescription", {
                    type,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("services.fieldSelectCard.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction asChild variant="destructive">
                  <Button onClick={remove}>
                    {t("services.fieldSelectCard.delete")}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex w-full min-w-0 flex-col gap-4 py-6">
        <FormField
          control={form.control}
          name={`${name}.id`}
          render={({ field }) => (
            <FormItem className="min-w-0 w-full">
              <FormLabelWithRequiredIndicator required>
                {t("services.fieldSelectCard.field")}
              </FormLabelWithRequiredIndicator>
              <FormControl>
                <FieldSelector
                  disabled={disabled}
                  excludeIds={excludeIds}
                  className="flex w-full font-normal text-lg"
                  value={field.value}
                  onItemSelect={field.onChange}
                />
              </FormControl>
              <FormDescription>
                {t("services.fieldSelectCard.fieldDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${name}.required`}
          render={({ field }) => (
            <SwitchCardFormItem
              label={t("services.fieldSelectCard.required")}
              description={t("services.fieldSelectCard.requiredTooltip")}
              checked={!!field.value}
              disabled={disabled}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                field.onBlur();
              }}
            />
          )}
        />
      </CardContent>
    </Card>
  );
};
