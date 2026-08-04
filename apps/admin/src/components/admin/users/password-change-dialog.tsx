"use client";
import { authClient } from "@/app/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseAllKeys, useI18n } from "@timelish/i18n/client";
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
} from "@timelish/ui";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z
  .object({
    currentPassword: z.string({
      error:
        "admin.users.profile.passwordChange.validation.currentPassword.required" satisfies BaseAllKeys,
    }),
    newPassword: z
      .string({
        error:
          "admin.users.profile.passwordChange.validation.newPassword.required" satisfies BaseAllKeys,
      })
      .min(8, {
        error:
          "admin.users.profile.passwordChange.validation.newPassword.minLength" satisfies BaseAllKeys,
      })
      .max(128, {
        error:
          "admin.users.profile.passwordChange.validation.newPassword.maxLength" satisfies BaseAllKeys,
      }),
    confirmPassword: z.string({
      error:
        "admin.users.profile.passwordChange.validation.confirmPassword.required" satisfies BaseAllKeys,
    }),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message:
          "admin.users.profile.passwordChange.validation.confirmPassword.required" satisfies BaseAllKeys,
      });
    }
  });

export const PasswordChangeDialog = () => {
  const t = useI18n("admin");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      setLoading(true);
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        if (result.error.code === "INVALID_PASSWORD") {
          toast.error(t("users.profile.passwordChange.toasts.invalidPassword"));
          return;
        }

        toast.error(t("users.profile.passwordChange.toasts.error"));
        return;
      }

      toast.success(
        t("users.profile.passwordChange.toasts.passwordChangedSuccessfully"),
      );

      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t("users.profile.passwordChange.toasts.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {t("users.profile.security.changePassword")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.profile.passwordChange.title")}</DialogTitle>
          <DialogDescription>
            {t("users.profile.passwordChange.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("users.profile.passwordChange.form.currentPassword")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "users.profile.passwordChange.form.currentPasswordPlaceholder",
                      )}
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("users.profile.passwordChange.form.newPassword")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "users.profile.passwordChange.form.newPasswordPlaceholder",
                      )}
                      type="password"
                    />
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
                    {t("users.profile.passwordChange.form.confirmPassword")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "users.profile.passwordChange.form.confirmPasswordPlaceholder",
                      )}
                      type="password"
                    />
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
            {t("users.profile.passwordChange.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
