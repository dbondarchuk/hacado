"use client";

import { updateMyPhone } from "@/app/dashboard/users/me/profile/update-phone-action";
import { PhoneOtpStep } from "@/components/admin/auth/phone-otp-step";
import { useI18n } from "@hacado/i18n/client";
import { zPhone } from "@hacado/types";
import {
  Button,
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
  PhoneInput,
  Spinner,
  toast,
} from "@hacado/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  phone: zPhone,
});

export const PhoneChangeDialog = ({
  currentPhone,
}: {
  currentPhone: string;
}) => {
  const t = useI18n("admin");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [pendingPhone, setPendingPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: currentPhone },
  });

  const phone = form.watch("phone");

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setStep("phone");
      setPendingPhone("");
      form.reset({ phone: currentPhone });
    }
  };

  const onContinue = async (data: z.infer<typeof schema>) => {
    if (data.phone === currentPhone) {
      toast.error(t("users.profile.phoneChange.toasts.error"));
      return;
    }
    setPendingPhone(data.phone);
    setStep("otp");
  };

  const onVerified = async (verifiedPhone: string) => {
    setLoading(true);
    try {
      const result = await updateMyPhone(verifiedPhone);
      if (!result.ok) {
        if (result.code === "phone_in_use") {
          toast.error(t("users.profile.phoneChange.toasts.phoneInUse"));
        } else if (
          result.code === "invalid_code" ||
          result.code === "not_verified"
        ) {
          toast.error(t("users.profile.phoneChange.toasts.invalidCode"));
        } else {
          toast.error(t("users.profile.phoneChange.toasts.error"));
        }
        return;
      }
      toast.success(t("users.profile.phoneChange.toasts.success"));
      onOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {t("users.profile.security.changePhone")}
        </Button>
      </DialogTrigger>
      <DialogContent
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("users.profile.phoneChange.title")}</DialogTitle>
          <DialogDescription>
            {t("users.profile.phoneChange.description")}
          </DialogDescription>
        </DialogHeader>
        {step === "otp" ? (
          <PhoneOtpStep
            phone={pendingPhone}
            kind="profile-change"
            onVerified={onVerified}
          />
        ) : (
          <Form {...form}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void form.handleSubmit(onContinue)(event);
              }}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("users.profile.phoneChange.form.phone")}
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        label={t("users.profile.phoneChange.form.phone")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("users.profile.phoneChange.form.helpText", {
                        currentPhone,
                      })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    {t("common.buttons.close")}
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || phone === currentPhone}
                >
                  {loading ? <Spinner /> : null}{" "}
                  {t("users.profile.phoneChange.sendCode")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
