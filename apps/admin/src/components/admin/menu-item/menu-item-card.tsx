import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@hacado/i18n/client";
import { StaticText } from "@hacado/rte-inline/reader";
import {
  MenuItem,
  MenuItemType,
  menuItemTypes,
  MenuItemWithSubMenu,
} from "@hacado/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  cn,
  Combobox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@hacado/ui";
import { cva } from "class-variance-authority";
import { GripVertical, Trash } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { MenuItemFields } from "./menu-item-fields";

export type MenuItemWithId = MenuItem & {
  id: string;
};

export type MenuItemWithSubMenuWithId = MenuItemWithSubMenu & {
  id: string;
};

type BaseMenuItemProps = {
  name: string;
  form: UseFormReturn<any>;
  disabled?: boolean;
  isOverlay?: boolean;
  remove: () => void;
  update: (newValue: MenuItemWithId) => void;
};

export type MenuItemProps = BaseMenuItemProps &
  (
    | {
        item: MenuItemWithId;
        supportsSubmenus?: false;
      }
    | {
        item: MenuItemWithSubMenuWithId;
        supportsSubmenus?: true;
      }
  );

export type MenuItemDragType = "MenuItem";

export interface MenuItemDragData {
  type: MenuItemDragType;
  item: MenuItemWithId | MenuItemWithSubMenu;
}

export function MenuItemCard({
  item,
  form,
  name,
  disabled,
  isOverlay,
  supportsSubmenus,
  remove,
  update,
}: MenuItemProps) {
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
      type: "MenuItem",
      item,
    } satisfies MenuItemDragData,
    attributes: {
      roleDescription: "Menu item",
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

  const itemType = item.type as MenuItemType;
  const itemLabel = form.watch(`${name}.label`);

  const changeType = (value: typeof itemType) => {
    const newValue = {
      ...item,
      type: value,
      variant: undefined,
      size: undefined,
    } as unknown as MenuItemWithId;

    update(newValue);
  };

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
            <span className="sr-only">{t("menuItem.card.moveMenuItem")}</span>
            <GripVertical />
          </Button>
          <span
            className={cn(
              "text-sm font-semibold uppercase tracking-wide text-muted-foreground",
              !itemType ? "text-destructive" : "",
            )}
          >
            {itemLabel ? (
              <StaticText value={itemLabel ?? ""} inline />
            ) : (
              t(`menuItem.labels.${itemType}`) || t("menuItem.card.invalid")
            )}
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
        <FormField
          control={form.control}
          name={`${name}.type`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("menuItem.card.itemType")}</FormLabel>

              <FormControl>
                <Combobox
                  disabled={disabled}
                  className="flex w-full font-normal text-lg"
                  values={menuItemTypes
                    .filter((x) => !!supportsSubmenus || x !== "submenu")
                    .map((x) => ({
                      value: x,
                      label: t(`menuItem.labels.${x}`),
                    }))}
                  searchLabel={t("menuItem.card.selectType")}
                  value={field.value}
                  onItemSelect={(value) => {
                    field.onChange(value);
                    changeType(value as any);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <MenuItemFields
          type={itemType}
          form={form}
          name={name}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
