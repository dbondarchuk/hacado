"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { pagesApi } from "@hacado/api-sdk/admin/pages";
import { useI18n } from "@hacado/i18n/client";
import { PageListModelWithUrl } from "@hacado/types/pages";
import { PageSelectorDialog } from "@hacado/ui-admin/page-selector-dialog";
import { SwitchCardFormItem } from "@hacado/ui-admin/switch-card-form-item";
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
} from "@hacado/ui/alert-dialog";
import { Badge } from "@hacado/ui/badge";
import { Button } from "@hacado/ui/button";
import { Card, CardContent, CardHeader } from "@hacado/ui/card";
import { cn } from "@hacado/ui/cn";
import { Combobox, IComboboxItem } from "@hacado/ui/combobox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabelWithRequiredIndicator,
  FormMessage,
} from "@hacado/ui/form";
import { useTheme } from "@hacado/ui/hooks";
import { Input } from "@hacado/ui/input";
import { Editor } from "@monaco-editor/react";
import { cva } from "class-variance-authority";
import { ChevronDown, GripVertical, Plus, Trash, X } from "lucide-react";
import React from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import {
  CustomScript,
  CustomScriptsConfiguration,
  scriptPlacementSchema,
  scriptStrategySchema,
} from "../models";
import {
  CustomScriptsAdminKeys,
  CustomScriptsAdminNamespace,
  customScriptsAdminNamespace,
} from "../translations/types";

export type ScriptWithId = CustomScript & { id: string };

export type ScriptCardProps = {
  item: ScriptWithId;
  name: `scripts.${number}`;
  form: UseFormReturn<CustomScriptsConfiguration>;
  disabled?: boolean;
  isOverlay?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  remove: () => void;
  update: (newValue: ScriptWithId) => void;
  pageLabels: Record<string, string>;
  onPageLabel: (pageId: string, title: string) => void;
};

export const ScriptCard = ({
  item,
  form,
  name,
  disabled,
  isOverlay,
  collapsed = false,
  onCollapsedChange,
  remove,
  update,
  pageLabels,
  onPageLabel,
}: ScriptCardProps) => {
  const t = useI18n<CustomScriptsAdminNamespace, CustomScriptsAdminKeys>(
    customScriptsAdminNamespace,
  );

  const { resolvedTheme } = useTheme();
  const [pagePickerOpen, setPagePickerOpen] = React.useState(false);

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
      type: "CustomScript",
      item,
    },
    attributes: {
      roleDescription: "Script",
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

  const scriptName = useWatch({ control: form.control, name: `${name}.name` });
  const source = useWatch({ control: form.control, name: `${name}.source` });
  const pageIds =
    useWatch({ control: form.control, name: `${name}.pageIds` }) ?? [];

  const placementValues: IComboboxItem[] = scriptPlacementSchema.options.map(
    (value) => ({
      value,
      label: t(`settings.placement.${value}`),
    }),
  );

  const sourceValues: IComboboxItem[] = [
    { value: "remote", label: t("settings.source.remote") },
    { value: "inline", label: t("settings.source.inline") },
  ];

  const strategyValues: IComboboxItem[] = scriptStrategySchema.options.map(
    (value) => ({
      value,
      label: t(`settings.strategy.${value}`),
    }),
  );

  const changeSource = (value: "inline" | "remote") => {
    const current = form.getValues(name);

    if (value === "inline") {
      update({
        id: item.id,
        name: current.name,
        source: "inline",
        value: current.source === "inline" ? current.value : "",
        enabled: current.enabled,
        placement: current.placement,
        pageIds: current.pageIds ?? [],
        runOnEveryPage: current.runOnEveryPage,
      });

      return;
    }

    update({
      id: item.id,
      name: current.name,
      source: "remote",
      url: current.source === "remote" ? current.url : "",
      strategy: current.source === "remote" ? current.strategy : "defer",
      enabled: current.enabled,
      placement: current.placement,
      pageIds: current.pageIds ?? [],
      runOnEveryPage: current.runOnEveryPage,
    });
  };

  const addPage = (page: PageListModelWithUrl) => {
    if (pageIds.includes(page._id)) {
      setPagePickerOpen(false);
      return;
    }

    form.setValue(`${name}.pageIds`, [...pageIds, page._id], {
      shouldDirty: true,
      shouldValidate: true,
    });

    onPageLabel(page._id, page.title);
    setPagePickerOpen(false);
  };

  const removePage = (pageId: string) => {
    form.setValue(
      `${name}.pageIds`,
      pageIds.filter((id) => id !== pageId),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const headerLabel = scriptName?.trim() || t("settings.name.untitled");

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })}
    >
      <CardHeader className="justify-between relative flex flex-row border-b px-3 py-3 w-full items-center">
        <div className="flex flex-row items-center gap-2 min-w-0">
          <Button
            type="button"
            variant="ghost"
            {...attributes}
            {...listeners}
            className="-ml-2 h-auto cursor-grab p-1 text-secondary-foreground/50"
          >
            <span className="sr-only">{t("settings.moveScript")}</span>
            <GripVertical />
          </Button>
          {onCollapsedChange ? (
            <Button
              type="button"
              variant="ghost"
              className="min-w-0 shrink"
              onClick={() => onCollapsedChange(!collapsed)}
              aria-expanded={!collapsed}
            >
              <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground truncate">
                {headerLabel}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  collapsed && "-rotate-90",
                )}
              />
            </Button>
          ) : (
            <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground truncate">
              {headerLabel}
            </span>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={disabled}
              variant="ghost-destructive"
              size="icon"
              type="button"
              title={t("settings.remove")}
            >
              <Trash />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("settings.deleteConfirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("settings.deleteConfirmDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("settings.cancel")}</AlertDialogCancel>
              <AlertDialogAction asChild variant="destructive">
                <Button onClick={remove}>{t("settings.delete")}</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      {!collapsed && (
        <CardContent className="px-3 pb-6 pt-3 text-left relative grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={`${name}.name`}
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabelWithRequiredIndicator required>
                  {t("settings.name.label")}
                </FormLabelWithRequiredIndicator>
                <FormControl>
                  <Input
                    disabled={disabled}
                    placeholder={t("settings.name.placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${name}.enabled`}
            render={({ field }) => (
              <SwitchCardFormItem
                className="md:col-span-2"
                label={t("settings.enabled.label")}
                description={t("settings.enabled.description")}
                checked={field.value === true}
                disabled={disabled}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <FormField
            control={form.control}
            name={`${name}.runOnEveryPage`}
            render={({ field }) => (
              <SwitchCardFormItem
                className="md:col-span-2"
                label={t("settings.runOnEveryPage.label")}
                description={t("settings.runOnEveryPage.description")}
                checked={field.value === true}
                disabled={disabled}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <FormField
            control={form.control}
            name={`${name}.placement`}
            render={({ field }) => (
              <FormItem>
                <FormLabelWithRequiredIndicator required>
                  {t("settings.placement.label")}
                </FormLabelWithRequiredIndicator>
                <FormControl>
                  <Combobox
                    disabled={disabled}
                    className="flex w-full font-normal"
                    values={placementValues}
                    searchLabel={t("settings.placement.label")}
                    value={field.value}
                    onItemSelect={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${name}.source`}
            render={({ field }) => (
              <FormItem>
                <FormLabelWithRequiredIndicator required>
                  {t("settings.source.label")}
                </FormLabelWithRequiredIndicator>
                <FormControl>
                  <Combobox
                    disabled={disabled}
                    className="flex w-full font-normal"
                    values={sourceValues}
                    searchLabel={t("settings.source.label")}
                    value={field.value}
                    onItemSelect={(value) => {
                      field.onChange(value);
                      changeSource(value as "inline" | "remote");
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {source === "remote" && (
            <>
              <FormField
                control={form.control}
                name={`${name}.url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("settings.url.label")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <Input
                        disabled={disabled}
                        placeholder={t("settings.url.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${name}.strategy`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("settings.strategy.label")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <Combobox
                        disabled={disabled}
                        className="flex w-full font-normal"
                        values={strategyValues}
                        searchLabel={t("settings.strategy.label")}
                        value={field.value}
                        onItemSelect={(value) => field.onChange(value)}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("settings.strategy.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          {source === "inline" && (
            <FormField
              control={form.control}
              name={`${name}.value`}
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabelWithRequiredIndicator required>
                    {t("settings.value.label")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Editor
                      height="20vh"
                      language="javascript"
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
          )}
          <FormItem className="md:col-span-2">
            <FormLabelWithRequiredIndicator>
              {t("settings.pages.label")}
            </FormLabelWithRequiredIndicator>
            <FormDescription>{t("settings.pages.description")}</FormDescription>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {pageIds.length === 0 ? (
                <Badge variant="secondary">
                  {t("settings.pages.allPages")}
                </Badge>
              ) : (
                pageIds.map((pageId) => (
                  <Badge
                    key={pageId}
                    variant="secondary"
                    className="inline-flex items-center gap-1"
                  >
                    <span>{pageLabels[pageId] || pageId}</span>
                    <button
                      type="button"
                      disabled={disabled}
                      className={cn(
                        "rounded-full hover:bg-muted p-0.5",
                        disabled && "opacity-50",
                      )}
                      onClick={() => removePage(pageId)}
                      aria-label={t("settings.pages.remove")}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => setPagePickerOpen(true)}
                className="inline-flex gap-1"
              >
                <Plus className="size-4" />
                {t("settings.pages.add")}
              </Button>
            </div>
            <PageSelectorDialog
              isOpen={pagePickerOpen}
              close={() => setPagePickerOpen(false)}
              onSelected={addPage}
            />
          </FormItem>
        </CardContent>
      )}
    </Card>
  );
};

export async function loadPageLabels(
  pageIds: string[],
): Promise<Record<string, string>> {
  if (!pageIds.length) return {};

  const uniqueIds = [...new Set(pageIds)];
  const result = await pagesApi.getPages({
    priorityId: uniqueIds,
    limit: uniqueIds.length,
    page: 1,
  });

  return Object.fromEntries(
    result.items.map((page) => [page._id, page.title] as const),
  );
}
