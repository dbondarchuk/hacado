"use client";

import { authClient } from "@/app/auth-client";
import { ServiceLimitUpgradeHint } from "@/components/admin/services/service-limit-upgrade-hint";
import {
  getInstallServiceOptionSnapshot,
  replaceServices,
} from "@/components/install/actions";
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
import {
  defaultDurationFromTemplate,
  defaultPriceFromTemplate,
  newInstallServiceClientId,
} from "@/components/install/constants";
import { useInstallWizard } from "@/components/install/install-wizard-context";
import type { InstallServiceDraftItem } from "@/components/install/types";
import { getSessionPlanTier } from "@/lib/billing/subscription-plan-access";
import { useI18n, type Language } from "@timelish/i18n/client";
import { PlateMarkdownEditor } from "@timelish/rte";
import {
  canCreateMoreServices,
  CurrencySymbolMap,
  type Currency,
} from "@timelish/types";
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
  DurationInput,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInputClasses,
  Label,
  Markdown,
  RadioGroup,
  RadioGroupItem,
  Spinner,
  toast,
} from "@timelish/ui";
import { durationToTime, formatAmountWithCurrency } from "@timelish/utils";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function ServiceTemplateDialog({
  open,
  onOpenChange,
  onPickTemplate,
  language,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPickTemplate: (draft: Omit<InstallServiceDraftItem, "clientId">) => void;
  language: Language;
  currency: Currency;
}) {
  const t = useI18n("install");
  const tAdmin = useI18n("admin");
  const tAny = t as any;
  const [search, setSearch] = useState("");
  const [pickCategory, setPickCategory] = useState<string | null>(null);
  const [pickProfession, setPickProfession] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setPickCategory(null);
    setPickProfession(null);
  }, [open]);

  const allProfessions = useMemo(() => {
    return INSTALL_CATEGORY_IDS.flatMap((categoryId) => {
      return getProfessionIds(categoryId).map((professionId) => ({
        categoryId,
        professionId,
      }));
    });
  }, []);

  const query = search.trim();
  const matchedProfessions = useMemo(() => {
    if (!query) return allProfessions;
    return allProfessions.filter((prof) =>
      professionMatchesSearch(tAny, prof.categoryId, prof.professionId, query),
    );
  }, [allProfessions, query, tAny]);

  const shownProfessions = useMemo(() => {
    if (!query) return allProfessions.slice(0, 4);
    return matchedProfessions.slice(0, 6);
  }, [allProfessions, matchedProfessions, query]);

  const totalMatches = matchedProfessions.length;

  const professionDef =
    pickCategory && pickProfession
      ? getCatalogProfession(pickCategory, pickProfession)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("wizard.service.addDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("wizard.service.addTemplateHint")}
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "space-y-2",
            !!pickProfession && !!pickCategory && "hidden",
          )}
        >
          <Label htmlFor="install-template-search">
            {t("wizard.service.searchProfessions")}
          </Label>
          <Input
            id="install-template-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("wizard.service.searchPlaceholder")}
          />
        </div>

        {!pickProfession || !pickCategory ? (
          <div className="space-y-2">
            <Label>{t("wizard.service.professionLabel")}</Label>
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
                      {tAny(
                        catalogProfessionLabelKey(
                          prof.categoryId,
                          prof.professionId,
                        ),
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
                            {tAny(catalogTagLabelKey(tag))}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {query && totalMatches === 0 ? (
              <p className="text-base text-muted-foreground">
                {t("wizard.service.noProfessionsMatch")}
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
                title={t("wizard.service.backToProfessions")}
                onClick={() => {
                  setPickCategory(null);
                  setPickProfession(null);
                }}
              >
                <ArrowLeft />
              </Button>
              <span className="text-base text-muted-foreground">
                {tAny(catalogProfessionLabelKey(pickCategory, pickProfession))}
              </span>
            </div>
            <Label>{t("wizard.service.pickMain")}</Label>
            <div className="flex max-h-[min(40vh,16rem)] flex-col gap-2 overflow-y-auto">
              {(professionDef?.services ?? []).map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  className="flex flex-col gap-1 rounded-lg border p-3 text-left hover:border-muted-foreground/30"
                  onClick={() => {
                    const name = tAny(
                      catalogServiceNameKey(
                        pickCategory,
                        pickProfession,
                        svc.id,
                      ),
                    ).slice(0, 256);
                    const description = tAny(
                      catalogServiceDescriptionKey(
                        pickCategory,
                        pickProfession,
                        svc.id,
                      ),
                    ).slice(0, 1024);
                    onPickTemplate({
                      name,
                      description,
                      duration: defaultDurationFromTemplate(svc.durations),
                      price: defaultPriceFromTemplate(svc.prices ?? []),
                      pricePerHour: "",
                      priceType: "fixed",
                      source: "template",
                      businessCategory: pickCategory,
                      professionId: pickProfession,
                      serviceTemplateId: svc.id,
                    });
                    onOpenChange(false);
                    setPickCategory(null);
                    setPickProfession(null);
                    setSearch("");
                  }}
                >
                  <span className="font-medium">
                    {tAny(
                      catalogServiceNameKey(
                        pickCategory,
                        pickProfession,
                        svc.id,
                      ),
                    )}
                  </span>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground">
                    <Markdown
                      prose="simple"
                      markdown={tAny(
                        catalogServiceDescriptionKey(
                          pickCategory,
                          pickProfession,
                          svc.id,
                        ),
                      )}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {tAdmin(
                      "common.timeDuration",
                      durationToTime(svc.durations[0] ?? 60),
                    )}
                    {svc.prices?.length
                      ? ` · ${formatAmountWithCurrency(
                          Math.min(...svc.prices),
                          language,
                          currency,
                        )}`
                      : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("wizard.common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StepService() {
  const t = useI18n("install");
  const { p, setP, setStep } = useInstallWizard();
  const { data: session } = authClient.useSession();
  const planTier = getSessionPlanTier({
    user: (session?.user ?? {}) as Parameters<
      typeof getSessionPlanTier
    >[0]["user"],
  });
  const canAddMore = canCreateMoreServices(planTier, p.installServices.length);
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const hydratedOptionIds = useRef(new Set<string>());

  const currencySymbol = CurrencySymbolMap[p.currency] || "$";

  useEffect(() => {
    for (const row of p.installServices) {
      if (!row.optionId) continue;
      if (row.name.trim().length >= 2 && row.description.trim().length >= 2) {
        continue;
      }
      const oid = row.optionId;
      if (hydratedOptionIds.current.has(oid)) continue;
      hydratedOptionIds.current.add(oid);
      void (async () => {
        const res = await getInstallServiceOptionSnapshot(oid);
        if (!res.ok) return;
        setP((prev) => ({
          ...prev,
          installServices: prev.installServices.map((r) =>
            r.optionId === oid
              ? {
                  ...r,
                  name: res.data.name,
                  description: res.data.description,
                  duration: res.data.duration,
                  priceType: res.data.priceType,
                  price:
                    typeof res.data.price === "number"
                      ? String(res.data.price)
                      : r.price,
                  pricePerHour:
                    typeof res.data.pricePerHour === "number"
                      ? String(res.data.pricePerHour)
                      : r.pricePerHour,
                }
              : r,
          ),
        }));
      })();
    }
  }, [p.installServices, setP]);

  const updateRow = (
    clientId: string,
    patch: Partial<InstallServiceDraftItem>,
  ) => {
    setP((prev) => ({
      ...prev,
      installServices: prev.installServices.map((r) =>
        r.clientId === clientId ? { ...r, ...patch } : r,
      ),
    }));
  };

  const removeRow = (clientId: string) => {
    setP((prev) => ({
      ...prev,
      installServices: prev.installServices.filter(
        (r) => r.clientId !== clientId,
      ),
    }));
  };

  const addCustomRow = () => {
    if (!canAddMore) return;
    setP((prev) => ({
      ...prev,
      installServices: [
        ...prev.installServices,
        {
          clientId: newInstallServiceClientId(),
          name: "",
          description: "",
          duration: 60,
          price: "",
          pricePerHour: "",
          priceType: "fixed",
          source: "custom",
        },
      ],
    }));
    setAddDialogOpen(false);
  };

  const onSubmitServices = async () => {
    if (!p.installServices.length) {
      toast.error(t("wizard.errors.serviceNeedOne"));
      return;
    }

    const rows = p.installServices.map((r) => {
      const priceNum = r.price.trim() ? Number(r.price) : undefined;
      const pphNum = r.pricePerHour.trim() ? Number(r.pricePerHour) : undefined;
      return {
        priceType: r.priceType,
        name: r.name.trim().slice(0, 256),
        description: r.description.trim().slice(0, 1024),
        duration: Math.max(1, Math.floor(r.duration)),
        price:
          r.priceType === "fixed" &&
          priceNum !== undefined &&
          !Number.isNaN(priceNum) &&
          priceNum >= 1
            ? priceNum
            : undefined,
        pricePerHour:
          r.priceType === "per_hour" &&
          pphNum !== undefined &&
          !Number.isNaN(pphNum) &&
          pphNum >= 1
            ? pphNum
            : undefined,
      };
    });

    for (const r of rows) {
      if (r.name.length < 2 || r.description.length < 2) {
        toast.error(t("wizard.errors.service"));
        return;
      }
    }

    const nameKeys = rows.map((r) => r.name.toLowerCase());
    if (new Set(nameKeys).size !== nameKeys.length) {
      toast.error(t("wizard.errors.serviceDuplicateName"));
      return;
    }

    setServiceSubmitting(true);
    try {
      const sr = await replaceServices(rows);
      if (!sr.ok) {
        if (sr.code === "duplicate_name") {
          toast.error(t("wizard.errors.serviceDuplicateName"));
        } else if (sr.code === "service_limit_reached") {
          toast.error(t("wizard.errors.serviceLimitReached"));
        } else {
          toast.error(t("wizard.errors.service"));
        }
        return;
      }

      setStep(4);
      setP((prev) => ({
        ...prev,
        step: 4,
        serviceOptionId: sr.optionIds[0],
        installServices: prev.installServices.map((row, i) => ({
          ...row,
          optionId: sr.optionIds[i],
        })),
      }));

      toast.success(t("wizard.service.savedAll"));
    } finally {
      setServiceSubmitting(false);
    }
  };

  const continueDisabled =
    serviceSubmitting ||
    !p.installServices.length ||
    p.installServices.some(
      (r) =>
        r.duration < 1 ||
        r.name.trim().length < 2 ||
        r.description.trim().length < 2,
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {t("wizard.service.title")}
          </h2>
          <p className="text-base text-muted-foreground">
            {t("wizard.service.subtitle")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canAddMore}
              onClick={addCustomRow}
            >
              {t("wizard.service.addCustom")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!canAddMore}
              aria-label={t("wizard.service.addFromTemplate")}
              onClick={() => canAddMore && setAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {!canAddMore ? <ServiceLimitUpgradeHint showLink={false} /> : null}

      <ServiceTemplateDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        language={p.language}
        currency={p.currency}
        onPickTemplate={(draft) => {
          if (!canAddMore) return;
          setP((prev) => ({
            ...prev,
            installServices: [
              ...prev.installServices,
              {
                clientId: newInstallServiceClientId(),
                ...draft,
              },
            ],
          }));
        }}
      />

      {!p.installServices.length ? (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-base text-muted-foreground">
          {t("wizard.service.emptyList")}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              disabled={!canAddMore}
              onClick={() => canAddMore && setAddDialogOpen(true)}
            >
              {t("wizard.service.addFromTemplate")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!canAddMore}
              onClick={addCustomRow}
            >
              {t("wizard.service.addCustom")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {p.installServices.map((row) => (
            <div
              key={row.clientId}
              className="space-y-3 rounded-lg border bg-background/50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {row.source === "template" ? (
                    <Badge variant="secondary">
                      {t("wizard.service.fromCatalogBadge")}
                    </Badge>
                  ) : null}
                  <span className="text-base font-medium">{row.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  aria-label={t("wizard.service.removeService")}
                  onClick={() => removeRow(row.clientId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>{t("wizard.service.serviceNameLabel")}</Label>
                <Input
                  value={row.name}
                  onChange={(e) =>
                    updateRow(row.clientId, { name: e.target.value })
                  }
                  placeholder={t("wizard.service.serviceNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("wizard.service.serviceDescriptionLabel")}</Label>
                <PlateMarkdownEditor
                  value={row.description}
                  onChange={(v) => updateRow(row.clientId, { description: v })}
                  placeholder={t(
                    "wizard.service.serviceDescriptionPlaceholder",
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("wizard.service.priceType")}</Label>
                <RadioGroup
                  value={row.priceType}
                  onValueChange={(v) =>
                    updateRow(row.clientId, {
                      priceType: v as InstallServiceDraftItem["priceType"],
                      ...(v === "fixed" ? { pricePerHour: "" } : { price: "" }),
                    })
                  }
                  className="flex flex-col gap-2 sm:flex-row sm:gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="fixed"
                      id={`${row.clientId}-price-fixed`}
                    />
                    <Label
                      htmlFor={`${row.clientId}-price-fixed`}
                      className="cursor-pointer font-normal"
                    >
                      {t("wizard.service.priceTypeFixed")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="per_hour"
                      id={`${row.clientId}-price-hour`}
                    />
                    <Label
                      htmlFor={`${row.clientId}-price-hour`}
                      className="cursor-pointer font-normal"
                    >
                      {t("wizard.service.priceTypePerHour")}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("wizard.service.duration")}</Label>
                  <DurationInput
                    value={row.duration}
                    onChange={(value) =>
                      updateRow(row.clientId, { duration: value! })
                    }
                  />
                  {row.priceType === "per_hour" ? (
                    <p className="text-sm text-muted-foreground">
                      {t("wizard.service.perHourDurationHint")}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>
                    {row.priceType === "fixed"
                      ? t("wizard.service.priceTotal")
                      : t("wizard.service.pricePerHourLabel")}
                  </Label>
                  <InputGroup>
                    <InputGroupAddon
                      className={InputGroupAddonClasses({
                        variant: "prefix",
                      })}
                    >
                      {currencySymbol}
                    </InputGroupAddon>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder={t("wizard.service.priceOptional")}
                      className={InputGroupInputClasses({
                        variant: "prefix",
                      })}
                      value={
                        row.priceType === "fixed" ? row.price : row.pricePerHour
                      }
                      onChange={(e) =>
                        updateRow(
                          row.clientId,
                          row.priceType === "fixed"
                            ? { price: e.target.value }
                            : { pricePerHour: e.target.value },
                        )
                      }
                    />
                  </InputGroup>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {t("wizard.service.editLater")}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            setStep(2);
            setP((prev) => ({ ...prev, step: 2 }));
          }}
        >
          {t("wizard.common.back")}
        </Button>
        <Button
          type="button"
          onClick={() => void onSubmitServices()}
          disabled={continueDisabled}
        >
          {serviceSubmitting ? <Spinner /> : null}
          {t("wizard.common.continue")}
        </Button>
      </div>
    </div>
  );
}
