"use client";

import { useI18n } from "@hacado/i18n/client";
import { TitleSlugIdentityBar } from "@hacado/ui-admin/title-slug-identity-bar";
import { useFormContext } from "react-hook-form";

function getWebsiteHost(websiteUrl: string) {
  try {
    return new URL(websiteUrl).host;
  } catch {
    return websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

export function PageIdentityBar({
  loading,
  websiteUrl,
  isNewPage,
  onSlugManualChange,
  viewHref,
  viewLabel,
  layout = "default",
}: {
  loading: boolean;
  websiteUrl: string;
  isNewPage: boolean;
  onSlugManualChange: () => void;
  viewHref?: string;
  viewLabel?: string;
  layout?: "default" | "inline";
}) {
  const t = useI18n("admin");
  const form = useFormContext();
  const slug = form.watch("slug") as string | undefined;
  const host = getWebsiteHost(websiteUrl);
  const slugLocked = !isNewPage && slug === "home";

  return (
    <TitleSlugIdentityBar
      layout={layout}
      loading={loading}
      isNew={isNewPage}
      titleLabel={t("pages.form.pageName")}
      titlePlaceholder={t("pages.form.pageNamePlaceholder")}
      titleDescription={t("pages.form.pageNameTooltip")}
      slugLabel={t("pages.form.url")}
      slugPlaceholder={t("pages.form.slugGeneratedPlaceholder")}
      slugAutoHint={t("pages.form.slugAutoHint")}
      slugChangeWarning={t("pages.form.slugChangeWarning")}
      editUrlLabel={t("pages.form.editUrl")}
      slugLocked={slugLocked}
      onSlugManualChange={onSlugManualChange}
      viewHref={viewHref}
      viewLabel={viewLabel}
      slugPrefix={
        host ? (
          <>
            <span
              className="hidden min-w-0 truncate md:block"
              title={`${host}/`}
            >
              {host}/
            </span>
            <span className="md:hidden">/</span>
          </>
        ) : undefined
      }
    />
  );
}
