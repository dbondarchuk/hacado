"use client";

import { setUserPassword } from "@/app/dashboard/users/me/profile/set-password-action";
import { BaseAllKeys, useI18n } from "@hacado/i18n/client";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Spinner,
  toast,
} from "@hacado/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z
  .object({
    newPassword: z
      .string({
        error:
          "admin.users.profile.setPassword.validation.newPassword.required" satisfies BaseAllKeys,
      })
      .min(8, {
        error:
          "admin.users.profile.setPassword.validation.newPassword.minLength" satisfies BaseAllKeys,
      })
      .max(128, {
        error:
          "admin.users.profile.setPassword.validation.newPassword.maxLength" satisfies BaseAllKeys,
      }),
    confirmPassword: z.string({
      error:
        "admin.users.profile.setPassword.validation.confirmPassword.required" satisfies BaseAllKeys,
    }),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message:
          "admin.users.profile.setPassword.validation.confirmPassword.mismatch" satisfies BaseAllKeys,
      });
    }
  });

export function SetPasswordDialog({ onSuccess }: { onSuccess?: () => void }) {
  const t = useI18n("admin");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      setLoading(true);
      const result = await setUserPassword(data.newPassword);

      if (!result.ok) {
        if (result.code === "credential_exists") {
          toast.error(t("users.profile.setPassword.toasts.credentialExists"));
        } else {
          toast.error(t("users.profile.setPassword.toasts.error"));
        }
        return;
      }

      toast.success(t("users.profile.setPassword.toasts.success"));
      setOpen(false);
      form.reset();
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t("users.profile.setPassword.toasts.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {t("users.profile.security.setPassword")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.profile.setPassword.title")}</DialogTitle>
          <DialogDescription>
            {t("users.profile.security.setPasswordDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("users.profile.setPassword.form.newPassword")}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("users.profile.setPassword.form.confirmPassword")}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">{t("common.buttons.close")}</Button>
          </DialogClose>
          <Button
            variant="primary"
            onClick={form.handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? <Spinner /> : <Save />}{" "}
            {t("users.profile.setPassword.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
