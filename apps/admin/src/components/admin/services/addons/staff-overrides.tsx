"use client";

import { MemberOverrideCard } from "@/components/admin/services/addons/member-override-card";
import { useI18n } from "@hacado/i18n/client";
import { NonSortable } from "@hacado/ui-admin";
import React from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";

export type StaffOverridesProps = {
  form: UseFormReturn<any>;
  disabled?: boolean;
};

export const StaffOverrides: React.FC<StaffOverridesProps> = ({
  form,
  disabled,
}) => {
  const t = useI18n("admin");

  const {
    fields: staffFields,
    append: appendStaff,
    remove: removeStaff,
  } = useFieldArray({
    control: form.control,
    name: "staff",
    keyName: "fields_id",
  });

  const staffFieldsIds = staffFields.map((x) => x.fields_id);

  const addNewMember = () => {
    appendStaff({
      memberId: "",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t("services.addons.form.staffOverrides.hint")}
      </p>
      <NonSortable
        title={t("services.addons.form.staffOverrides.title")}
        ids={staffFieldsIds}
        onAdd={addNewMember}
        disabled={disabled}
        addButtonText={t("services.addons.form.staffOverrides.add")}
      >
        <div className="flex flex-grow flex-col gap-4">
          {staffFields.map((item, index) => (
            <MemberOverrideCard
              form={form}
              item={item as { memberId: string; fields_id: string }}
              key={item.fields_id}
              name={`staff.${index}`}
              disabled={disabled}
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
          ))}
        </div>
      </NonSortable>
    </div>
  );
};
