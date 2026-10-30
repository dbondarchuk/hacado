"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@hacado/i18n/client";
import { PlateMarkdownEditor } from "@hacado/rte";
import {
  BookingCatalogNode,
  BookingConfiguration,
} from "@hacado/types/configuration/booking";
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
  FormLabelWithRequiredIndicator,
  FormMessage,
  Input,
} from "@hacado/ui";
import { PackageSelector, ServiceSelector } from "@hacado/ui-admin";
import { GripVertical, Trash } from "lucide-react";
import React from "react";
import { FieldPath, useFieldArray, UseFormReturn } from "react-hook-form";

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const CatalogNodeHeader: React.FC<{
  node: BookingCatalogNode;
  selectedName?: string;
}> = ({ node, selectedName }) => {
  const t = useI18n("admin");
  const name =
    node.type === "group" ? node.name.trim() : (selectedName?.trim() ?? "");

  if (node.type === "group") {
    if (!name) {
      return t("settings.appointments.form.options.group");
    }

    return t("settings.appointments.form.options.groupWithName", { name });
  }

  if (node.type === "package") {
    if (!name) {
      return t("settings.appointments.form.options.package");
    }

    return t("settings.appointments.form.options.packageWithName", { name });
  }

  if (!name) {
    return t("settings.appointments.form.options.service");
  }

  return t("settings.appointments.form.options.serviceWithName", { name });
};

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
            append({ type: "service", id: newId(), serviceId: "" } as never)
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
        <div className="flex min-w-0 flex-col gap-2 border-l pl-4">
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
  const [selectedName, setSelectedName] = React.useState<string | undefined>();
  const rememberSelectedName = React.useCallback(
    (item: { name: string } | undefined) => {
      setSelectedName(item?.name);
    },
    [],
  );

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
    <Card ref={setNodeRef} style={style} className="min-w-0 max-w-full">
      <CardHeader className="flex min-w-0 flex-row items-center gap-2 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          className={cn(
            "shrink-0 cursor-grab",
            attributes["aria-pressed"] && "cursor-grabbing",
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="min-w-0 flex-1 truncate text-sm font-medium">
          <CatalogNodeHeader node={node} selectedName={selectedName} />
        </div>
        <Button
          type="button"
          variant="ghost-destructive"
          size="icon"
          className="shrink-0"
          disabled={disabled}
          onClick={onRemove}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3">
        {node.type === "service" ? (
          <FormField
            control={form.control}
            name={fieldName("serviceId")}
            render={({ field }) => (
              <FormItem className="min-w-0 grid-cols-[minmax(0,1fr)]">
                <FormLabelWithRequiredIndicator required>
                  {t("settings.appointments.form.options.service")}
                </FormLabelWithRequiredIndicator>
                <FormControl>
                  <ServiceSelector
                    disabled={disabled}
                    value={field.value as string}
                    excludeIds={usedOptionIds.filter(
                      (id) => id !== field.value,
                    )}
                    onItemSelect={field.onChange}
                    onValueChange={rememberSelectedName}
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
              <FormItem className="min-w-0 grid-cols-[minmax(0,1fr)]">
                <FormLabelWithRequiredIndicator required>
                  {t("settings.appointments.form.options.package")}
                </FormLabelWithRequiredIndicator>
                <FormControl>
                  <PackageSelector
                    disabled={disabled}
                    value={field.value as string}
                    excludeIds={usedPackageIds.filter(
                      (id) => id !== field.value,
                    )}
                    onItemSelect={field.onChange}
                    onValueChange={rememberSelectedName}
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
                <FormItem className="min-w-0 grid-cols-[minmax(0,1fr)]">
                  <FormLabelWithRequiredIndicator required>
                    {t("settings.appointments.form.options.groupName")}
                  </FormLabelWithRequiredIndicator>
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
                <FormItem className="min-w-0 grid-cols-[minmax(0,1fr)]">
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
