import { AvailableApps } from "@hacado/app-store";
import { useI18n } from "@hacado/i18n/client";
import { CalendarSourceConfiguration } from "@hacado/types";
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
} from "@hacado/ui";
import { AppSelector } from "@hacado/ui-admin";
import { Trash } from "lucide-react";
import React from "react";
import { UseFormReturn } from "react-hook-form";

export type CalendarSourceCardProps = {
  item: CalendarSourceConfiguration;
  name: string;
  form: UseFormReturn<any>;
  disabled?: boolean;
  excludeIds?: string[];
  remove: () => void;
  update: (newValue: CalendarSourceConfiguration) => void;
  clone: () => void;
};

export const CalendarSourceCard: React.FC<CalendarSourceCardProps> = ({
  item,
  name,
  form,
  disabled,
  excludeIds,
  remove,
  update,
  clone,
}) => {
  const t = useI18n("admin");
  const tAll = useI18n();
  const [appName, setAppName] = React.useState<string | undefined>();

  const appId = item.appId;
  const changeAppId = (value: typeof appId) => {
    const newValue = {
      ...form.getValues(name),
      appId: value,
    };
    update(newValue);
  };

  const appDisplayName = appName ? AvailableApps[appName].displayName : null;

  return (
    <Card>
      <CardHeader className="justify-between relative flex flex-row border-b px-3 py-3 w-full items-center">
        <div className="flex flex-row items-center gap-2">
          <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {appDisplayName ? (
              tAll.has(appDisplayName) ? (
                tAll(appDisplayName)
              ) : (
                appDisplayName
              )
            ) : (
              <span className="text-destructive">
                {t(
                  "users.profile.form.calendarSources.cards.calendarSource.noAppSelected",
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-row items-start md:pl-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={disabled}
                variant="ghost-destructive"
                type="button"
                title={t(
                  "users.profile.form.calendarSources.cards.calendarSource.remove",
                )}
              >
                <Trash />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t(
                    "users.profile.form.calendarSources.cards.calendarSource.deleteConfirmTitle",
                  )}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <p>
                    {t(
                      "users.profile.form.calendarSources.cards.calendarSource.deleteConfirmDescription",
                    )}
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t(
                    "users.profile.form.calendarSources.cards.calendarSource.cancel",
                  )}
                </AlertDialogCancel>
                <AlertDialogAction asChild variant="destructive">
                  <Button onClick={remove}>
                    {t(
                      "users.profile.form.calendarSources.cards.calendarSource.delete",
                    )}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="py-6 grid grid-cols-1 gap-2 w-full">
        <FormField
          control={form.control}
          name={`${name}.appId`}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>
                {t(
                  "users.profile.form.calendarSources.cards.calendarSource.app",
                )}{" "}
                <InfoTooltip>
                  {t(
                    "users.profile.form.calendarSources.cards.calendarSource.appTooltip",
                  )}
                </InfoTooltip>
              </FormLabel>

              <FormControl>
                <AppSelector
                  disabled={disabled}
                  className="w-full grid"
                  scope="calendar-read"
                  value={field.value}
                  onItemSelect={(value) => {
                    field.onChange(value);
                    changeAppId(value);
                  }}
                  setAppName={setAppName}
                  excludeIds={excludeIds}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
