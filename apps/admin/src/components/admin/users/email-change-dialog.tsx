"use client";
import { authClient } from "@/app/auth-client";
import { useI18n } from "@hacado/i18n/client";
import { zEmail } from "@hacado/types";
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
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Spinner,
  toast,
} from "@hacado/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: zEmail,
});

type Step = "current-otp" | "new-email" | "new-otp";

export const EmailChangeDialog = ({
  currentEmail,
}: {
  currentEmail: string;
}) => {
  const t = useI18n("admin");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("current-otp");
  const [currentOtp, setCurrentOtp] = useState("");
  const [currentOtpSent, setCurrentOtpSent] = useState(false);
  const [newOtp, setNewOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  // const [autoSendAttempted, setAutoSendAttempted] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const email = form.watch("email");

  const resetState = () => {
    setStep("current-otp");
    setCurrentOtp("");
    setNewOtp("");
    setCurrentOtpSent(false);
    setPendingEmail("");
    // setAutoSendAttempted(false);
    form.reset({ email: "" });
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetState();
  };

  const sendCurrentEmailOtp = async () => {
    setLoading(true);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: currentEmail,
        type: "email-verification",
      });
      if (result.error) {
        toast.error(t("users.profile.emailChange.toasts.error"));
        return;
      }
      setCurrentOtpSent(true);
      toast.success(t("users.profile.emailChange.toasts.currentCodeSent"));
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   if (!open || step !== "current-otp" || autoSendAttempted) return;
  //   setAutoSendAttempted(true);
  //   void sendCurrentEmailOtp();
  // }, [open, step, autoSendAttempted]);

  const onCurrentOtpContinue = async () => {
    if (currentOtp.length !== 6) {
      toast.error(t("users.profile.emailChange.toasts.invalidCode"));
      return;
    }
    setStep("new-email");
  };

  const onRequestNewEmailOtp = async (data: z.infer<typeof schema>) => {
    if (data.email === currentEmail) {
      toast.error(t("users.profile.emailChange.toasts.emailIsTheSame"));
      return;
    }
    setLoading(true);
    try {
      const result = await authClient.emailOtp.requestEmailChange({
        newEmail: data.email,
        otp: currentOtp,
      });

      if (result.error) {
        if (result.error.code === "EMAIL_ALREADY_IN_USE") {
          toast.error(t("users.profile.emailChange.toasts.emailAlreadyInUse"));
          return;
        }
        if (result.error.code === "EMAIL_IS_THE_SAME") {
          toast.error(t("users.profile.emailChange.toasts.emailIsTheSame"));
          return;
        }
        toast.error(
          result.error.code === "INVALID_OTP"
            ? t("users.profile.emailChange.toasts.invalidCode")
            : t("users.profile.emailChange.toasts.error"),
        );
        if (result.error.code === "INVALID_OTP") {
          setStep("current-otp");
          setCurrentOtp("");
        }
        return;
      }

      setPendingEmail(data.email);
      setStep("new-otp");
      toast.success(t("users.profile.emailChange.toasts.newCodeSent"));
    } catch (error) {
      console.error(error);
      toast.error(t("users.profile.emailChange.toasts.error"));
    } finally {
      setLoading(false);
    }
  };

  const onConfirmNewEmail = async () => {
    if (newOtp.length !== 6) {
      toast.error(t("users.profile.emailChange.toasts.invalidCode"));
      return;
    }
    setLoading(true);
    try {
      const result = await authClient.emailOtp.changeEmail({
        newEmail: pendingEmail,
        otp: newOtp,
      });

      if (result.error) {
        toast.error(
          result.error.code === "INVALID_OTP"
            ? t("users.profile.emailChange.toasts.invalidCode")
            : t("users.profile.emailChange.toasts.error"),
        );
        return;
      }

      toast.success(
        t("users.profile.emailChange.toasts.emailChangedSuccessfully"),
      );
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t("users.profile.emailChange.toasts.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogTrigger asChild>
        <Button variant="outline">
          {t("users.profile.security.changeEmail")}
        </Button>
      </DialogTrigger>
      <DialogContent
        noClose
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("users.profile.emailChange.title")}</DialogTitle>
          <DialogDescription>
            {t("users.profile.emailChange.description")}
          </DialogDescription>
        </DialogHeader>

        {step === "current-otp" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("users.profile.emailChange.form.helpText", { currentEmail })}
            </p>
            {currentOtpSent ? (
              <div className="flex flex-col gap-2">
                <FormLabel>
                  {t("users.profile.emailChange.form.currentOtp")}
                </FormLabel>
                <InputOTP
                  maxLength={6}
                  value={currentOtp}
                  onChange={setCurrentOtp}
                  disabled={loading}
                  containerClassName="justify-center"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      void onCurrentOtpContinue();
                    }
                  }}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            ) : null}
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={sendCurrentEmailOtp}
              >
                {loading ? <Spinner /> : null}{" "}
                {t("users.profile.emailChange.sendCurrentCode")}
              </Button>
              <div className="flex w-full justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    {t("common.buttons.close")}
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  variant="primary"
                  disabled={loading || currentOtp.length !== 6}
                  onClick={onCurrentOtpContinue}
                >
                  {t("auth.completeProfile.submit")}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}

        {step === "new-email" && (
          <Form {...form}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void form.handleSubmit(onRequestNewEmailOtp)(event);
              }}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("users.profile.emailChange.form.email")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          "users.profile.emailChange.form.emailPlaceholder",
                        )}
                        type="email"
                      />
                    </FormControl>
                    <FormDescription>
                      {t("users.profile.emailChange.form.helpText", {
                        currentEmail,
                      })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep("current-otp")}
                  disabled={loading}
                >
                  {t("common.buttons.close")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !email || email === currentEmail}
                >
                  {loading ? <Spinner /> : null}{" "}
                  {t("users.profile.emailChange.sendNewCode")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {step === "new-otp" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{pendingEmail}</p>
            <div className="flex flex-col gap-2">
              <FormLabel>
                {t("users.profile.emailChange.form.newOtp")}
              </FormLabel>
              <InputOTP
                maxLength={6}
                value={newOtp}
                onChange={setNewOtp}
                disabled={loading}
                containerClassName="justify-center"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    void onConfirmNewEmail();
                  }
                }}
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t("common.buttons.close")}
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="primary"
                disabled={loading || newOtp.length !== 6}
                onClick={onConfirmNewEmail}
              >
                {loading ? <Spinner /> : null}{" "}
                {t("users.profile.emailChange.confirm")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
