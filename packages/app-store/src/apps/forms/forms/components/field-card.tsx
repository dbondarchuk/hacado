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
} from "@timelish/ui";
import { cva } from "class-variance-authority";
import { GripVertical, Trash } from "lucide-react";
import { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { formSchemaBase, FormsFieldType } from "../../models";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { FormFieldEditor } from "./field";

export type FormFieldCardProps = {
  form: UseFormReturn<z.infer<typeof formSchemaBase>>;
  name: `fields.${number}`;
  item: WithId<{
    type: FormsFieldType;
  }>;
  disabled?: boolean;
  isOverlay?: boolean;
  remove: () => void;
};

export type FormFieldType = "FormField";

export interface FormFieldDragData {
  type: FormFieldType;
  item: WithId<{
    type: FormsFieldType;
  }>;
}

export const FormFieldCard: FC<FormFieldCardProps> = ({
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
      type: "FormField",
      item,
    } satisfies FormFieldDragData,
    attributes: {
      roleDescription: "FormField",
    },
  });

  const label = form.watch(`${name}.label`);
  const invalid = !label || label === "";

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
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })}
    >
      <CardHeader className="justify-between relative flex flex-row border-b px-3 py-3 w-full items-center">
        <div className="flex flex-row items-center gap-2">
          <Button
            type="button"
            disabled={disabled}
            variant={"ghost"}
            {...attributes}
            {...listeners}
            className="-ml-2 h-auto cursor-grab p-1 text-secondary-foreground/50"
          >
            <span className="sr-only">{t("form.fields.moveField")}</span>
            <GripVertical />
          </Button>
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
              invalid ? "text-destructive" : "",
            )}
          >
            {label || t("form.fields.invalid")}
          </span>
        </div>
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
                {t("form.fields.deleteConfirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("form.fields.deleteConfirmDescription")}
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
      </CardHeader>
      <CardContent className="px-3 pb-6 pt-3 text-left relative flex flex-col gap-4">
        <FormFieldEditor form={form} name={name} disabled={disabled} />
      </CardContent>
    </Card>
  );
};
