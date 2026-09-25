"use client";

import { checkOrganizationSlug } from "@/components/admin/auth/actions";
import {
  createWorkspace,
  type CreateWorkspaceInput,
} from "@/components/install/actions";
import { normalizeSlug } from "@/components/install/constants";
import { useInstallWizard } from "@/components/install/install-wizard-context";
import { getOrganizationSlugIssue } from "@/components/install/organization-slug";
import { languages, useI18n } from "@hacado/i18n/client";
import {
  businessIndustryDefinitions,
  catalogCategoryForIndustry,
  countryOptions,
  currencyOptions,
  type BusinessIndustry,
  type PostalAddress,
} from "@hacado/types";
import {
  Button,
  cn,
  Combobox,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInputClasses,
  Label,
  Spinner,
  toast,
  useDebounceCallback,
  type IComboboxItem,
} from "@hacado/ui";
import { AddressAutocomplete, AssetSelectorInput } from "@hacado/ui-admin";
import { getTimeZones } from "@vvo/tzdb";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const timeZones: IComboboxItem[] = getTimeZones().map((zone) => ({
  label: (
    <span className="overflow-hidden text-nowrap min-w-0 max-w-[var(--radix-popover-trigger-width)]">
      GMT{zone.currentTimeFormat}
    </span>
  ),
  value: zone.name,
}));

export function StepBusiness() {
  const t = useI18n("install");
  const tAdmin = useI18n("admin");
  const tUi = useI18n("ui");
  const router = useRouter();
  const {
    p,
    setP,
    setStep,
    slugCheck,
    setSlugCheck,
    refetch,
    organizationId,
    publicDomain,
  } = useInstallWizard();

  const [workspaceSubmitting, setWorkspaceSubmitting] = useState(false);

  const wrappedScheduleSlugCheck = useDebounceCallback(
    async (slug: string) => {
      if (getOrganizationSlugIssue(slug)) {
        setSlugCheck("idle");
        return;
      }
      setSlugCheck("checking");
      const ok = await checkOrganizationSlug(slug, organizationId);
      setSlugCheck(ok ? "available" : "taken");
    },
    [organizationId, setSlugCheck],
  );

  const preview =
    p.slug && publicDomain
      ? `https://${p.slug}.${publicDomain}`
      : `https://your-name.${publicDomain}`;

  const slugIssue = p.slug ? getOrganizationSlugIssue(p.slug) : "too_short";

  const validateStep1 = () => {
    if (!p.businessName.trim() || p.businessName.trim().length < 2)
      return false;
    if (!p.industry) return false;
    if (slugIssue || slugCheck !== "available") return false;
    if (!p.timeZone) return false;
    if (!p.language) return false;
    if (!p.country) return false;
    if (!p.currency) return false;
    return true;
  };

  const onSubmitWorkspace = async () => {
    if (!validateStep1()) {
      toast.error(t("wizard.errors.fixStep"));
      return;
    }

    setWorkspaceSubmitting(true);
    try {
      const body: CreateWorkspaceInput = {
        businessName: p.businessName.trim(),
        industry: p.industry as BusinessIndustry,
        address: {
          streetAddress: p.address.streetAddress?.trim() || undefined,
          addressLine2: p.address.addressLine2?.trim() || undefined,
          addressLocality: p.address.addressLocality?.trim() || undefined,
          addressRegion: p.address.addressRegion?.trim() || undefined,
          postalCode: p.address.postalCode?.trim() || undefined,
        },
        slug: p.slug,
        timeZone: p.timeZone,
        language: p.language,
        country: p.country,
        currency: p.currency,
        installLogo: p.installLogo?.trim() || null,
      };
      const result = await createWorkspace(body);
      if (!result.ok) {
        if (result.code === "slug_taken") {
          toast.error(t("wizard.errors.slugTaken"));
        } else if (result.code === "slug_reserved") {
          toast.error(t("wizard.errors.slugReserved"));
        } else if (result.code === "slug_invalid") {
          toast.error(t("wizard.errors.slugInvalid"));
        } else {
          toast.error(t("wizard.errors.workspace"));
        }
        return;
      }
      await refetch();
      router.refresh();
      setStep(3);
      setP((prev) => ({ ...prev, step: 3 }));
      toast.success(
        result.updated
          ? t("wizard.business.updated")
          : t("wizard.business.saved"),
      );
    } finally {
      setWorkspaceSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold">{t("wizard.business.title")}</h2>
        <p className="text-base text-muted-foreground">
          {t("wizard.business.subtitle")}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>{t("wizard.business.name")}</Label>
          <Input
            value={p.businessName}
            onChange={(e) => {
              const businessName = e.target.value;
              const derivedSlug = normalizeSlug(businessName);
              const slugStillSynced =
                !p.slug || p.slug === normalizeSlug(p.businessName);
              const slug = slugStillSynced ? derivedSlug : p.slug;
              setP((prev) => ({ ...prev, businessName, slug }));
              if (slugStillSynced) {
                wrappedScheduleSlugCheck(slug);
              }
            }}
            placeholder={t("wizard.business.namePlaceholder")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("wizard.business.logo")}</Label>
          <AssetSelectorInput
            value={p.installLogo || ""}
            onChange={(v) =>
              setP((prev) => ({ ...prev, installLogo: v ?? "" }))
            }
            accept="image/*"
            placeholder={t("wizard.business.logoPlaceholder")}
          />
          {p.installLogo?.trim() ? (
            <div className="flex justify-center rounded-lg border bg-muted/30 p-4 relative">
              <img
                src={p.installLogo}
                alt={t("wizard.business.logoPreviewAlt")}
                className="max-h-36 max-w-full object-contain"
              />
              <Button
                variant="ghost-destructive"
                type="button"
                className="absolute top-2 right-2"
                onClick={() => setP((prev) => ({ ...prev, installLogo: null }))}
                title={t("wizard.business.removeLogo")}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("wizard.business.slug")}</Label>
          <InputGroup>
            <Input
              value={p.slug}
              onChange={(e) => {
                const v = normalizeSlug(e.target.value);
                setP((prev) => ({ ...prev, slug: v }));
                wrappedScheduleSlugCheck(v);
              }}
              className={InputGroupInputClasses()}
              placeholder={t("wizard.business.slugPlaceholder")}
            />
            <InputGroupAddon
              className={cn(
                InputGroupAddonClasses({ variant: "suffix" }),
                "text-muted-foreground",
              )}
            >
              .{publicDomain}
            </InputGroupAddon>
          </InputGroup>
          <p className="text-sm text-muted-foreground">
            {t("wizard.business.slugHint", { url: preview })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("wizard.business.slugHelp")}
          </p>
          {slugIssue === "too_short" && p.slug ? (
            <p className="text-sm text-destructive">
              {t("wizard.business.slugTooShort")}
            </p>
          ) : null}
          {slugIssue === "reserved" ? (
            <p className="text-sm text-destructive">
              {t("wizard.business.slugReserved")}
            </p>
          ) : null}
          {slugIssue === "invalid" ? (
            <p className="text-sm text-destructive">
              {t("wizard.errors.slugInvalid")}
            </p>
          ) : null}
          {!slugIssue && slugCheck === "checking" ? (
            <p className="text-sm text-muted-foreground">
              {t("wizard.business.slugChecking")}
            </p>
          ) : null}
          {!slugIssue && slugCheck === "available" ? (
            <p className="text-sm text-primary">
              {t("wizard.business.slugAvailable")}
            </p>
          ) : null}
          {!slugIssue && slugCheck === "taken" ? (
            <p className="text-sm text-destructive">
              {t("wizard.business.slugTaken")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("wizard.business.industry")}</Label>
          <Combobox
            useCategories
            value={p.industry || undefined}
            onItemSelect={(v) => {
              if (!v) return;
              const industry = v as BusinessIndustry;
              const catalogCategory = catalogCategoryForIndustry(industry);
              setP((prev) => ({
                ...prev,
                industry,
                ...(catalogCategory
                  ? { businessCategory: catalogCategory }
                  : {}),
              }));
            }}
            searchLabel={t("wizard.business.selectIndustry")}
            values={businessIndustryDefinitions.map((industry) => ({
              value: industry.id,
              label: tUi(`industry.${industry.id}`),
              category: tUi(`industry.category.${industry.category}`),
            }))}
          />
          <p className="text-sm text-muted-foreground">
            {t("wizard.business.industryHint")}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>{t("wizard.business.timeZone")}</Label>
            <Combobox
              values={timeZones}
              value={p.timeZone}
              onItemSelect={(v) => {
                if (!v) return;
                setP((prev) => ({ ...prev, timeZone: v }));
              }}
              searchLabel={t("wizard.business.selectTimeZone")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("wizard.business.language")}</Label>
            <Combobox
              value={p.language}
              onItemSelect={(v) =>
                setP((prev) => ({ ...prev, language: v as any }))
              }
              values={languages.map((l) => ({
                value: l,
                label: tAdmin(`common.labels.languages.${l}`),
              }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("wizard.business.country")}</Label>
            <Combobox
              value={p.country}
              onItemSelect={(v) =>
                setP((prev) => ({ ...prev, country: v as any }))
              }
              values={countryOptions.map((c) => ({
                value: c,
                label: tUi(`country.${c}`),
              }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("wizard.business.currency")}</Label>
            <Combobox
              value={p.currency}
              onItemSelect={(v) =>
                setP((prev) => ({ ...prev, currency: v as any }))
              }
              values={currencyOptions.map((c) => ({
                value: c,
                label: tUi(`currency.${c}`),
              }))}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("wizard.business.streetAddress")}</Label>
          <Input
            value={p.address.streetAddress ?? ""}
            onChange={(e) =>
              setP((prev) => ({
                ...prev,
                address: { ...prev.address, streetAddress: e.target.value },
              }))
            }
            placeholder={t("wizard.business.streetAddressPlaceholder")}
          />
          <div className="text-sm text-muted-foreground">
            <AddressAutocomplete
              countryBias={p.country}
              onSelect={(address: PostalAddress) => {
                setP((prev) => ({
                  ...prev,
                  address: {
                    streetAddress: address.streetAddress,
                    addressLine2: address.addressLine2,
                    addressLocality: address.addressLocality,
                    addressRegion: address.addressRegion,
                    postalCode: address.postalCode,
                    addressCountry: address.addressCountry,
                  },
                  ...(address.addressCountry
                    ? { country: address.addressCountry }
                    : {}),
                }));
              }}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>{t("wizard.business.addressLine2")}</Label>
            <Input
              value={p.address.addressLine2 ?? ""}
              onChange={(e) =>
                setP((prev) => ({
                  ...prev,
                  address: { ...prev.address, addressLine2: e.target.value },
                }))
              }
              placeholder={t("wizard.business.addressLine2Placeholder")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("wizard.business.addressLocality")}</Label>
            <Input
              value={p.address.addressLocality ?? ""}
              onChange={(e) =>
                setP((prev) => ({
                  ...prev,
                  address: {
                    ...prev.address,
                    addressLocality: e.target.value,
                  },
                }))
              }
              placeholder={t("wizard.business.addressLocalityPlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("wizard.business.addressRegion")}</Label>
            <Input
              value={p.address.addressRegion ?? ""}
              onChange={(e) =>
                setP((prev) => ({
                  ...prev,
                  address: { ...prev.address, addressRegion: e.target.value },
                }))
              }
              placeholder={t("wizard.business.addressRegionPlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("wizard.business.postalCode")}</Label>
            <Input
              value={p.address.postalCode ?? ""}
              onChange={(e) =>
                setP((prev) => ({
                  ...prev,
                  address: { ...prev.address, postalCode: e.target.value },
                }))
              }
              placeholder={t("wizard.business.postalCodePlaceholder")}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Button
          onClick={() => void onSubmitWorkspace()}
          disabled={!validateStep1() || workspaceSubmitting}
        >
          {workspaceSubmitting ? <Spinner /> : null}
          {t("wizard.common.continue")}
        </Button>
      </div>
    </div>
  );
}
