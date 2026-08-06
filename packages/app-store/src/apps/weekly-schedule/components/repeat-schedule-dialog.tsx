"use client";

import { useI18n } from "@hacado/i18n/client";
import { WeekIdentifier } from "@hacado/types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  Spinner,
  toastPromise,
} from "@hacado/ui";
import { WeekSelector } from "@hacado/ui-admin";
import { getWeekIdentifier } from "@hacado/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Repeat2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  WeeklyScheduleAdminKeys,
  WeeklyScheduleAdminNamespace,
  weeklyScheduleAdminNamespace,
} from "../translations/types";
import { repeatWeeklySchedule } from "./actions";
import { getWeekDisplay } from "./utils";

type RepeatScheduleDialogProps = {
  appId: string;
  week: WeekIdentifier;
  memberId?: string;
  disabled?: boolean;
  className?: string;
};

export const RepeatScheduleDialog: React.FC<RepeatScheduleDialogProps> = ({
  appId,
  week,
  memberId,
  disabled,
  className,
}) => {
  const t = useI18n<WeeklyScheduleAdminNamespace, WeeklyScheduleAdminKeys>(
    weeklyScheduleAdminNamespace,
  );
  const [openDialog, setOpenDialog] = React.useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const todayWeek = getWeekIdentifier(new Date());

  const repeatScheduleFormSchema = z.object({
    interval: z.coerce
      .number<number>()
      .int("Should be the integer value")
      .min(1, "Schedule must be repeated with at least one week interval"),
    maxWeek: z.coerce
      .number<number>()
      .min(todayWeek, "Should be past current week"),
    replaceExisting: z.coerce.boolean<boolean>().optional().nullable(),
  });

  type RepeatScheduleForm = z.infer<typeof repeatScheduleFormSchema>;

  const form = useForm<RepeatScheduleForm>({
    resolver: zodResolver(repeatScheduleFormSchema),
    mode: "all",
    values: {
      interval: 1,
      maxWeek: todayWeek + 3 * 52, /// ~ 3 year
      replaceExisting: false,
    },
  });

  const router = useRouter();

  const onConfirm = async () => {
    const data = repeatScheduleFormSchema.parse(form.getValues());
    try {
      setLoading(true);
      await toastPromise(
        repeatWeeklySchedule(
          appId,
          week,
          data.interval,
          data.maxWeek,
          data.replaceExisting ?? false,
          memberId,
        ),
        {
          success: t("dialogs.repeat.success", {
            week: getWeekDisplay(week),
            interval: data.interval,
            maxWeek: getWeekDisplay(data.maxWeek),
          }),
          error: t("statusText.request_error"),
        },
      );

      setOpenConfirmDialog(false);
      setOpenDialog(false);

      router.refresh();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: RepeatScheduleForm) => {
    setOpenConfirmDialog(true);
  };

  return (
    <Dialog onOpenChange={setOpenDialog} open={openDialog}>
      <DialogTrigger asChild>
        <Button variant="primary" disabled={disabled} className={className}>
          <Repeat2 /> {t("dialogs.repeat.repeatSchedule")}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex flex-col max-h-[100%] translate-y-[-100%]"
        overlayVariant="blur"
      >
        <DialogHeader>
          <DialogTitle className="w-full flex flex-row justify-between items-center mt-2">
            {t("dialogs.repeat.title")}
          </DialogTitle>
          <DialogDescription>
            {t("dialogs.repeat.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col gap-2 w-full">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full space-y-4 relative"
            >
              <FormField
                control={form.control}
                name="interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dialogs.repeat.repeatEvery")}</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput>
                          <Input
                            disabled={disabled}
                            placeholder="2"
                            type="number"
                            className={InputGroupInputClasses()}
                            {...field}
                          />
                        </InputGroupInput>
                        <InputGroupAddon className={InputGroupAddonClasses()}>
                          {t("dialogs.repeat.weeks")}
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dialogs.repeat.repeatUntil")}{" "}
                      <InfoTooltip>
                        {t("dialogs.repeat.repeatUntilTooltip")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <WeekSelector
                        minWeek={todayWeek}
                        initialWeek={field.value}
                        onWeekChange={(w) => {
                          field.onChange(w);
                          field.onBlur();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="replaceExisting"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-row items-center gap-2">
                      <Checkbox
                        id="confirm-overlap"
                        checked={field.value ?? false}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          field.onBlur();
                        }}
                      />
                      <FormLabel
                        htmlFor="confirm-overlap"
                        className="cursor-pointer"
                      >
                        {t("dialogs.repeat.replaceExisting")}
                      </FormLabel>
                    </div>
                    <FormDescription>
                      {t("dialogs.repeat.replaceExistingDescription")}
                    </FormDescription>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter className="!justify-between flex-row gap-2">
          <DialogClose asChild>
            <Button variant="secondary">{t("dialogs.repeat.close")}</Button>
          </DialogClose>
          <AlertDialog
            open={openConfirmDialog}
            onOpenChange={setOpenConfirmDialog}
          >
            <AlertDialogTrigger asChild>
              <Button variant="default" disabled={!form.formState.isValid}>
                {t("dialogs.repeat.copy")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("dialogs.repeat.confirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("dialogs.repeat.confirmDescription", {
                    week: getWeekDisplay(week),
                    interval: form.getValues("interval"),
                    maxWeek: getWeekDisplay(form.getValues("maxWeek")),
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("dialogs.repeat.cancel")}
                </AlertDialogCancel>
                <Button
                  disabled={loading}
                  className="flex flex-row gap-1 items-center"
                  onClick={() => onConfirm()}
                >
                  {loading && <Spinner />}{" "}
                  <span>{t("dialogs.repeat.copy")}</span>
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
