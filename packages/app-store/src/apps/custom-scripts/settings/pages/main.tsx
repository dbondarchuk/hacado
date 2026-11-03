"use client";

import { useI18n } from "@hacado/i18n/client";
import { SaveButton } from "@hacado/ui-admin/save-button";
import { Sortable } from "@hacado/ui-admin/sortable";
import { AutoSkeleton } from "@hacado/ui/auto-skeleton";
import { Button } from "@hacado/ui/button";
import { Form } from "@hacado/ui/form";
import { Plus } from "lucide-react";
import React from "react";
import { useFieldArray } from "react-hook-form";
import { ZodType } from "zod";
import { useConnectedAppSetup } from "../../../../hooks/use-connected-app-setup";
import { CustomScriptsApp } from "../../app";
import {
  loadPageLabels,
  ScriptCard,
  ScriptWithId,
} from "../../components/script-card";
import { useCollapsedSortableItems } from "../../hooks/use-collapsed-sortable-items";
import {
  CustomScriptsConfiguration,
  customScriptsConfigurationSchema,
  nextUniqueScriptName,
} from "../../models";
import {
  CustomScriptsAdminKeys,
  CustomScriptsAdminNamespace,
  customScriptsAdminNamespace,
} from "../../translations/types";

export const CustomScriptsSettingsPage: React.FC<{ appId: string }> = ({
  appId,
}) => {
  const t = useI18n<CustomScriptsAdminNamespace, CustomScriptsAdminKeys>(
    customScriptsAdminNamespace,
  );

  const [pageLabels, setPageLabels] = React.useState<Record<string, string>>(
    {},
  );

  const { form, isLoading, isDataLoading, onSubmit } =
    useConnectedAppSetup<CustomScriptsConfiguration>({
      appId,
      appName: CustomScriptsApp.name,
      schema: customScriptsConfigurationSchema as ZodType<
        CustomScriptsConfiguration,
        CustomScriptsConfiguration
      >,
      initialData: { scripts: [] },
      processDataForSubmit: (data) => ({
        type: "set-configuration",
        configuration: data,
      }),
      successText: t("settings.toasts.saved"),
      errorText: t("settings.toasts.error"),
    });

  const { fields, append, remove, swap, update } = useFieldArray({
    control: form.control,
    name: "scripts",
  });

  React.useEffect(() => {
    if (isDataLoading) return;

    const pageIds = form
      .getValues("scripts")
      .flatMap((script) => script.pageIds ?? []);

    if (!pageIds.length) {
      setPageLabels({});
      return;
    }

    let cancelled = false;

    loadPageLabels(pageIds).then((labels) => {
      if (!cancelled) setPageLabels(labels);
    });

    return () => {
      cancelled = true;
    };
  }, [form, isDataLoading]);

  const ids = React.useMemo(() => fields.map((field) => field.id), [fields]);

  const { allCollapsed, toggleAll, toggleOne, isCollapsed } =
    useCollapsedSortableItems(ids);

  const sort = (activeId: string, overId: string) => {
    const activeIndex = fields.findIndex((field) => field.id === activeId);
    const overIndex = fields.findIndex((field) => field.id === overId);

    if (activeIndex < 0 || overIndex < 0) return;

    swap(activeIndex, overIndex);
  };

  const addNew = () => {
    const existingNames = form
      .getValues("scripts")
      .map((script) => script.name);

    append({
      name: nextUniqueScriptName(existingNames),
      source: "remote",
      url: "",
      strategy: "defer",
      enabled: true,
      placement: "header",
      pageIds: [],
      runOnEveryPage: false,
    });
  };

  const onPageLabel = React.useCallback((pageId: string, title: string) => {
    setPageLabels((prev) => ({ ...prev, [pageId]: title }));
  }, []);

  return (
    <AutoSkeleton loading={isDataLoading}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <Sortable
            title={t("navigation.main.title")}
            ids={ids}
            onSort={sort}
            disabled={isLoading}
            allCollapsed={allCollapsed}
            collapse={toggleAll}
            addButton={
              <Button
                type="button"
                disabled={isLoading}
                variant="ghost"
                size="sm"
                onClick={addNew}
                className="inline-flex gap-1"
              >
                <Plus className="size-4" />
                {t("settings.addScript")}
              </Button>
            }
          >
            <div className="flex flex-grow flex-col gap-4">
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("settings.empty")}
                </p>
              ) : (
                fields.map((item, index) => (
                  <ScriptCard
                    key={item.id}
                    item={item as ScriptWithId}
                    form={form}
                    name={`scripts.${index}`}
                    disabled={isLoading}
                    collapsed={isCollapsed(item.id)}
                    onCollapsedChange={() => toggleOne(item.id)}
                    pageLabels={pageLabels}
                    onPageLabel={onPageLabel}
                    remove={() => remove(index)}
                    update={(newValue) => update(index, newValue)}
                  />
                ))
              )}
            </div>
          </Sortable>
          <SaveButton form={form} isLoading={isLoading || isDataLoading} />
        </form>
      </Form>
    </AutoSkeleton>
  );
};
