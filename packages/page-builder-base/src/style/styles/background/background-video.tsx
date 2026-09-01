import { useI18n } from "@hacado/i18n/client";
import { Label } from "@hacado/ui";
import { AssetSelectorInput } from "@hacado/ui-admin";
import { Video } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const BackgroundVideoSchema = z.object({
  src: z.string().optional(),
  poster: z.string().optional(),
});

export type BackgroundVideoValue = z.infer<typeof BackgroundVideoSchema>;

export const backgroundVideoStyle = {
  name: "backgroundVideo",
  label: "builder.pageBuilder.styles.properties.backgroundVideo",
  category: "background",
  icon: ({ className }) => <Video className={className} />,
  schema: BackgroundVideoSchema,
  defaultValue: {},
  renderToCSS: (value) => {
    if (!value?.src) return null;
    // isolation + negative z-index on the video layer keeps children
    // (including grid items) above the video without an extra wrapper.
    return "position: relative; overflow: hidden; isolation: isolate;";
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    const current = value ?? {};

    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">
            {t("pageBuilder.styles.backgroundVideo.src")}
          </Label>
          <AssetSelectorInput
            value={current.src || ""}
            accept="video/*"
            onChange={(src) => onChange({ ...current, src: src || undefined })}
            placeholder={t("pageBuilder.styles.backgroundVideo.srcPlaceholder")}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            {t("pageBuilder.styles.backgroundVideo.poster")}
          </Label>
          <AssetSelectorInput
            value={current.poster || ""}
            accept="image/*"
            onChange={(poster) =>
              onChange({ ...current, poster: poster || undefined })
            }
            placeholder={t(
              "pageBuilder.styles.backgroundVideo.posterPlaceholder",
            )}
          />
        </div>
      </div>
    );
  },
} as const satisfies StyleDefinition<typeof BackgroundVideoSchema>;
