"use client";

import { unlinkGoogleAccount } from "@/app/dashboard/users/me/profile/unlink-google-action";
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  password: z.string({
    error:
      "admin.users.profile.unlinkGoogle.validation.password.required" satisfies BaseAllKeys,
  }),
});

export function UnlinkGoogleDialog({ onSuccess }: { onSuccess?: () => void }) {
  const t = useI18n("admin");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      setLoading(true);
      const result = await unlinkGoogleAccount(data.password);

      if (!result.ok) {
        if (result.code === "invalid_password") {
          toast.error(t("users.profile.unlinkGoogle.toasts.invalidPassword"));
          return;
        }

        toast.error(t("users.profile.security.unlinkGoogleError"));
        return;
      }

      toast.success(t("users.profile.security.unlinkGoogleSuccess"));
      setOpen(false);
      form.reset();
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t("users.profile.security.unlinkGoogleError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {t("users.profile.security.unlinkGoogle")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.profile.unlinkGoogle.title")}</DialogTitle>
          <DialogDescription>
            {t("users.profile.unlinkGoogle.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("users.profile.unlinkGoogle.form.password")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="current-password"
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
            {loading ? <Spinner /> : null}{" "}
            {t("users.profile.unlinkGoogle.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
