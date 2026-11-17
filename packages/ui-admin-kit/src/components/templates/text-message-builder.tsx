"use client";

import { useI18n } from "@hacado/i18n/client";
import { ArgumentsAutocomplete } from "@hacado/ui-admin/arguments-autocomplete";
import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import { useSmsLinkShortening } from "@hacado/ui/context";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@hacado/ui/dialog";
import { FormControl, FormItem, FormLabel, FormMessage } from "@hacado/ui/form";
import { useTheme } from "@hacado/ui/hooks";
import { ScrollArea } from "@hacado/ui/scroll-area";
import {
  TextareaGroup,
  TextareaGroupFooter,
  TextareaGroupHeader,
  textareaGroupControlClassName,
} from "@hacado/ui/textarea-group";
import {
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@hacado/ui/tooltip-responsive";
import { previewShortenUrlsInText } from "@hacado/utils/short-links";
import { countSmsSegments } from "@hacado/utils/sms-segments";
import { templateSafeWithError } from "@hacado/utils/string";
import JsonView from "@uiw/react-json-view";
import { darkTheme } from "@uiw/react-json-view/dark";
import { lightTheme } from "@uiw/react-json-view/light";
import { Braces, ClipboardCopy } from "lucide-react";
import React from "react";
import { ControllerRenderProps } from "react-hook-form";

/** Desktop shared workspace height: fill available space, capped. */
export const TEXT_MESSAGE_WORKSPACE_HEIGHT_CLASS = "md:h-full md:max-h-[800px]";

function SmsPhonePreview({
  text,
  label,
  emptyLabel,
  sentLabel,
}: {
  text: string;
  label: string;
  emptyLabel: string;
  sentLabel: string;
}) {
  const hasText = text.trim().length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <FormLabel className="mb-2 shrink-0">{label}</FormLabel>
      <div
        className={cn(
          "bg-muted/40 border-border flex min-h-0 flex-1 flex-col overflow-hidden",
          "rounded-[1.75rem] border p-3 shadow-sm",
        )}
      >
        <div className="mb-3 flex shrink-0 justify-center">
          <div className="bg-foreground/80 h-1.5 w-16 rounded-full" />
        </div>
        <div className="bg-background border-border/60 relative min-h-0 flex-1 overflow-hidden rounded-2xl border">
          <ScrollArea className="absolute inset-0 h-full">
            <div className="flex min-w-0 flex-col gap-1 p-3">
              {hasText ? (
                <>
                  <div
                    className={cn(
                      "bg-primary text-primary-foreground ml-auto w-fit max-w-[85%] min-w-0",
                      "rounded-2xl rounded-br-md px-3 py-2 text-sm leading-relaxed",
                      "whitespace-pre-wrap wrap-anywhere",
                    )}
                  >
                    {text}
                  </div>
                  <p className="text-muted-foreground ml-auto max-w-[85%] min-w-0 px-1 text-[10px] leading-none">
                    {sentLabel}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground px-1 py-6 text-center text-xs">
                  {emptyLabel}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export const TextMessageBuilder: React.FC<{
  field: ControllerRenderProps<any>;
  args?: any;
  toolbar?: React.ReactNode;
}> = ({ field, args, toolbar }) => {
  const t = useI18n("admin");
  const { resolvedTheme } = useTheme();
  const smsLinkShortening = useSmsLinkShortening();
  const rendered = String(
    templateSafeWithError(field.value || "", args || {}, true) || "",
  );

  const previewText =
    smsLinkShortening.enabled && smsLinkShortening.shortDomain
      ? previewShortenUrlsInText(rendered, smsLinkShortening.shortDomain)
      : rendered;

  const segmentCount = countSmsSegments(previewText);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-4",
        "md:flex-row md:items-stretch md:gap-6",
        TEXT_MESSAGE_WORKSPACE_HEIGHT_CLASS,
      )}
    >
      <FormItem className="flex min-h-0 min-w-0 flex-1 flex-col">
        <FormLabel className="mb-2 shrink-0">
          {t("templates.textMessageBuilder.content")}
        </FormLabel>
        <FormControl className="flex min-h-0 flex-1 flex-col">
          <TextareaGroup
            className={cn(
              "flex min-h-0 flex-col overflow-hidden",
              // Mobile: prioritize editor height.
              "h-[min(50vh,360px)] min-h-[260px]",
              // Desktop: fill shared workspace row.
              "md:h-auto md:min-h-0 md:flex-1",
              "[&>div.relative]:flex [&>div.relative]:min-h-0 [&>div.relative]:flex-1 [&>div.relative]:flex-col",
            )}
          >
            {toolbar ? (
              <TextareaGroupHeader className="min-w-0 shrink-0">
                {toolbar}
              </TextareaGroupHeader>
            ) : null}
            <ArgumentsAutocomplete
              args={args}
              className={cn(
                textareaGroupControlClassName,
                "min-h-0 flex-1 resize-none overflow-y-auto md:h-full",
              )}
              value={field.value}
              onChange={field.onChange}
            />
            <TextareaGroupFooter className="shrink-0">
              <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-none">
                <span>
                  {t("templates.textMessageBuilder.characterCount", {
                    count: previewText.length || 0,
                  })}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {t("templates.textMessageBuilder.segmentCount", {
                    count: segmentCount,
                  })}
                </span>
              </div>
              <Dialog>
                <TooltipResponsive>
                  <TooltipResponsiveTrigger>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7 shrink-0"
                      >
                        <Braces className="size-3.5" />
                        <span className="sr-only">
                          {t("templates.textMessageBuilder.viewContext")}
                        </span>
                      </Button>
                    </DialogTrigger>
                  </TooltipResponsiveTrigger>
                  <TooltipResponsiveContent side="top">
                    {t("templates.textMessageBuilder.viewContext")}
                  </TooltipResponsiveContent>
                </TooltipResponsive>
                <DialogContent className="md:max-w-3/5">
                  <DialogTitle>
                    {t("templates.textMessageBuilder.contextValues")}
                  </DialogTitle>
                  <ScrollArea className="max-h-[60vh]">
                    <JsonView
                      value={args || {}}
                      style={resolvedTheme === "dark" ? darkTheme : lightTheme}
                    >
                      <JsonView.Copied
                        render={(
                          // @ts-expect-error
                          { "data-copied": copied, onClick, ...props },
                          { value, keyName, keys, parentValue },
                        ) => {
                          const click = (event: React.MouseEvent) => {
                            onClick?.(event as any);
                            const text = (keys || []).join(".");
                            navigator.clipboard.writeText(text);
                          };

                          return (
                            <TooltipResponsive>
                              <TooltipResponsiveTrigger>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="p-0 ml-1"
                                  onClick={click}
                                >
                                  <ClipboardCopy
                                    className={cn(
                                      "size-4",
                                      copied ? "text-green-600" : "",
                                    )}
                                  />
                                </Button>
                              </TooltipResponsiveTrigger>
                              <TooltipResponsiveContent>
                                {copied
                                  ? t("templates.textMessageBuilder.copied")
                                  : t("templates.textMessageBuilder.copyPath")}
                              </TooltipResponsiveContent>
                            </TooltipResponsive>
                          );
                        }}
                      />
                    </JsonView>
                  </ScrollArea>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        {t("templates.textMessageBuilder.close")}
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TextareaGroupFooter>
          </TextareaGroup>
        </FormControl>
        <FormMessage />
      </FormItem>

      <div className="h-[300px] w-full shrink-0 md:h-auto md:w-[300px] lg:w-[320px]">
        <SmsPhonePreview
          text={previewText}
          label={t("templates.textMessageBuilder.preview")}
          emptyLabel={t("templates.textMessageBuilder.emptyPreview")}
          sentLabel={t("templates.textMessageBuilder.sentMinutesAgo", {
            count: 2,
          })}
        />
      </div>
    </div>
  );
};
