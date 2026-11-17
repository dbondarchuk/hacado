"use client";

import { communicationsApi } from "@hacado/api-sdk/admin/communications";
import { templatesApi } from "@hacado/api-sdk/admin/templates";
import { EmailBuilder } from "@hacado/email-builder";
import { useI18n } from "@hacado/i18n/client";
import {
  SendCommunicationRequest,
  sendCommunicationRequestSchema,
} from "@hacado/types/communication";
import { ArgumentsAutocomplete } from "@hacado/ui-admin/arguments-autocomplete";
import { useArguments } from "@hacado/ui-admin/hooks";
import { TemplateSelector } from "@hacado/ui-admin/template-selector";
import { AlertModal } from "@hacado/ui/alert-modal";
import { Button } from "@hacado/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@hacado/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
} from "@hacado/ui/form";
import { Label } from "@hacado/ui/label";
import { toast, toastPromise } from "@hacado/ui/sonner";
import { Spinner } from "@hacado/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutTemplate, Send } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { TextMessageBuilder } from "../templates/text-message-builder";
import { useCommunicationBuilderAI } from "./builder-ai-context";

export type SendCommunicationDialogProps = {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
} & (
  | {
      customerId: string;
    }
  | {
      appointmentId: string;
    }
);

export const SendCommunicationDialog: React.FC<
  SendCommunicationDialogProps
> = ({ children, onSuccess, open, onOpenChange, ...rest }) => {
  const t = useI18n("admin");
  const builderAI = useCommunicationBuilderAI();
  const [isOpen, setIsOpen] = React.useState(open ?? false);
  const [loading, setLoading] = React.useState(false);

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false);
  const [isTemplateLoading, setIsTemplateLoading] = React.useState(false);
  const [templateId, setTemplateId] = React.useState<string>();
  const [contentKey, setContentKey] = React.useState<string>();

  const [isCloseAlertModalOpen, setIsCloseAlertModalOpen] =
    React.useState(false);

  const onOpenChangeTemplateDialog = React.useCallback(
    (open: boolean) => {
      setIsTemplateDialogOpen(open);
      setTemplateId(undefined);
      setIsTemplateLoading(false);
    },
    [setIsTemplateDialogOpen, setIsTemplateLoading, setTemplateId],
  );

  useEffect(() => {
    if (open === undefined || open === isOpen) return;

    setIsOpen(open);
  }, [open]);

  const args = useArguments(rest);

  const form = useForm<SendCommunicationRequest>({
    resolver: zodResolver(sendCommunicationRequestSchema),
    mode: "all",
    defaultValues: {
      ...rest,
      content: null as any,
      channel: "email",
    } as Partial<SendCommunicationRequest> as SendCommunicationRequest,
  });

  const { setError, trigger } = form;
  const onEmailBuilderValidChange = React.useCallback(
    (isValid: boolean) =>
      isValid
        ? trigger()
        : setError("content", {
            message: t("communications.contentNotValid"),
          }),
    [setError, trigger, t],
  );

  const close = () => {
    setIsCloseAlertModalOpen(false);
    setIsOpen(false);
    onOpenChange?.(false);
    form.reset();
    setContentKey(new Date().getTime().toString());
  };

  const onDialogOpenChange = (open: boolean) => {
    if (!open) {
      setIsCloseAlertModalOpen(true);
    } else {
      setIsOpen(true);
      onOpenChange?.(true);
    }
  };

  const onSubmit = async (data: SendCommunicationRequest) => {
    try {
      setLoading(true);

      const promise = communicationsApi.sendCustomerMessage(data);

      await toastPromise(promise, {
        success: t("communications.messageSent"),
        error: t("communications.requestError"),
      });

      setIsOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onTemplateSelect = async () => {
    if (!templateId) return;

    try {
      setIsTemplateLoading(true);
      const template = await templatesApi.getTemplate(templateId);

      if (template.type !== channel) {
        throw new Error(t("communications.wrongTemplateType"));
      }

      form.setValue("content", template.value);
      if (template.type === "email") {
        form.setValue("subject", template.subject);
      }

      setIsTemplateDialogOpen(false);
      setContentKey(new Date().getTime().toString());
    } catch (error) {
      console.error("Failed to fetch items:", error);
      toast.error(t("communications.requestError"));
    } finally {
      setIsTemplateLoading(false);
    }
  };

  const channel = form.watch("channel");
  const subject = form.watch("subject");
  const EmailBuilderAI = builderAI.EmailBuilder;
  const TextMessageBuilderAI = builderAI.TextMessageBuilder;

  const onSubjectChange = React.useCallback(
    (nextSubject: string) => {
      form.setValue("subject", nextSubject, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onDialogOpenChange}>
      {!!children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className="flex h-[min(1000px,100dvh)] max-h-[100dvh] w-full flex-col gap-3 overflow-hidden p-4 sm:max-w-[min(96vw,1400px)] sm:p-6"
        closeClassName="top-3 right-3"
      >
        <AlertModal
          onConfirm={close}
          isOpen={isCloseAlertModalOpen}
          onClose={() => setIsCloseAlertModalOpen(false)}
          description={t("communications.closeDialogWarning")}
        />

        <DialogHeader className="shrink-0 space-y-0 pr-8">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-lg sm:text-xl">
                {t("communications.sendNewMessage")}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t("communications.sendNewMessageDescription")}
              </DialogDescription>
            </div>

            <Dialog
              open={isTemplateDialogOpen}
              onOpenChange={onOpenChangeTemplateDialog}
            >
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                >
                  <LayoutTemplate className="size-4" />
                  <span className="sm:hidden">
                    {t("communications.template")}
                  </span>
                  <span className="hidden sm:inline">
                    {t("communications.selectTemplate")}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t("communications.selectTemplate")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("communications.selectExistingTemplate")}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                  <Label>{t("communications.template")}</Label>
                  <TemplateSelector
                    type={channel}
                    value={templateId}
                    onItemSelect={setTemplateId}
                    className="w-full"
                  />
                  <FormDescription className="text-destructive">
                    <span className="font-bold">
                      {t("communications.attention")}!
                    </span>{" "}
                    {t("communications.templateReplaceWarning")}
                  </FormDescription>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">
                      {t("common.buttons.close")}
                    </Button>
                  </DialogClose>
                  <Button
                    variant="primary"
                    disabled={isTemplateLoading || !templateId}
                    onClick={onTemplateSelect}
                  >
                    {isTemplateLoading && <Spinner />}
                    {t("communications.select")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
          >
            {channel === "email" && (
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem className="shrink-0 space-y-1.5">
                    <FormLabelWithRequiredIndicator required>
                      {t("communications.emailSubject")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <ArgumentsAutocomplete
                        args={args}
                        asInput
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
                        disabled={loading}
                        placeholder={t("communications.subject")}
                      />
                    </FormControl>
                    <FormDescription className="hidden sm:block">
                      {t("communications.emailSubjectDescription")}{" "}
                      {t("communications.usesTemplatedValues")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {channel === "email" && (
                    <FormItem className="relative flex min-h-0 flex-1 flex-col overflow-hidden [&>div[style]]:!block [&>div[style]]:h-full">
                      <FormLabel className="sr-only">
                        {t("communications.content")}
                      </FormLabel>
                      <FormControl className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        {EmailBuilderAI ? (
                          <EmailBuilderAI
                            args={args}
                            value={field.value as any}
                            onIsValidChange={onEmailBuilderValidChange}
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                            subject={subject}
                            onSubjectChange={onSubjectChange}
                            contentKey={contentKey}
                          />
                        ) : (
                          <EmailBuilder
                            args={args}
                            value={field.value as any}
                            onIsValidChange={onEmailBuilderValidChange}
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                            key={contentKey}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  {channel === "text-message" &&
                    (TextMessageBuilderAI ? (
                      <TextMessageBuilderAI args={args} field={field} />
                    ) : (
                      <TextMessageBuilder args={args} field={field} />
                    ))}
                </div>
              )}
            />
          </form>
        </Form>

        <DialogFooter className="shrink-0">
          <DialogClose asChild>
            <Button variant="secondary">{t("common.buttons.close")}</Button>
          </DialogClose>
          <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
            {loading ? <Spinner /> : <Send />} {t("communications.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
