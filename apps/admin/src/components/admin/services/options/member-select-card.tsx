"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@hacado/i18n/client";
import type { TeamMemberListModel } from "@hacado/types";
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
  DurationInput,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  useCurrencySymbol,
} from "@hacado/ui";
import { MemberSelector } from "@hacado/ui-admin";
import { cva } from "class-variance-authority";
import { AlertTriangle, GripVertical, Trash, X } from "lucide-react";
import React from "react";
import { UseFormReturn } from "react-hook-form";

export type MemberSelectProps = {
  item: {
    memberId: string;
    fields_id: string;
  };
  excludeIds?: string[];
  name: string;
  form: UseFormReturn<any>;
  disabled?: boolean;
  isOverlay?: boolean;
  /** When true, warn if the selected member has no meeting URL provider. */
  isOnline?: boolean;
  remove: () => void;
};

export type MemberSelectType = "MemberSelect";

export interface MemberSelectDragData {
  type: MemberSelectType;
  item: {
    fields_id: string;
  };
}

export const MemberSelectCard: React.FC<MemberSelectProps> = ({
  item,
  form,
  name,
  excludeIds,
  disabled,
  isOverlay,
  isOnline = false,
  remove,
}) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();
  const [selectedMember, setSelectedMember] = React.useState<
    TeamMemberListModel | undefined
  >();
  const durationType = form.watch("durationType") as
    | "fixed"
    | "flexible"
    | undefined;
  const isFlexible = durationType === "flexible";
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.fields_id,
    data: {
      type: "MemberSelect",
      item,
    } satisfies MemberSelectDragData,
    attributes: {
      roleDescription: "Member",
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

  const showMeetingProviderWarning =
    isOnline && !!selectedMember && !selectedMember.meetingUrlProviderAppId;

  return (
    <Card
      className={cn(
        variants({
          dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
        }),
      )}
      ref={setNodeRef}
      style={style}
    >
      <CardHeader className="justify-between relative flex flex-row border-b px-3 py-3 w-full items-center">
        <div className="flex flex-row items-center gap-2">
          <Button
            type="button"
            variant={"ghost"}
            {...attributes}
            {...listeners}
            className="h-auto cursor-grab p-1 text-secondary-foreground/50"
          >
            <></>
            <span className="sr-only">
              {t("services.options.form.staff.memberSelectCard.moveMember")}
            </span>
            <GripVertical />
          </Button>
          <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("services.options.form.staff.memberSelectCard.member")}
          </span>
        </div>
        <div className="flex flex-row items-start">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={disabled}
                variant="ghost-destructive"
                size="icon"
                type="button"
              >
                <Trash />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t(
                    "services.options.form.staff.memberSelectCard.deleteConfirmTitle",
                  )}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t(
                    "services.options.form.staff.memberSelectCard.deleteConfirmDescription",
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("services.options.form.staff.memberSelectCard.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction asChild variant="destructive">
                  <Button onClick={remove}>
                    {t("services.options.form.staff.memberSelectCard.delete")}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="py-6 grid grid-cols-1 gap-2 flex-grow w-full">
        <FormField
          control={form.control}
          name={`${name}.memberId`}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>
                {t("services.options.form.staff.memberSelectCard.member")}
              </FormLabel>
              <FormControl>
                <MemberSelector
                  disabled={disabled}
                  excludeIds={excludeIds}
                  className="flex w-full font-normal text-lg"
                  value={field.value}
                  onItemSelect={field.onChange}
                  onValueChange={setSelectedMember}
                />
              </FormControl>
              <FormMessage />
              {showMeetingProviderWarning ? (
                <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 text-sm text-amber-800 dark:text-amber-200">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                  <p>
                    {t(
                      "services.options.form.staff.memberSelectCard.meetingUrlProviderWarning",
                    )}
                  </p>
                </div>
              ) : null}
            </FormItem>
          )}
        />
        <div className={cn("grid gap-2", !isFlexible && "sm:grid-cols-2")}>
          <FormField
            control={form.control}
            name={`${name}.priceOverride`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t(
                    "services.options.form.staff.memberSelectCard.overrides.price",
                  )}
                </FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon
                      className={InputGroupAddonClasses({
                        variant: "prefix",
                      })}
                    >
                      {currencySymbol}
                    </InputGroupAddon>
                    <InputGroupInput>
                      <Input
                        disabled={disabled}
                        placeholder="0.00"
                        type="number"
                        className={cn(
                          InputGroupInputClasses({
                            variant: "prefix",
                          }),
                          isFlexible &&
                            InputGroupInputClasses({
                              variant: "suffix",
                            }),
                          !isFlexible && "rounded-r-none",
                        )}
                        {...field}
                      />
                    </InputGroupInput>
                    {isFlexible ? (
                      <InputGroupAddon
                        className={cn(
                          InputGroupAddonClasses({
                            variant: "suffix",
                          }),
                          "rounded-r-none",
                        )}
                      >
                        {t("services.options.form.pricePerHour.suffix")}
                      </InputGroupAddon>
                    ) : null}
                    <Button
                      variant="outline"
                      className="rounded-l-none border-l-0"
                      onClick={() => {
                        field.onChange("");
                        field.onBlur();
                      }}
                    >
                      <X className="w-4 h-4 opacity-50" />
                    </Button>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!isFlexible ? (
            <FormField
              control={form.control}
              name={`${name}.durationOverride`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      "services.options.form.staff.memberSelectCard.overrides.duration",
                    )}
                  </FormLabel>
                  <FormControl>
                    <DurationInput {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
