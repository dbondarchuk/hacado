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
  Card,
  CardContent,
  CardHeader,
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
import * as z from "zod";
import { formSchemaBase } from "../../../models";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../../translations/types";

export type SelectFieldOptionProps = {
  item: WithId<{
    option?: string | null;
  }>;
  name: `fields.${number}.data.options.${number}`;
  form: UseFormReturn<z.infer<typeof formSchemaBase>>;
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
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  const tAdmin = useI18n("admin");

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
      item: {
        ...item,
        option: item.option ?? "",
      },
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

  const option = form.getValues(`${name}.option`);

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
            variant={"ghost"}
            disabled={disabled}
            {...attributes}
            {...listeners}
            className="h-auto cursor-grab p-1 text-secondary-foreground/50"
          >
            <span className="sr-only">
              {t("form.fields.select.options.moveOption")}
            </span>
            <GripVertical />
          </Button>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {option || t("form.fields.select.options.option")}
          </span>
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
                  {t("form.fields.select.options.deleteConfirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("form.fields.select.options.deleteConfirmDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {tAdmin("common.buttons.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction asChild variant="destructive">
                  <Button onClick={remove}>
                    {tAdmin("common.buttons.delete")}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="py-6 flex flex-col md:flex-row gap-2 flex-grow w-full">
        <FormField
          control={form.control}
          name={`${name}.option`}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>{t("form.fields.select.options.option")}</FormLabel>

              <FormControl>
                <Input disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
