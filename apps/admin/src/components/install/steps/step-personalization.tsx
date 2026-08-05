"use client";

import { applyInstallPersonalization } from "@/components/install/actions";
import { useInstallWizard } from "@/components/install/install-wizard-context";
import { useI18n } from "@hacado/i18n/client";
import { fontsNames } from "@hacado/types";
import {
  Button,
  Combobox,
  type IComboboxItem,
  Label,
  Spinner,
  toast,
} from "@hacado/ui";
import { AssetSelectorInput, ColorPickerInput } from "@hacado/ui-admin";
import { getWebfontPreviewFilename } from "@hacado/utils";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const HEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

function FontPreviewThumb({ family }: { family: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        className="inline-block h-8 w-[168px] max-w-[min(168px,100%)] shrink-0 rounded border border-dashed border-muted-foreground/25 bg-muted/25"
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

// sort fonts to make selected font first
const fonts: (value?: string) => IComboboxItem[] = (value?: string) =>
  fontsNames
    .sort((a, b) => (a === value ? -1 : b === value ? 1 : a.localeCompare(b)))
    .map((font) => ({
      value: font,
      label: (
        <span className="flex min-w-0 items-center gap-2 py-0.5">
          <FontPreviewThumb family={font} />
          <span className="truncate text-base">{font}</span>
        </span>
      ),
      shortLabel: font,
    }));

const customFontSearch = (value?: string) => (search: string) => {
  const lower = search.toLocaleLowerCase();
  return fonts(value).filter((font) =>
    font.value.toLocaleLowerCase().includes(lower),
  );
};

export function StepPersonalization() {
  const t = useI18n("install");
  const router = useRouter();
  const { p, setP, setStep, refetch } = useInstallWizard();
  const [submitting, setSubmitting] = useState(false);

  const selectFontLabel = useMemo(
    () => t("wizard.personalization.selectFont"),
    [t],
  );

  const primaryFontValues = useMemo(
    () => fonts(p.primaryFont),
    [p.primaryFont],
  );
  const customPrimaryFontSearch = useMemo(
    () => customFontSearch(p.primaryFont),
    [p.primaryFont],
  );
  const secondaryFontValues = useMemo(
    () => fonts(p.secondaryFont),
    [p.secondaryFont],
  );
  const customSecondaryFontSearch = useMemo(
    () => customFontSearch(p.secondaryFont),
    [p.secondaryFont],
  );

  const onContinue = async () => {
    if (!HEX.test(p.primaryColorHex) || !HEX.test(p.secondaryColorHex)) {
      toast.error(t("wizard.personalization.invalidColor"));
      return;
    }

    setSubmitting(true);
    try {
      const r = await applyInstallPersonalization({
        primaryColorHex: p.primaryColorHex,
        secondaryColorHex: p.secondaryColorHex,
        primaryFont: p.primaryFont,
        secondaryFont: p.secondaryFont,
        installLogo: p.installLogo,
      });
      if (!r.ok) {
        if (r.code === "invalid_logo") {
          toast.error(t("wizard.personalization.invalidLogo"));
        } else {
          toast.error(t("wizard.personalization.saveError"));
        }
        return;
      }
      await refetch();
      router.refresh();
      setStep(3);
      setP((prev) => ({ ...prev, step: 3 }));
      toast.success(t("wizard.personalization.saved"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          {t("wizard.personalization.title")}
        </h2>
        <p className="text-base text-muted-foreground">
          {t("wizard.personalization.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("wizard.personalization.primaryColor")}</Label>
          <ColorPickerInput
            value={p.primaryColorHex}
            onChange={(v) =>
              setP((prev) => ({
                ...prev,
                primaryColorHex: v && HEX.test(v) ? v : prev.primaryColorHex,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>{t("wizard.personalization.secondaryColor")}</Label>
          <ColorPickerInput
            value={p.secondaryColorHex}
            onChange={(v) =>
              setP((prev) => ({
                ...prev,
                secondaryColorHex:
                  v && HEX.test(v) ? v : prev.secondaryColorHex,
              }))
            }
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("wizard.personalization.primaryFont")}</Label>
          <Combobox
            values={primaryFontValues}
            className="w-full"
            searchLabel={selectFontLabel}
            value={p.primaryFont}
            customSearch={customPrimaryFontSearch}
            onItemSelect={(value) => {
              if (value) {
                setP((prev) => ({ ...prev, primaryFont: value }));
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("wizard.personalization.secondaryFont")}</Label>
          <Combobox
            values={secondaryFontValues}
            className="w-full"
            searchLabel={selectFontLabel}
            value={p.secondaryFont}
            customSearch={customSecondaryFontSearch}
            onItemSelect={(value) => {
              if (value) {
                setP((prev) => ({ ...prev, secondaryFont: value }));
              }
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("wizard.personalization.logo")}</Label>
        <AssetSelectorInput
          value={p.installLogo || ""}
          onChange={(v) => setP((prev) => ({ ...prev, installLogo: v ?? "" }))}
          accept="image/*"
          placeholder={t("wizard.personalization.logoPlaceholder")}
        />
        {p.installLogo?.trim() ? (
          <div className="flex justify-center rounded-lg border bg-muted/30 p-4 relative">
            <img
              src={p.installLogo}
              alt={t("wizard.personalization.logoPreviewAlt")}
              className="max-h-36 max-w-full object-contain"
            />
            <Button
              variant="ghost-destructive"
              type="button"
              className="absolute top-2 right-2"
              onClick={() => setP((prev) => ({ ...prev, installLogo: null }))}
              title={t("wizard.personalization.removeLogo")}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        {t("wizard.personalization.editLater")}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            setStep(1);
            setP((prev) => ({ ...prev, step: 1 }));
          }}
        >
          {t("wizard.common.back")}
        </Button>
        <Button
          type="button"
          onClick={() => void onContinue()}
          disabled={submitting}
        >
          {submitting ? <Spinner /> : null}
          {t("wizard.common.continue")}
        </Button>
      </div>
    </div>
  );
}
