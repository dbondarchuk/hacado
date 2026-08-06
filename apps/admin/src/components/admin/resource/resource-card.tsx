"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@hacado/i18n/client";
import {
  Resource,
  resourceSchema,
  resourceSourceTypeLabels,
} from "@hacado/types";
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
  Combobox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IComboboxItem,
  Input,
  useTheme,
} from "@hacado/ui";
import { stripObject } from "@hacado/utils";
import { Editor } from "@monaco-editor/react";
import { cva } from "class-variance-authority";
import { GripVertical, Trash } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

export type ResourceWithId = Resource & {
  id: string;
};

export type ResourceCardProps = {
  type: "script" | "css";
  item: ResourceWithId;
  name: string;
  form: UseFormReturn<any>;
  disabled?: boolean;
  isOverlay?: boolean;
  remove: () => void;
  update: (newValue: ResourceWithId) => void;
};

export type ResourceType = "Resource";

export interface ResourceDragData {
  type: ResourceType;
  item: ResourceWithId;
}

const resourceSourceTypeValues = Object.entries(resourceSourceTypeLabels).map(
  ([value, label]) =>
    ({
      value,
      label,
    }) as IComboboxItem,
);

export const ResourceCard = ({
  type,
  item,
  form,
  name,
  disabled,
  isOverlay,
  remove,
  update,
}: ResourceCardProps) => {
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
      type: "Resource",
      item,
    } satisfies ResourceDragData,
    attributes: {
      roleDescription: "Resource",
    },
  });

  const { resolvedTheme } = useTheme();

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

  const itemSourceType = item.source;

  const changeSource = (value: typeof itemSourceType) => {
    const newValue = {
      ...form.getValues(name),
      source: value,
    };

    const strippedValue = stripObject(newValue, resourceSchema) as Resource;

    update(strippedValue as ResourceWithId);
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
            <span className="sr-only">{t("resource.card.moveResource")}</span>
            <GripVertical />
          </Button>
          <span
            className={cn(
              "text-sm font-semibold uppercase tracking-wide text-muted-foreground",
              !resourceSourceTypeLabels[itemSourceType] && "text-destructive",
            )}
          >
            {itemSourceType
              ? resourceSourceTypeLabels[itemSourceType]
              : t("resource.card.invalid")}
          </span>
        </div>
        <div className="flex flex-row gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={disabled}
                variant="ghost-destructive"
                size="icon"
                type="button"
                title={t("resource.card.remove")}
              >
                <Trash />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("resource.card.deleteConfirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("resource.card.deleteConfirmDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("resource.card.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction asChild variant="destructive">
                  <Button onClick={remove}>{t("resource.card.delete")}</Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-6 pt-3 text-left relative grid md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${name}.source`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("resource.card.sourceType")}</FormLabel>

              <FormControl>
                <Combobox
                  disabled={disabled}
                  className="flex w-full font-normal text-lg"
                  values={resourceSourceTypeValues}
                  searchLabel={t("resource.card.selectSourceType")}
                  value={field.value}
                  onItemSelect={(value) => {
                    field.onChange(value);
                    changeSource(value as any);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {itemSourceType === "remote" && (
          <>
            <FormField
              control={form.control}
              name={`${name}.url`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("resource.card.url")}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={disabled}
                      placeholder={t("resource.card.urlPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        {itemSourceType === "inline" && (
          <>
            <FormField
              control={form.control}
              name={`${name}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("resource.card.value")}</FormLabel>
                  <FormControl>
                    <Editor
                      height="20vh"
                      language={type === "script" ? "javascript" : "css"}
                      value={field.value}
                      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                      onChange={(e) => {
                        field.onChange(e);
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};
