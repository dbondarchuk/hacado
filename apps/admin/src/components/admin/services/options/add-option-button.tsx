"use client";

import { ServiceLimitUpgradeHint } from "@/components/admin/services/service-limit-upgrade-hint";
import {
  catalogProfessionLabelKey,
  catalogServiceDescriptionKey,
  catalogServiceNameKey,
  catalogTagLabelKey,
  getCatalogProfession,
  getProfessionIds,
  INSTALL_CATEGORY_IDS,
  professionMatchesSearch,
} from "@/components/install/catalog";
import { Language, useI18n, useLocale } from "@timelish/i18n/client";
import {
  Badge,
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Link,
  Markdown,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  useCurrency,
} from "@timelish/ui";
import { durationToTime, formatAmountWithCurrency } from "@timelish/utils";
import { ArrowLeft, ChevronDown, Lock, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

type SelectedTemplate = {
  categoryId: string;
  professionId: string;
  serviceId: string;
};

function serializeTemplateId(template: SelectedTemplate): string {
  return `${template.categoryId}:${template.professionId}:${template.serviceId}`;
}

export function AddOptionSplitButton({ canAddMore }: { canAddMore: boolean }) {
  const router = useRouter();
  const t = useI18n("admin");
  const tInstall = useI18n("install");
  const locale = useLocale() as Language;
  const currency = useCurrency();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [pickCategory, setPickCategory] = React.useState<string | null>(null);
  const [pickProfession, setPickProfession] = React.useState<string | null>(
    null,
  );
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<SelectedTemplate | null>(null);

  const allProfessions = React.useMemo(() => {
    return INSTALL_CATEGORY_IDS.flatMap((categoryId) =>
      getProfessionIds(categoryId).map((professionId) => ({
        categoryId,
        professionId,
      })),
    );
  }, []);

  const query = search.trim();
  const matchedProfessions = React.useMemo(() => {
    if (!query) return allProfessions;
    return allProfessions.filter((prof) =>
      professionMatchesSearch(
        tInstall as any,
        prof.categoryId,
        prof.professionId,
        query,
      ),
    );
  }, [allProfessions, query, tInstall]);

  const shownProfessions = React.useMemo(() => {
    if (!query) return allProfessions.slice(0, 8);
    return matchedProfessions.slice(0, 8);
  }, [allProfessions, matchedProfessions, query]);

  const professionDef =
    pickCategory && pickProfession
      ? getCatalogProfession(pickCategory, pickProfession)
      : null;

  const closeDialog = () => {
    setDialogOpen(false);
    setSearch("");
    setPickCategory(null);
    setPickProfession(null);
    setSelectedTemplate(null);
  };

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center">
          {canAddMore ? (
            <Link
              href="/dashboard/services/options/new"
              button
              variant="default"
              className="rounded-r-none border-r"
            >
              <Plus />
              {t("services.options.addNew")}
            </Link>
          ) : (
            <TooltipResponsive>
              <TooltipResponsiveTrigger>
                <span>
                  <Button
                    type="button"
                    variant="default"
                    className="rounded-r-none border-r"
                    disabled
                  >
                    <Lock />
                    {t("services.options.addNew")}
                  </Button>
                </span>
              </TooltipResponsiveTrigger>
              <TooltipResponsiveContent>
                <ServiceLimitUpgradeHint />
              </TooltipResponsiveContent>
            </TooltipResponsive>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="default"
                size="md"
                className="rounded-l-none px-2"
                disabled={!canAddMore}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!canAddMore}
                onClick={() => canAddMore && setDialogOpen(true)}
              >
                {t("services.options.addFromTemplate")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
            return;
          }
          setDialogOpen(open);
        }}
      >
        <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("services.options.addFromTemplateDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("services.options.addFromTemplateDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div
            className={cn(
              "space-y-2",
              !!pickProfession && !!pickCategory && "hidden",
            )}
          >
            <Label htmlFor="option-template-search">
              {tInstall("wizard.service.searchProfessions")}
            </Label>
            <Input
              id="option-template-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tInstall("wizard.service.searchPlaceholder")}
            />
          </div>

          {!pickProfession || !pickCategory ? (
            <div className="space-y-2">
              <Label>{tInstall("wizard.service.professionLabel")}</Label>
              <div className="grid max-h-[min(40vh,16rem)] gap-2 overflow-y-auto sm:grid-cols-2">
                {shownProfessions.map((prof) => {
                  const profDef = getCatalogProfession(
                    prof.categoryId,
                    prof.professionId,
                  );
                  return (
                    <button
                      key={`${prof.categoryId}:${prof.professionId}`}
                      type="button"
                      className="rounded-lg border p-3 text-left text-base transition-colors hover:border-muted-foreground/30"
                      onClick={() => {
                        setPickCategory(prof.categoryId);
                        setPickProfession(prof.professionId);
                      }}
                    >
                      <span className="font-medium">
                        {tInstall(
                          catalogProfessionLabelKey(
                            prof.categoryId,
                            prof.professionId,
                          ) as any,
                        )}
                      </span>
                      {profDef?.tags?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {profDef.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[12px] font-normal"
                            >
                              {tInstall(catalogTagLabelKey(tag) as any)}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {query && matchedProfessions.length === 0 ? (
                <p className="text-base text-muted-foreground">
                  {tInstall("wizard.service.noProfessionsMatch")}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  title={tInstall("wizard.service.backToProfessions")}
                  onClick={() => {
                    setPickCategory(null);
                    setPickProfession(null);
                    setSelectedTemplate(null);
                  }}
                >
                  <ArrowLeft />
                </Button>
                <span className="text-base text-muted-foreground">
                  {tInstall(
                    catalogProfessionLabelKey(
                      pickCategory,
                      pickProfession,
                    ) as any,
                  )}
                </span>
              </div>
              <Label>
                {t("services.options.addFromTemplateDialog.pickServiceLabel")}
              </Label>
              <div className="flex max-h-[min(40vh,16rem)] flex-col gap-2 overflow-y-auto">
                {(professionDef?.services ?? []).map((svc) => {
                  const selected =
                    selectedTemplate?.categoryId === pickCategory &&
                    selectedTemplate?.professionId === pickProfession &&
                    selectedTemplate?.serviceId === svc.id;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      className={`flex flex-col gap-1 rounded-lg border p-3 text-left hover:border-muted-foreground/30 ${
                        selected ? "border-primary ring-1 ring-primary" : ""
                      }`}
                      onClick={() =>
                        setSelectedTemplate({
                          categoryId: pickCategory,
                          professionId: pickProfession,
                          serviceId: svc.id,
                        })
                      }
                    >
                      <span className="font-medium">
                        {tInstall(
                          catalogServiceNameKey(
                            pickCategory,
                            pickProfession,
                            svc.id,
                          ) as any,
                        )}
                      </span>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground">
                        <Markdown
                          prose="simple"
                          markdown={tInstall(
                            catalogServiceDescriptionKey(
                              pickCategory,
                              pickProfession,
                              svc.id,
                            ) as any,
                          )}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {t(
                          "common.timeDuration",
                          durationToTime(svc.durations[0] ?? 60),
                        )}
                        {svc.prices?.length
                          ? ` · ${formatAmountWithCurrency(
                              Math.min(...svc.prices),
                              locale,
                              currency,
                            )}`
                          : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              {t("common.buttons.cancel")}
            </Button>
            <Button
              type="button"
              disabled={!selectedTemplate}
              onClick={() => {
                if (!selectedTemplate) return;
                const template = encodeURIComponent(
                  serializeTemplateId(selectedTemplate),
                );

                router.push(
                  `/dashboard/services/options/new?template=${template}`,
                );
              }}
            >
              {t("services.options.createFromTemplate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
