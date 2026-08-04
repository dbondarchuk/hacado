import { TranslationKeys, useI18n } from "@timelish/i18n/client";
import { ModifyAppointmentType } from "@timelish/types";
import { cn } from "@timelish/ui";
import { RefreshCw, XCircle } from "lucide-react";
import { useModifyAppointmentFormContext } from "./context";

const types: Record<
  ModifyAppointmentType,
  {
    title: TranslationKeys;
    description: TranslationKeys;
    Icon: React.ComponentType<{ className?: string }>;
    buttonSelectedClassName: string;
    buttonUnSelectedClassName: string;
    iconClassName: string;
  }
> = {
  cancel: {
    title: "modification.type.cancel.title",
    description: "modification.type.cancel.description",
    Icon: XCircle,
    buttonSelectedClassName: "border-destructive bg-destructive/5",
    buttonUnSelectedClassName:
      "border-border hover:border-destructive/50 hover:bg-accent/50",
    iconClassName: "bg-destructive/10 text-destructive",
  },
  reschedule: {
    title: "modification.type.reschedule.title",
    description: "modification.type.reschedule.description",
    Icon: RefreshCw,
    buttonSelectedClassName: "border-primary bg-primary/5",
    buttonUnSelectedClassName:
      "border-border hover:border-primary/50 hover:bg-accent/50",
    iconClassName: "bg-primary/10 text-primary",
  },
};

export const TypeCard: React.FC = () => {
  const { type: selectedType, setType } = useModifyAppointmentFormContext();

  const t = useI18n("translation");

  const onClick = (type: ModifyAppointmentType): void => {
    setType(type);
  };

  return (
    <div className="space-y-4 type-card card-container">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground type-card-title card-title">
          {t("modification.type.title")}
        </h2>
        <p className="text-xs text-muted-foreground type-card-description card-description">
          {t("modification.type.description")}
        </p>
      </div>
      <div className="grid gap-3 type-list">
        {Object.entries(types).map(
          ([
            type,
            {
              title,
              description,
              Icon,
              buttonSelectedClassName,
              buttonUnSelectedClassName,
              iconClassName,
            },
          ]) => {
            const isSelected = type === selectedType;
            return (
              <button
                onClick={() => onClick(type as ModifyAppointmentType)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all duration-200 text-left cursor-pointer type-card-button",
                  isSelected
                    ? buttonSelectedClassName
                    : buttonUnSelectedClassName,
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "size-10 flex-shrink-0 rounded-full flex items-center justify-center type-card-button-icon-container",
                      isSelected
                        ? iconClassName
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4 type-card-button-icon" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-foreground type-card-button-title">
                      {t(title)}
                    </h3>
                    <p className="text-xs text-muted-foreground type-card-button-description">
                      {t(description)}
                    </p>
                  </div>
                </div>
              </button>
            );
          },
        )}
      </div>
    </div>
  );
};
