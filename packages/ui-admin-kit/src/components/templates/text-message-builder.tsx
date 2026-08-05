"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  cn,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  ScrollArea,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  useTheme,
} from "@hacado/ui";
import { ArgumentsAutocomplete } from "@hacado/ui-admin";
import { templateSafeWithError } from "@hacado/utils";
import JsonView from "@uiw/react-json-view";
import { darkTheme } from "@uiw/react-json-view/dark";
import { lightTheme } from "@uiw/react-json-view/light";
import { Braces, ClipboardCopy } from "lucide-react";
import React from "react";
import { ControllerRenderProps } from "react-hook-form";

export const TextMessageBuilder: React.FC<{
  field: ControllerRenderProps<any>;
  args?: any;
}> = ({ field, args }) => {
  const t = useI18n("admin");
  const { resolvedTheme } = useTheme();
  const preview = templateSafeWithError(field.value || "", args || {});

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <FormItem className="flex-1">
        <FormLabel className="flex flex-row items-center justify-between">
          <span>
            {t("templates.textMessageBuilder.content")}
            <InfoTooltip>{t("common.usesTemplatedValues")}</InfoTooltip>
          </span>

          <Dialog>
            <TooltipResponsive>
              <TooltipResponsiveTrigger>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Braces size={16} />
                  </Button>
                </DialogTrigger>
              </TooltipResponsiveTrigger>
              <TooltipResponsiveContent side="bottom">
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
        </FormLabel>
        <FormControl>
          <ArgumentsAutocomplete
            args={args}
            className="!h-72 max-h-72"
            value={field.value}
            onChange={field.onChange}
          />
        </FormControl>
        <FormDescription>
          {t("templates.textMessageBuilder.characterCount", {
            count: preview.length || 0,
          })}
        </FormDescription>
        <FormMessage />
      </FormItem>
      <FormItem className="flex-1 flex flex-col">
        <FormLabel className="h-8 flex items-center">
          {t("templates.textMessageBuilder.preview")}
        </FormLabel>
        <div
          className="w-full text-sm"
          dangerouslySetInnerHTML={{
            __html: preview.replaceAll("\n", "<br/>"),
          }}
        />
      </FormItem>
    </div>
  );
};
