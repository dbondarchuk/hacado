"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  BookingCatalogNode,
  BookingConfiguration,
  catalogNodeIds,
  flattenCatalogOptionIds,
  flattenCatalogPackageIds,
  moveCatalogNode,
  normalizeCatalogNodes,
} from "@hacado/types";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@hacado/ui";
import { Sortable } from "@hacado/ui-admin";
import { FolderPlus, PackagePlus, Plus, Sparkles } from "lucide-react";
import React from "react";
import { FieldPath, useFieldArray } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { CatalogNodeCard } from "./catalog-node-card";
import { TabProps } from "./types";

const newId = () => uuidv4();

export const CatalogTab: React.FC<TabProps> = ({ form, disabled }) => {
  const t = useI18n("admin");
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "catalog",
    keyName: "fields_id",
  });
  const catalog =
    (form.watch("catalog") as BookingCatalogNode[] | undefined) ?? [];

  const setCatalog = (nodes: BookingCatalogNode[]) => {
    replace(normalizeCatalogNodes(nodes) as never[]);
    form.clearErrors("catalog");
    void form.trigger("catalog");
  };

  const addNode = (node: BookingCatalogNode) => {
    append(node as never);
  };

  const ids = catalogNodeIds(catalog);
  const usedOptionIds = flattenCatalogOptionIds(catalog);
  const usedPackageIds = flattenCatalogPackageIds(catalog);
  const sort = (activeId: string, overId: string) => {
    const next = moveCatalogNode(catalog, activeId, overId);
    if (next === catalog) return;
    setCatalog(next);
  };

  const catalogState = form.getFieldState("catalog");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" disabled={disabled}>
              <Plus className="h-4 w-4" />
              {t("common.buttons.addNew")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() =>
                addNode({ type: "group", id: newId(), name: "", children: [] })
              }
            >
              <FolderPlus className="h-4 w-4" />
              {t("settings.appointments.form.options.addGroup")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                addNode({ type: "option", id: newId(), optionId: "" })
              }
            >
              <Sparkles className="h-4 w-4" />
              {t("settings.appointments.form.options.addService")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                addNode({ type: "package", id: newId(), packageId: "" })
              }
            >
              <PackagePlus className="h-4 w-4" />
              {t("settings.appointments.form.options.addPackage")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Sortable
        title={t("settings.appointments.form.options.title")}
        ids={ids}
        onSort={sort}
        invalid={{
          isInvalid: catalogState.invalid,
          message: catalogState.error?.message,
        }}
      >
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const node =
              catalog[index] ?? (field as unknown as BookingCatalogNode);
            return (
              <CatalogNodeCard
                key={field.fields_id}
                node={node}
                name={`catalog.${index}` as FieldPath<BookingConfiguration>}
                form={form}
                usedOptionIds={usedOptionIds}
                usedPackageIds={usedPackageIds}
                disabled={disabled}
                onRemove={() => remove(index)}
              />
            );
          })}
        </div>
      </Sortable>
    </div>
  );
};
