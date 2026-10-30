import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppointmentAddon, AppointmentOption } from "@hacado/types/booking";
import { CustomerListModel } from "@hacado/types/customers";
import {
  SmsConsentAttest,
  useCustomerPhoneSmsConsent,
} from "@hacado/ui-admin-kit";
import { AddonSelector } from "@hacado/ui-admin/addon-selector";
import { CustomerSelector } from "@hacado/ui-admin/customer-selector";
import { useReload } from "@hacado/ui-admin/hooks";
import { ServiceSelector } from "@hacado/ui-admin/service-selector";
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
import { DurationInput } from "@hacado/ui/duration-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@hacado/ui/form";
import { ScrollArea } from "@hacado/ui/scroll-area";
import { waitlistSmsConsentKind } from "@hacado/ui/sms-consent-choice";
import { toastPromise } from "@hacado/ui/sonner";
import { Spinner } from "@hacado/ui/spinner";
import { Textarea } from "@hacado/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@hacado/ui/toggle-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { createWaitlistEntry, getWaitlistSmsText } from "../actions";
import { WaitlistDatePicker } from "../components/waitlist-date-picker";
import { CustomerWaitlistTextOffer } from "../customer-waitlist-text";
import {
  CreateWaitlistEntryRequest,
  createWaitlistEntryRequestSchema,
} from "../models";
import {
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
  waitlistAdminNamespace,
} from "../translations/types";

export const NewEntryDialog = ({
  appId,
  customerIdLock,
}: {
  appId: string;
  customerIdLock?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customer, setCustomer] = useState<CustomerListModel>();
  const [attest, setAttest] = useState(false);
  const [smsText, setSmsText] = useState<CustomerWaitlistTextOffer | null>(
    null,
  );

  const { reload } = useReload();
  const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
    waitlistAdminNamespace,
  );

  const tAdmin = useI18n("admin");

  const form = useForm<CreateWaitlistEntryRequest>({
    resolver: zodResolver(createWaitlistEntryRequestSchema),
    defaultValues: {
      optionId: "",
      addonsIds: [],
      customerId: customerIdLock || "",
      duration: 0,
      asSoonAsPossible: true,
      dates: undefined,
      note: "",
    },
  });

  const optionId = form.watch("optionId");
  const values = form.watch();
  const [selectedOption, setSelectedOption] = useState<
    AppointmentOption | undefined
  >(undefined);
  const [selectedAddons, setSelectedAddons] = useState<
    AppointmentAddon[] | undefined
  >(undefined);
  const minDate = useMemo(() => DateTime.now().startOf("day").toJSDate(), []);

  const calculatedDuration = useMemo(() => {
    if (!selectedOption) return 0;
    const base =
      selectedOption.durationType === "fixed"
        ? selectedOption.duration
        : (selectedOption.durationMin ?? 0);
    const addonsMinutes =
      selectedAddons?.reduce((sum, a) => sum + (a.duration ?? 0), 0) ?? 0;
    return base + addonsMinutes;
  }, [selectedOption, selectedAddons]);

  useEffect(() => {
    if (optionId && calculatedDuration >= 0) {
      form.setValue("duration", calculatedDuration);
    }
  }, [calculatedDuration, optionId, form]);

  useEffect(() => {
    if (!isOpen || !customerIdLock) return;

    let cancelled = false;
    adminApi.customers
      .getCustomer(customerIdLock)
      .then((loaded) => {
        if (cancelled) return;
        setCustomer({
          _id: loaded._id,
          avatar: loaded.avatar,
          name: loaded.name,
          phone: loaded.phone,
          email: loaded.email,
          isDeleted: loaded.isDeleted,
          appointmentsCount: 0,
        });
      })
      .catch(() => {
        if (!cancelled) setCustomer(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, customerIdLock]);

  const consentStatus = useCustomerPhoneSmsConsent(
    isOpen && waitlistSmsConsentKind(smsText) ? customer?._id : undefined,
    customer?.phone,
  );

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    getWaitlistSmsText(appId)
      .then((value) => {
        if (!cancelled) setSmsText(value);
      })
      .catch(() => {
        if (!cancelled) setSmsText(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, appId]);

  const onSubmit = async (data: CreateWaitlistEntryRequest) => {
    setIsLoading(true);

    try {
      const payload = {
        ...data,
        duration:
          data.duration && data.duration >= 1 ? data.duration : undefined,
        ...(attest && consentStatus === "missing" ? { smsConsent: true } : {}),
      };
      await toastPromise(createWaitlistEntry(appId, payload), {
        success: t("newEntry.toasts.success"),
        error: t("newEntry.toasts.error"),
      });
      form.reset();
      setAttest(false);
      setCustomer(undefined);
      reload();
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" aria-label={t("newEntry.trigger")}>
          <Plus className="size-3.5" />
          <span className="max-md:hidden">{t("newEntry.trigger")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80%] flex flex-col max-h-[100%]">
        <DialogHeader>
          <DialogTitle>{t("newEntry.title")}</DialogTitle>
          <DialogDescription>{t("newEntry.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <ScrollArea className="max-h-[60vh]">
            <Form {...form}>
              <form
                id="waitlist-new-entry-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-full space-y-2 p-2"
              >
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("newEntry.form.customerId.label")}
                      </FormLabel>
                      <FormControl>
                        <CustomerSelector
                          disabled={!!customerIdLock || isLoading}
                          value={field.value}
                          onValueChange={(value) => {
                            setCustomer(value);
                            if (value?.smsConsent) setAttest(false);
                          }}
                          onItemSelect={(val) => {
                            field.onChange(val);
                            field.onBlur();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {waitlistSmsConsentKind(smsText) ? (
                  <SmsConsentAttest
                    id="waitlist-sms-consent"
                    phone={customer?.phone}
                    status={consentStatus}
                    checked={attest}
                    disabled={isLoading}
                    onCheckedChange={setAttest}
                  />
                ) : null}
                <FormField
                  control={form.control}
                  name="optionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("newEntry.form.optionId.label")}</FormLabel>
                      <FormControl>
                        <ServiceSelector
                          value={field.value}
                          disabled={isLoading}
                          onItemSelect={(val) => {
                            field.onChange(val);
                            field.onBlur();
                          }}
                          onValueChange={setSelectedOption}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addonsIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("newEntry.form.addonsIds.label")}
                      </FormLabel>
                      <FormControl>
                        <AddonSelector
                          multi
                          disabled={isLoading}
                          forOptionId={optionId}
                          value={field.value}
                          onItemSelect={(val) => {
                            field.onChange(val);
                            field.onBlur();
                          }}
                          onValueChange={setSelectedAddons}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("newEntry.form.duration.label")}</FormLabel>
                      <FormControl>
                        <DurationInput
                          type="hours-minutes"
                          value={field.value ?? 0}
                          onChange={(val) => {
                            field.onChange(val ?? 0);
                            field.onBlur();
                          }}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="asSoonAsPossible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("newEntry.form.when.label")}</FormLabel>
                      <ToggleGroup
                        type="single"
                        value={field.value ? "true" : "false"}
                        onValueChange={(value) => {
                          const asSoon = value === "true";
                          field.onChange(asSoon);
                          form.setValue("dates", asSoon ? undefined : []);
                          field.onBlur();
                        }}
                        variant="outline"
                        className="w-full max-sm:flex-col max-sm:gap-1"
                        separated
                      >
                        <ToggleGroupItem
                          value="true"
                          className="text-xs py-2 max-sm:w-full max-sm:!rounded-md max-sm:!border"
                        >
                          {t("newEntry.form.asSoonAsPossible.label")}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="false"
                          className="text-xs py-2 max-sm:w-full max-sm:!rounded-md"
                        >
                          {values.asSoonAsPossible
                            ? t("newEntry.form.dates.label")
                            : t("newEntry.form.dates.label_count", {
                                count: values.dates?.length ?? 0,
                              })}
                        </ToggleGroupItem>
                      </ToggleGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!values.asSoonAsPossible && (
                  <FormField
                    control={form.control}
                    name="dates"
                    render={({ field }) => (
                      <FormItem>
                        <WaitlistDatePicker
                          value={field.value ?? []}
                          onChange={(val) => {
                            field.onChange(val);
                            field.onBlur();
                          }}
                          minDate={minDate}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("newEntry.form.note.label")}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={isLoading}
                          placeholder={t("newEntry.form.note.placeholder")}
                          autoResize
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </ScrollArea>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">
              {tAdmin("common.buttons.close")}
            </Button>
          </DialogClose>
          <Button
            variant="primary"
            type="submit"
            form="waitlist-new-entry-form"
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : t("newEntry.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
