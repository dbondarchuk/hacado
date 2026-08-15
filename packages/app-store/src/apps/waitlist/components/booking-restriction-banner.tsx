import { useI18n } from "@hacado/i18n/client";
import { cn } from "@hacado/ui";
import { AlertCircle } from "lucide-react";

export const BookingRestrictionBanner = ({
  className,
}: {
  className?: string;
}) => {
  const t = useI18n("translation");

  return (
    <div
      className={cn(
        "rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm",
        className,
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
        <div>
          <p className="font-medium text-foreground">
            {t("booking.restriction.limitReachedTitle")}
          </p>
          <p className="mt-1 text-muted-foreground">
            {t("booking.restriction.limitReachedDescription")}
          </p>
        </div>
      </div>
    </div>
  );
};
