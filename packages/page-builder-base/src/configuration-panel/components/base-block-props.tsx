import {
  BaseBlockProps as BaseBlockPropsType,
  TextInput,
} from "@hacado/builder";
import { BuilderKeys, useI18n } from "@hacado/i18n/client";
import {
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@hacado/ui";
import { ChevronRight, Eclipse, Hash } from "lucide-react";
import { useState } from "react";

const BaseBlockPropsInput = ({
  label,
  icon: Icon,
  base,
  onBaseChange,
  property,
}: {
  label: BuilderKeys;
  icon: ({ className }: { className: string }) => React.ReactNode;
  base?: BaseBlockPropsType;
  onBaseChange: (base: BaseBlockPropsType) => void;
  property: keyof BaseBlockPropsType;
}) => {
  const t = useI18n("builder");
  return (
    <div className="space-y-2">
      <TextInput
        placeholder={t(label)}
        nullable
        defaultValue={base?.[property] || ""}
        label={
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{t(label)}</span>
          </div>
        }
        onChange={(id) => onBaseChange({ ...base, [property]: id })}
      />
    </div>
  );
};

export const BaseBlockProps = ({
  base,
  onBaseChange,
}: {
  base: BaseBlockPropsType;
  onBaseChange: (base: BaseBlockPropsType) => void;
}) => {
  const t = useI18n("builder");
  const [isBaseOpen, setIsBaseOpen] = useState(false);
  return (
    <Collapsible open={isBaseOpen} onOpenChange={setIsBaseOpen}>
      <CollapsibleTrigger className="flex flex-row justify-between w-full items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4" />
          {t("pageBuilder.base.title")}
        </div>
        <ChevronRight
          className={cn(
            "size-4 transition-transform",
            isBaseOpen && "rotate-90",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2">
        <div className="flex flex-col gap-4">
          <BaseBlockPropsInput
            label="pageBuilder.base.id"
            icon={Hash}
            base={base}
            onBaseChange={onBaseChange}
            property="id"
          />
          <BaseBlockPropsInput
            label="pageBuilder.base.className"
            icon={Eclipse}
            base={base}
            onBaseChange={onBaseChange}
            property="className"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
