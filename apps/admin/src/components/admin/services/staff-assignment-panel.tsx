"use client";

import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import type { StaffAssignment } from "@timelish/types";
import {
  Button,
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
} from "@timelish/ui";
import { useEffect, useState } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";

type MemberOption = {
  id: string;
  name: string;
};

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
};

export function StaffAssignmentPanel<T extends FieldValues>({
  control,
  name,
}: Props<T>) {
  const t = useI18n("admin");
  const [members, setMembers] = useState<MemberOption[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await adminApi.teams.getMembers({
        page: 1,
        limit: 100,
        status: ["active"],
      });
      setMembers(
        res.items.map((m) => ({
          id: m._id,
          name: m.name || m.email,
        })),
      );
    })();
  }, []);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const staff = (field.value as StaffAssignment[] | undefined) ?? [];
        const selectedIds = new Set(staff.map((s) => s.memberId));

        const toggle = (memberId: string, checked: boolean) => {
          if (checked) {
            field.onChange([...staff, { memberId }]);
          } else {
            field.onChange(staff.filter((s) => s.memberId !== memberId));
          }
        };

        const updateOverride = (
          memberId: string,
          patch: Partial<StaffAssignment>,
        ) => {
          field.onChange(
            staff.map((s) =>
              s.memberId === memberId ? { ...s, ...patch } : s,
            ),
          );
        };

        return (
          <FormItem className="space-y-4">
            <FormLabel>{t("team.assignTo")}</FormLabel>
            <FormControl>
              <div className="space-y-3">
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("services.memberSelector.loading")}
                  </p>
                ) : (
                  members.map((m) => {
                    const assignment = staff.find((s) => s.memberId === m.id);
                    const checked = selectedIds.has(m.id);
                    return (
                      <div
                        key={m.id}
                        className="rounded-md border p-3 space-y-2"
                      >
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => toggle(m.id, !!v)}
                          />
                          <span className="text-sm font-medium">{m.name}</span>
                        </label>
                        {checked ? (
                          <div className="grid gap-2 sm:grid-cols-2 pl-6">
                            <div className="space-y-1">
                              <Label className="text-xs">
                                {t("team.priceOverride")}
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                value={assignment?.priceOverride ?? ""}
                                onChange={(e) =>
                                  updateOverride(m.id, {
                                    priceOverride: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">
                                {t("team.durationOverride")}
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                value={assignment?.durationOverride ?? ""}
                                onChange={(e) =>
                                  updateOverride(m.id, {
                                    durationOverride: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  })
                                }
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
                {staff.length ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => field.onChange([])}
                  >
                    {t("team.clearStaff")}
                  </Button>
                ) : null}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
