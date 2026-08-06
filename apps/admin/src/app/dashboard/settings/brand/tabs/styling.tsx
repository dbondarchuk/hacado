"use client";

import { ResourcesCard } from "@/components/admin/resource/resources-card";
import { useFormatter, useI18n } from "@hacado/i18n/client";
import {
  colors as colorOverrides,
  ColorOverrideSchema,
  colorsLabels,
  fontsNames,
  fontsOptions,
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
  CardTitle,
  cn,
  Combobox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IComboboxItem,
  InfoTooltip,
} from "@hacado/ui";
import { ColorPickerInput, NonSortable } from "@hacado/ui-admin";
import { getWebfontPreviewFilename } from "@hacado/utils";
import { Trash } from "lucide-react";
import React from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { SiteSettingsFormValues } from "../site-settings-schema";

function FontPreviewThumb({ family }: { family: string }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <span
        className="inline-block h-8 w-[168px] max-w-[min(168px,100%)] shrink-0 rounded border border-muted-foreground/25 bg-muted/25"
        aria-hidden
      />
    );
  }
  return (
    <img
      src={`/fonts/preview/${getWebfontPreviewFilename(family)}`}
      alt=""
      width={168}
      height={32}
      className="h-8 max-w-[168px] shrink-0 rounded border border-border/50 bg-zinc-50 object-contain object-left dark:bg-zinc-950"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

const FontLabel = ({ font }: { font: string }) => {
  const t = useI18n("admin");
  const formatter = useFormatter();

  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex min-w-0 items-center gap-2 py-0.5">
        <FontPreviewThumb family={font} />
        <span className="truncate text-base">{font}</span>
      </span>
      <span className="text-sm text-muted-foreground">
        {t("appearance.styling.form.fonts.variants.label", {
          variants: formatter.list(
            fontsOptions[font].variants.map((variant) =>
              t.has(`appearance.styling.form.fonts.variants.${variant}` as any)
                ? t(`appearance.styling.form.fonts.variants.${variant}` as any)
                : variant,
            ),
          ),
        })}
      </span>
      <span className="text-sm text-muted-foreground">
        {t("appearance.styling.form.fonts.subsets.label", {
          subsets: formatter.list(
            fontsOptions[font].subsets.map((subset) =>
              t.has(`appearance.styling.form.fonts.subsets.${subset}` as any)
                ? t(`appearance.styling.form.fonts.subsets.${subset}` as any)
                : subset,
            ),
          ),
        })}
      </span>
      <span className="text-sm text-muted-foreground">
        {t("appearance.styling.form.fonts.category.label", {
          category: t.has(
            `appearance.styling.form.fonts.category.${fontsOptions[font].category}` as any,
          )
            ? t(
                `appearance.styling.form.fonts.category.${fontsOptions[font].category}` as any,
              )
            : fontsOptions[font].category,
        })}
      </span>
      <a
        className="text-base text-muted-foreground underline"
        target="_blank"
        rel="noreferrer"
        href={`https://fonts.google.com/specimen/${font.replace(" ", "+")}`}
      >
        {t("appearance.styling.form.fonts.seeOnGoogleFonts")}
      </a>
    </div>
  );
};

const fontTransform = (font: string) => ({
  value: font,
  shortLabel: font,
  label: <FontLabel font={font} />,
});

const customFontSearch = (search: string) => {
  const lowerSearch = search.toLocaleLowerCase();
  return fontsNames
    .filter((font) => font.toLocaleLowerCase().indexOf(lowerSearch) >= 0)
    .map(fontTransform);
};

const fonts: IComboboxItem[] = fontsNames.map(fontTransform);

export const StylingTab: React.FC<{
  form: UseFormReturn<SiteSettingsFormValues>;
  loading: boolean;
}> = ({ form, loading }) => {
  const t = useI18n("admin");
  const {
    fields: colors,
    append: appendColor,
    remove: removeColor,
  } = useFieldArray({
    control: form.control,
    name: "styling.colors",
    keyName: "fields_id",
  });

  const colorsIds = React.useMemo(
    () => colors.map((c) => (c as ColorOverrideSchema).type),
    [colors],
  );

  const addNewColor = () => {
    appendColor({
      value: "",
    } as Partial<ColorOverrideSchema> as ColorOverrideSchema);
  };

  return (
    <div className="scroll-mt-24">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Fonts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="gap-2 flex flex-col md:grid md:grid-cols-3 md:gap-4">
              <FormField
                control={form.control}
                name="styling.fonts.primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("appearance.styling.form.primaryFont")}
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        allowClear
                        values={fonts}
                        disabled={loading}
                        className="flex w-full font-normal text-lg"
                        searchLabel={t("appearance.styling.form.selectFont")}
                        value={field.value}
                        onItemSelect={(value) => {
                          field.onChange(value);
                        }}
                        customSearch={customFontSearch}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="styling.fonts.secondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("appearance.styling.form.secondaryFont")}
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        values={fonts}
                        disabled={loading}
                        className="flex w-full font-normal text-lg"
                        searchLabel={t("appearance.styling.form.selectFont")}
                        value={field.value}
                        allowClear
                        onItemSelect={(value) => {
                          field.onChange(value);
                        }}
                        customSearch={customFontSearch}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="styling.fonts.tertiary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("appearance.styling.form.tertiaryFont")}
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        allowClear
                        values={fonts}
                        disabled={loading}
                        className="flex w-full font-normal text-lg"
                        searchLabel={t("appearance.styling.form.selectFont")}
                        value={field.value}
                        onItemSelect={(value) => {
                          field.onChange(value);
                        }}
                        customSearch={customFontSearch}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <NonSortable
          title={t("appearance.styling.form.colorOverrides")}
          ids={colorsIds}
          onAdd={addNewColor}
        >
          <div className="flex flex-grow flex-col gap-4">
            {colors.map((color, index) => {
              const rowType = form.watch(`styling.colors.${index}.type` as any);
              const allColors = (form.watch("styling.colors" as any) ||
                []) as ColorOverrideSchema[];
              const hasMultipleTypes =
                allColors.filter((c) => c.type === rowType).length > 1;

              return (
                <Card key={(color as any).fields_id}>
                  <CardHeader className="justify-between relative flex flex-row items-center border-b px-3 py-3 w-full">
                    <div
                      className={cn(
                        "flex flex-col text-sm font-semibold uppercase tracking-wide text-muted-foreground",
                        (!rowType || hasMultipleTypes) && "text-destructive",
                      )}
                    >
                      {(colorsLabels as any)[rowType] ||
                        t("appearance.styling.form.invalidField")}
                      {hasMultipleTypes && (
                        <span>
                          {t("appearance.styling.form.duplicateType")}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-row gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            disabled={loading}
                            variant="ghost-destructive"
                            size="icon"
                            type="button"
                            title={t("appearance.styling.form.remove")}
                          >
                            <Trash />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("appearance.styling.form.deleteConfirmTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t(
                                "appearance.styling.form.deleteConfirmDescription",
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t("appearance.styling.form.cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction asChild variant="destructive">
                              <Button onClick={() => removeColor(index)}>
                                {t("appearance.styling.form.delete")}
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
                      name={`styling.colors.${index}.type` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("appearance.styling.form.type")}
                          </FormLabel>
                          <FormControl>
                            <Combobox
                              disabled={loading}
                              className="flex w-full font-normal text-lg"
                              values={colorOverrides.map((c) => ({
                                value: c,
                                label: t(`appearance.styling.colors.${c}`),
                              }))}
                              searchLabel={t(
                                "appearance.styling.form.selectColorOverrideType",
                              )}
                              value={field.value}
                              onItemSelect={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`styling.colors.${index}.value` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("appearance.styling.form.color")}{" "}
                            <InfoTooltip>
                              {t("appearance.styling.form.colorTooltip")}
                            </InfoTooltip>
                          </FormLabel>
                          <FormControl>
                            <ColorPickerInput
                              disabled={loading}
                              placeholder="#ffffff"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </NonSortable>

        <ResourcesCard
          type="css"
          form={form}
          name={"styling.css" as any}
          title={t("appearance.styling.form.additionalCss")}
          loading={loading}
        />
      </div>
    </div>
  );
};
