"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  useTheme,
} from "@hacado/ui";
import Editor from "@monaco-editor/react";
import { Maximize2 } from "lucide-react";
import React from "react";

type HtmlMonacoEditorDialogProps = {
  value: string;
  onApply: (value: string) => void;
  trigger?: React.ReactNode;
};

export const HtmlMonacoEditorDialog: React.FC<HtmlMonacoEditorDialogProps> = ({
  value,
  onApply,
  trigger,
}) => {
  const t = useI18n("builder");
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  const handleApply = () => {
    onApply(draft);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="sm">
            <Maximize2 className="size-4 mr-2" />
            {t("emailBuilder.blocks.customHtml.openEditor")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex flex-col w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>
            {t("emailBuilder.blocks.customHtml.editorTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="h-[calc(90vh-9rem)] min-h-[320px] px-6 pb-2">
          <Editor
            height="100%"
            language="html"
            value={draft}
            theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
            onChange={(next) => setDraft(next ?? "")}
            options={{
              minimap: { enabled: false },
              wordWrap: "on",
              automaticLayout: true,
              tabSize: 2,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
        <DialogFooter className="px-6 py-4 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            {t("emailBuilder.blocks.customHtml.editorCancel")}
          </Button>
          <Button type="button" onClick={handleApply}>
            {t("emailBuilder.blocks.customHtml.editorApply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
