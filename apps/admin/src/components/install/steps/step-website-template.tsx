"use client";

import {
  applyInstallPackStyling,
  saveInstallPreferences,
} from "@/components/install/actions";
import { useInstallWizard } from "@/components/install/install-wizard-context";
import { useI18n } from "@hacado/i18n/client";
import {
  layoutFullPagePreviewPath,
  layoutTemplatePreviewPath,
  suggestWebsitePackId,
  WEBSITE_PACK_IDS,
  WEBSITE_PACKS,
  type PageLayoutKind,
  type WebsitePackId,
} from "@hacado/page-builder/templates";
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
  toast,
} from "@hacado/ui";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const PREVIEW_KINDS: PageLayoutKind[] = [
  "home",
  "booking",
  "service",
  "about",
  "terms",
];

function isWebsitePackId(value: string): value is WebsitePackId {
  return (WEBSITE_PACK_IDS as string[]).includes(value);
}

function builderKey(fullKey: string) {
  return (
    fullKey.startsWith("builder.") ? fullKey.slice("builder.".length) : fullKey
  ) as any;
}

function packCategoryLabelKey(packId: WebsitePackId) {
  return WEBSITE_PACKS[packId].category;
}

function PackThumbnail({ packId }: { packId: WebsitePackId }) {
  const fullSrc = layoutFullPagePreviewPath(`${packId}-home.png`);
  const fallbackSrc = layoutTemplatePreviewPath(`${packId}-home.png`);
  const [src, setSrc] = useState(fullSrc);

  useEffect(() => {
    setSrc(fullSrc);
  }, [fullSrc]);

  return (
    <div className="aspect-[16/10] w-full bg-muted relative">
      <Image
        src={src}
        alt={`${packId} preview`}
        className="aspect-[16/10] w-full object-cover object-top"
        fill
        onError={() => {
          if (src !== fallbackSrc) setSrc(fallbackSrc);
        }}
      />
    </div>
  );
}

function InstallWebsitePreviewDialog({
  packId,
  open,
  onOpenChange,
  onSelect,
}: {
  packId: WebsitePackId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: () => void;
}) {
  const t = useI18n("install");
  const tBuilder = useI18n("builder");
  const [kind, setKind] = useState<PageLayoutKind>("home");
  const pack = WEBSITE_PACKS[packId];
  const [iframeLoading, setIframeLoading] = useState(true);

  const previewSrc = `/install/preview/${packId}/${kind}`;

  useEffect(() => {
    setIframeLoading(true);
  }, [previewSrc]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[min(92vh,80rem)] w-[min(96vw,96rem)] max-w-none grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-3 overflow-hidden p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle>
            {tBuilder(builderKey(pack.displayName))} -{" "}
            {t("wizard.website.preview")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {tBuilder(
              builderKey(
                `builder.pageBuilder.pageTemplates.packs.${packId}.tagline`,
              ),
            )}
          </p>
        </DialogHeader>
        <div className="flex flex-wrap gap-1">
          {PREVIEW_KINDS.map((pageKind) => (
            <Button
              key={pageKind}
              type="button"
              size="sm"
              variant={kind === pageKind ? "default" : "outline"}
              onClick={() => setKind(pageKind)}
            >
              {t(`wizard.website.previewPages.${pageKind}`)}
            </Button>
          ))}
        </div>
        <div className="relative min-h-0 w-full overflow-hidden rounded-lg border bg-muted/30">
          {iframeLoading ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80">
              <Spinner className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">
                {t("wizard.website.loadingPreview")}
              </p>
            </div>
          ) : null}
          <div className="absolute inset-0 overflow-hidden">
            <iframe
              key={previewSrc}
              title={`${packId}-${kind}`}
              src={previewSrc}
              className="h-full w-full border-0 bg-background"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => setIframeLoading(false)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {t("wizard.website.closePreview")}
          </Button>
          <Button type="button" onClick={onSelect}>
            {t("wizard.website.selectDesign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StepWebsiteTemplate() {
  const t = useI18n("install");
  const tBuilder = useI18n("builder");
  const router = useRouter();
  const { p, setP, setStep, refetch } = useInstallWizard();

  const suggestedPackId = useMemo(() => {
    if (isWebsitePackId(p.catalogPreferredPackId)) {
      return p.catalogPreferredPackId;
    }

    const fromServices = p.installServices.find(
      (s) => s.businessCategory,
    )?.businessCategory;
    return suggestWebsitePackId(fromServices || p.businessCategory);
  }, [p.businessCategory, p.catalogPreferredPackId, p.installServices]);

  const selectedPackId: WebsitePackId | null = isWebsitePackId(p.websitePackId)
    ? p.websitePackId
    : suggestedPackId;

  const [previewPackId, setPreviewPackId] = useState<WebsitePackId | null>(
    null,
  );
  const [continuing, setContinuing] = useState(false);

  const packsByCategory = useMemo(() => {
    const map = new Map<string, WebsitePackId[]>();
    for (const id of WEBSITE_PACK_IDS) {
      const key = packCategoryLabelKey(id);
      const list = map.get(key) ?? [];
      list.push(id);
      map.set(key, list);
    }
    return [...map.entries()];
  }, []);

  const selectPack = (packId: WebsitePackId) => {
    setP((prev) => ({ ...prev, websitePackId: packId }));
  };

  const onContinue = async () => {
    const packId = isWebsitePackId(p.websitePackId)
      ? p.websitePackId
      : selectedPackId;
    if (!packId) {
      toast.error(t("wizard.website.selectRequired"));
      return;
    }

    selectPack(packId);
    setContinuing(true);
    try {
      const r = await saveInstallPreferences({
        inviteMode: p.inviteMode,
        inviteCalendarWriterAppId: p.inviteCalendarWriterAppId,
        optCustomerEmailNotifications: p.optCustomerEmailNotifications,
        optCustomerPackageEmailNotifications:
          p.optCustomerPackageEmailNotifications,
        optCustomerTextMessageNotifications:
          p.optCustomerTextMessageNotifications,
        optAppointmentNotifications: p.optAppointmentNotifications,
        optWaitlist: p.optWaitlist,
        optWaitlistNotifications: p.optWaitlistNotifications,
        optBlog: p.optBlog,
        optForms: p.optForms,
        optGiftCardStudio: p.optGiftCardStudio,
        optMyCabinet: p.optMyCabinet,
        allowCancelReschedule: p.allowCancelReschedule,
        autoConfirmBookings: p.autoConfirmBookings,
        acceptPayments: p.acceptPayments,
        depositEnabled: p.depositEnabled,
        depositPercent: p.depositPercent,
        websitePackId: packId,
      });
      if (!r.ok) {
        toast.error(t("wizard.integrations.saveError"));
        return;
      }

      const styling = await applyInstallPackStyling(packId);
      if (!styling.ok) {
        toast.error(t("wizard.website.stylingError"));
        return;
      }

      await refetch();
      router.refresh();
      setStep(8);
      setP((prev) => ({
        ...prev,
        websitePackId: packId,
        primaryColorHex: styling.primaryColorHex,
        secondaryColorHex: styling.secondaryColorHex,
        primaryFont: styling.primaryFont,
        secondaryFont: styling.secondaryFont,
        step: 8,
      }));
    } finally {
      setContinuing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("wizard.website.title")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {t("wizard.website.subtitle")}
        </p>
      </div>

      {suggestedPackId ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {t("wizard.website.suggested")}
          </h2>
          <button
            type="button"
            onClick={() => setPreviewPackId(suggestedPackId)}
            className={cn(
              "group w-full overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:border-primary/40",
              selectedPackId === suggestedPackId && "ring-2 ring-primary",
            )}
          >
            <PackThumbnail packId={suggestedPackId} />
            <div className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="text-lg font-semibold">
                  {tBuilder(
                    builderKey(WEBSITE_PACKS[suggestedPackId].displayName),
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tBuilder(
                    builderKey(
                      `builder.pageBuilder.pageTemplates.packs.${suggestedPackId}.tagline`,
                    ),
                  )}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  selectPack(suggestedPackId);
                }}
              >
                {t("wizard.website.useThisDesign")}
              </Button>
            </div>
          </button>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t("wizard.website.browseAll")}
        </h2>
        {packsByCategory.map(([categoryKey, packIds]) => (
          <div key={categoryKey} className="space-y-3">
            <h3 className="text-base font-medium">
              {tBuilder(builderKey(categoryKey))}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {packIds.map((packId) => (
                <button
                  key={packId}
                  type="button"
                  onClick={() => setPreviewPackId(packId)}
                  className={cn(
                    "overflow-hidden rounded-lg border bg-card text-left transition hover:border-primary/40",
                    selectedPackId === packId && "ring-2 ring-primary",
                  )}
                >
                  <PackThumbnail packId={packId} />
                  <div className="space-y-1 p-3">
                    <p className="font-medium">
                      {tBuilder(builderKey(WEBSITE_PACKS[packId].displayName))}
                    </p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {tBuilder(
                        builderKey(
                          `builder.pageBuilder.pageTemplates.packs.${packId}.tagline`,
                        ),
                      )}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => setStep(6)}>
          {t("wizard.common.back")}
        </Button>
        <Button
          type="button"
          disabled={continuing || !selectedPackId}
          onClick={onContinue}
        >
          {continuing ? <Spinner /> : null}
          {t("wizard.website.finish")}
        </Button>
      </div>

      {previewPackId ? (
        <InstallWebsitePreviewDialog
          packId={previewPackId}
          open
          onOpenChange={(open) => {
            if (!open) setPreviewPackId(null);
          }}
          onSelect={() => {
            selectPack(previewPackId);
            setPreviewPackId(null);
          }}
        />
      ) : null}
    </div>
  );
}
