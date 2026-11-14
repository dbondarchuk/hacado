import { TextInput } from "@hacado/builder/inputs";
import { BaseBlockProps as BaseBlockPropsType } from "@hacado/builder/types";
import { useI18n } from "@hacado/i18n/client";
import type { BuilderKeys } from "@hacado/i18n/keys";
import { cn } from "@hacado/ui/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@hacado/ui/collapsible";
import { ChevronRight, Eclipse, Hash } from "lucide-react";
import { useEffect, useState } from "react";

const CSS_ID_REGEX = /^(?:|-?[_a-zA-Z][_a-zA-Z0-9-]*)$/;

const BaseBlockPropsInput = ({
  label,
  icon: Icon,
  base,
  onBaseChange,
  property,
  validate,
  invalidMessage,
}: {
  label: BuilderKeys;
  icon: ({ className }: { className: string }) => React.ReactNode;
  base?: BaseBlockPropsType;
  onBaseChange: (base: BaseBlockPropsType) => void;
  property: keyof BaseBlockPropsType;
  validate?: (value: string) => boolean;
  invalidMessage?: string;
}) => {
  const t = useI18n("builder");
  const storedValue = base?.[property] || "";
  const [localValue, setLocalValue] = useState(storedValue);

  useEffect(() => {
    setLocalValue(storedValue);
  }, [storedValue]);

  const isInvalid = !!validate && !!localValue && !validate(localValue);

  return (
    <div className="space-y-2">
      <TextInput
        placeholder={t(label)}
        nullable
        defaultValue={localValue}
        label={
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{t(label)}</span>
          </div>
        }
        helperText={
          isInvalid ? (
            <span className="text-destructive">{invalidMessage}</span>
          ) : undefined
        }
        onChange={(next) => {
          const nextValue = next || "";
          setLocalValue(nextValue);

          if (validate && nextValue && !validate(nextValue)) {
            return;
          }

          onBaseChange({ ...base, [property]: nextValue || undefined });
        }}
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
            validate={(value) => CSS_ID_REGEX.test(value)}
            invalidMessage={t("pageBuilder.base.idInvalid")}
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
