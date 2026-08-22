"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@hacado/i18n/client";
import { PlateMarkdownEditor } from "@hacado/rte";
import { BookingCatalogNode, BookingConfiguration } from "@hacado/types";
import {
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
} from "@hacado/ui";
import { OptionSelector, PackageSelector } from "@hacado/ui-admin";
import { GripVertical, Trash } from "lucide-react";
import React from "react";
import { FieldPath, useFieldArray, UseFormReturn } from "react-hook-form";

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const GroupChildrenList: React.FC<{
  name: FieldPath<BookingConfiguration>;
  form: UseFormReturn<BookingConfiguration>;
  usedOptionIds: string[];
  usedPackageIds: string[];
  disabled?: boolean;
}> = ({ name, form, usedOptionIds, usedPackageIds, disabled }) => {
  const t = useI18n("admin");
  const childrenPath = `${name}.children` as FieldPath<BookingConfiguration>;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: childrenPath as "catalog",
    keyName: "fields_id",
  });
  const children =
    (form.watch(childrenPath) as BookingCatalogNode[] | undefined) ?? [];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            append({ type: "option", id: newId(), optionId: "" } as never)
          }
        >
          {t("settings.appointments.form.options.addService")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            append({ type: "package", id: newId(), packageId: "" } as never)
          }
        >
          {t("settings.appointments.form.options.addPackage")}
        </Button>
      </div>
      {!fields.length ? (
        <p className="text-xs text-muted-foreground min-h-10 flex items-center">
          {t("settings.appointments.form.options.emptyGroup")}
        </p>
      ) : (
        <div className="flex flex-col gap-2 pl-4 border-l">
          {fields.map((field, index) => {
            const child =
              children[index] ?? (field as unknown as BookingCatalogNode);
            return (
              <CatalogNodeCard
                key={field.fields_id}
                node={child}
                name={
                  `${childrenPath}.${index}` as FieldPath<BookingConfiguration>
                }
                form={form}
                usedOptionIds={usedOptionIds}
                usedPackageIds={usedPackageIds}
                disabled={disabled}
                onRemove={() => remove(index)}
              />
            );
          })}
        </div>
      )}
    </>
  );
};

export const CatalogNodeCard: React.FC<{
  node: BookingCatalogNode;
  name: FieldPath<BookingConfiguration>;
  form: UseFormReturn<BookingConfiguration>;
  usedOptionIds: string[];
  usedPackageIds: string[];
  disabled?: boolean;
  onRemove: () => void;
}> = ({
  node,
  name,
  form,
  usedOptionIds,
  usedPackageIds,
  disabled,
  onRemove,
}) => {
  const t = useI18n("admin");
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldName = (suffix: string) =>
    `${name}.${suffix}` as FieldPath<BookingConfiguration>;

  return (
    <Card ref={setNodeRef} style={style}>
      <CardHeader className="flex flex-row items-center gap-2 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          className={cn(
            "cursor-grab",
            attributes["aria-pressed"] && "cursor-grabbing",
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 text-sm font-medium">
          {node.type === "group"
            ? t("settings.appointments.form.options.addGroup")
            : node.type === "package"
              ? t("settings.appointments.form.options.package")
              : t("settings.appointments.form.options.addService")}
        </div>
        <Button
          type="button"
          variant="ghost-destructive"
          size="icon"
          disabled={disabled}
          onClick={onRemove}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {node.type === "option" ? (
          <FormField
            control={form.control}
            name={fieldName("optionId")}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("settings.appointments.form.options.addService")}
                </FormLabel>
                <FormControl>
                  <OptionSelector
                    disabled={disabled}
                    value={field.value as string}
                    excludeIds={usedOptionIds.filter(
                      (id) => id !== field.value,
                    )}
                    onItemSelect={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        {node.type === "package" ? (
          <FormField
            control={form.control}
            name={fieldName("packageId")}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("settings.appointments.form.options.package")}
                </FormLabel>
                <FormControl>
                  <PackageSelector
                    disabled={disabled}
                    value={field.value as string}
                    excludeIds={usedPackageIds.filter(
                      (id) => id !== field.value,
                    )}
                    onItemSelect={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        {node.type === "group" ? (
          <>
            <FormField
              control={form.control}
              name={fieldName("name")}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("settings.appointments.form.options.groupName")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={disabled}
                      value={(field.value as string) ?? ""}
                      placeholder={t(
                        "settings.appointments.form.options.groupName",
                      )}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={fieldName("description")}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("settings.appointments.form.options.groupDescription")}
                  </FormLabel>
                  <FormControl>
                    <PlateMarkdownEditor
                      className="bg-background px-4 sm:px-4 pb-16"
                      disabled={disabled}
                      value={(field.value as string) ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <GroupChildrenList
              name={name}
              form={form}
              usedOptionIds={usedOptionIds}
              usedPackageIds={usedPackageIds}
              disabled={disabled}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};
