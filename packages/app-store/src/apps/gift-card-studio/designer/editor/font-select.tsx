"use client";

import { useI18n } from "@hacado/i18n/client";
import { Combobox, Label } from "@hacado/ui";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { EDITOR_FONTS } from "../lib/fonts";

interface FontSelectProps {
  value: string | undefined;
  onChange: (fontFamily: string) => void;
}

/**
 * A searchable font selector that renders each option in its own typeface.
 * Google Fonts are loaded lazily via a <link> injected when the dropdown opens.
 */
export function FontSelect({ value, onChange }: FontSelectProps) {
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

  return (
    <div className="space-y-1">
      <Label className="text-xs text-foreground">
        {t("designer.properties.fontFamily")}
      </Label>

      <Combobox
        values={EDITOR_FONTS.map((f) => ({
          value: f.value,
          label: <span style={{ fontFamily: f.value }}>{f.label}</span>,
        }))}
        value={value}
        onItemSelect={(val) => onChange(val)}
        className="w-full"
        size="md"
      />
    </div>
  );
}
