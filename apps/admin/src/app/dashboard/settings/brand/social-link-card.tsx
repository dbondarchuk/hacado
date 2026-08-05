import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@hacado/i18n/client";
import {
  SocialConfiguration,
  SocialLink,
  SocialLinkType,
  socialTypeLabels,
} from "@hacado/types";
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
  Combobox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
} from "@hacado/ui";
import { cva } from "class-variance-authority";
import { GripVertical, Trash } from "lucide-react";
import { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

const socialTypeValues = Object.entries(socialTypeLabels).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export type SocialLinkCardProps<
  TFieldValues extends FieldValues = SocialConfiguration,
> = {
  item: SocialLink & {
    fields_id: string;
  };
  name: FieldPath<TFieldValues>;
  form: UseFormReturn<TFieldValues>;
  disabled?: boolean;
  isOverlay?: boolean;
  remove: () => void;
};

export type SocialLinkDragType = "SocialLink";

export interface SocialLinkDragData {
  type: SocialLinkDragType;
  item: SocialLink;
}

export function SocialLinkCard<
  TFieldValues extends FieldValues = SocialConfiguration,
>({
  item,
  form,
  name,
  disabled,
  isOverlay,
  remove,
}: SocialLinkCardProps<TFieldValues>) {
  const t = useI18n("admin");
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
      type: "SocialLink",
      item,
    } satisfies SocialLinkDragData,
    attributes: {
      roleDescription: t("settings.social.form.card.roleDescription"),
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

  const type = form.getValues(`${name}.type` as FieldPath<TFieldValues>) as
    | SocialLinkType
    | undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })}
    >
      <CardHeader className="justify-between relative flex flex-row items-center border-b px-3 py-3 w-full">
        <div className="flex flex-row items-center gap-2">
          <Button
            type="button"
            variant={"ghost"}
            {...attributes}
            {...listeners}
            className="-ml-2 h-auto cursor-grab p-1 text-secondary-foreground/50"
          >
            <></>
            <span className="sr-only">
              {t("settings.social.form.card.moveOption")}
            </span>
            <GripVertical />
          </Button>
          <div
            className={cn(
              "w-full text-center flex flex-col text-sm font-semibold uppercase tracking-wide text-muted-foreground",
              !type && "text-destructive",
            )}
          >
            {type && socialTypeLabels[type]
              ? socialTypeLabels[type]
              : t("settings.social.form.card.invalidType")}
          </div>
        </div>
        <div className="flex flex-row gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={disabled}
                variant="ghost-destructive"
                size="icon"
                type="button"
                title={t("settings.social.form.card.remove")}
              >
                <Trash />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("settings.social.form.card.deleteConfirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("settings.social.form.card.deleteConfirmDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("settings.social.form.card.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction asChild variant="destructive">
                  <Button onClick={remove}>
                    {t("settings.social.form.card.delete")}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-6 pt-3 text-left relative grid md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${name}.type` as FieldPath<TFieldValues>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("settings.social.form.card.type")}</FormLabel>
              <FormControl>
                <Combobox
                  disabled={disabled}
                  className="flex w-full font-normal text-lg"
                  values={socialTypeValues}
                  searchLabel={t("settings.social.form.card.selectType")}
                  value={field.value as string}
                  onItemSelect={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${name}.url` as FieldPath<TFieldValues>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("settings.social.form.card.url")}
                <InfoTooltip>
                  {t("settings.social.form.card.urlTooltip")}
                </InfoTooltip>
              </FormLabel>
              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder="https://"
                  {...field}
                  value={field.value as string}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
