"use client";

import { MemberSelectCard } from "@/components/admin/services/options/member-select-card";
import { useI18n } from "@hacado/i18n/client";
import { Sortable } from "@hacado/ui-admin";
import React from "react";
import { useFieldArray, UseFormReturn, useWatch } from "react-hook-form";
import { TabProps } from "./types";

export const MembersTab: React.FC<TabProps> = ({ form, disabled }) => {
  const t = useI18n("admin");

  const {
    fields: staffFields,
    append: appendStaff,
    remove: removeStaff,
    swap: swapStaff,
  } = useFieldArray({
    control: form.control,
    name: "staff",
    keyName: "fields_id",
  });

  const isOnline = !!useWatch({ control: form.control, name: "isOnline" });
  const staffFieldsIds = staffFields.map((x) => x.fields_id);

  const sortStaff = (activeId: string, overId: string) => {
    const activeIndex = staffFields.findIndex((x) => x.fields_id === activeId);
    const overIndex = staffFields.findIndex((x) => x.fields_id === overId);
    if (activeIndex < 0 || overIndex < 0) return;
    swapStaff(activeIndex, overIndex);
  };

  const addNewMember = () => {
    appendStaff({
      memberId: "",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t("services.options.form.staff.hint")}
      </p>
      <Sortable
        title={t("services.options.form.staff.title")}
        ids={staffFieldsIds}
        onSort={sortStaff}
        onAdd={addNewMember}
      >
        <div className="flex flex-grow flex-col gap-4">
          {staffFields.map((item, index) => {
            return (
              <MemberSelectCard
                form={form as UseFormReturn<any>}
                item={item as { memberId: string; fields_id: string }}
                key={item.fields_id}
                name={`staff.${index}`}
                disabled={disabled}
                isOnline={isOnline}
                remove={() => removeStaff(index)}
                excludeIds={form
                  .getValues("staff")
                  ?.filter(
                    ({ memberId }: { memberId?: string }, i: number) =>
                      memberId !== form.getValues(`staff.${index}`)?.memberId &&
                      i !== index,
                  )
                  .map(({ memberId }: { memberId: string }) => memberId)}
              />
            );
          })}
        </div>
      </Sortable>
    </div>
  );
};
