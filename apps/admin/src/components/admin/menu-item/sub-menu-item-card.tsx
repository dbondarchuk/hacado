import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@hacado/i18n/client";
import { SubMenuItem } from "@hacado/types";
import { Button, Card, CardContent, CardHeader, cn } from "@hacado/ui";
import { cva } from "class-variance-authority";
import { GripVertical, Trash } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { MenuItemFields } from "./menu-item-fields";

export type SubMenuItemWithId = SubMenuItem & {
  id: string;
};

export type SubMenuItemProps = {
  item: SubMenuItemWithId;
  name: string;
  form: UseFormReturn<any>;
  disabled?: boolean;
  isOverlay?: boolean;
  remove: () => void;
};

export type SubMenuItemDragType = "SubMenuItem";

export interface SubMenuItemDragData {
  type: SubMenuItemDragType;
  item: SubMenuItemWithId;
}

export function SubMenuItemCard({
  item,
  form,
  name,
  disabled,
  isOverlay,
  remove,
}: SubMenuItemProps) {
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
      type: "SubMenuItem",
      item,
    } satisfies SubMenuItemDragData,
    attributes: {
      roleDescription: "Sub Menu item",
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

  const label = form.getValues(`${name}.label`);
  const { invalid, error } = form.getFieldState(`${name}.label`);

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
            variant={"ghost"}
            {...attributes}
            {...listeners}
            className="-ml-2 h-auto cursor-grab p-1 text-secondary-foreground/50"
          >
            <span className="sr-only">
              {t("menuItem.subMenu.moveMenuItem")}
            </span>
            <GripVertical />
          </Button>
          <span
            className={cn(
              "text-sm font-semibold uppercase tracking-wide text-muted-foreground",
              !label || invalid ? "text-destructive" : "",
            )}
          >
            {error?.message || label || t("menuItem.subMenu.invalid")}
          </span>
        </div>
        <Button
          disabled={disabled}
          variant="ghost-destructive"
          onClick={remove}
          size="icon"
          type="button"
        >
          <Trash />
        </Button>
      </CardHeader>
      <CardContent className="px-3 pb-6 pt-3 text-left relative flex flex-col gap-4">
        <MenuItemFields
          type="link"
          form={form}
          name={name}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
