"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@hacado/api-sdk";
import { EmailBuilder } from "@hacado/email-builder";
import { useI18n } from "@hacado/i18n/client";
import {
  communicationChannels,
  SendCommunicationRequest,
  sendCommunicationRequestSchema,
} from "@hacado/types";
import {
  AlertModal,
  Button,
  cn,
  Combobox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Label,
  ScrollArea,
  Spinner,
  toast,
  toastPromise,
} from "@hacado/ui";
import {
  ArgumentsAutocomplete,
  TemplateSelector,
  useArguments,
} from "@hacado/ui-admin";
import { Send } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { TextMessageBuilder } from "../templates/text-message-builder";

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
      channel: "text-message",
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

      const promise = adminApi.communications.sendCustomerMessage(data);

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
      const template = await adminApi.templates.getTemplate(templateId);

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

  return (
    <Dialog open={isOpen} onOpenChange={onDialogOpenChange}>
      {!!children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[80%] max-h-[100%]">
        <DialogHeader>
          <DialogTitle>{t("communications.sendNewMessage")}</DialogTitle>
          <DialogDescription>
            {t("communications.sendNewMessageDescription")}
          </DialogDescription>
        </DialogHeader>
        <AlertModal
          onConfirm={close}
          isOpen={isCloseAlertModalOpen}
          onClose={() => setIsCloseAlertModalOpen(false)}
          description={t("communications.closeDialogWarning")}
        />
        <ScrollArea className={cn("max-h-[55vh]")}>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full relative px-1 grid grid-cols-1 gap-2 h-full"
            >
              <FormField
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>{t("communications.channel")}</FormLabel>
                    <FormControl>
                      <div className="flex flex-row gap-2">
                        <Combobox
                          className="w-full"
                          values={communicationChannels.map((value) => ({
                            label: t(`common.labels.channel.${value}`),
                            value,
                          }))}
                          value={field.value}
                          onItemSelect={(val) => {
                            field.onChange(val);
                            field.onBlur();
                            form.setValue("content", null as any as string);
                          }}
                        />
                        <Dialog
                          open={isTemplateDialogOpen}
                          onOpenChange={onOpenChangeTemplateDialog}
                        >
                          <DialogTrigger asChild>
                            <Button variant="primary">
                              {t("communications.selectTemplate")}
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {channel === "email" && (
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("communications.emailSubject")}
                        <InfoTooltip>
                          <p>{t("communications.emailSubjectDescription")}</p>
                          <p>{t("communications.usesTemplatedValues")}</p>
                        </InfoTooltip>
                      </FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <>
                    {channel === "email" && (
                      <FormItem className="w-full flex-grow relative h-full  [&>div[style]]:!block [&>div[style]]:h-full">
                        <FormLabel>{t("communications.content")}</FormLabel>
                        <FormControl>
                          <EmailBuilder
                            args={args}
                            value={field.value as any}
                            onIsValidChange={onEmailBuilderValidChange}
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                            key={contentKey}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                    {channel === "text-message" && (
                      <TextMessageBuilder args={args} field={field} />
                    )}
                  </>
                )}
              />
            </form>
          </Form>
        </ScrollArea>
        <DialogFooter>
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
