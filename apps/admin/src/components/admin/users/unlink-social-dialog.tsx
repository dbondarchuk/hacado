"use client";

import { unlinkSocialAccount } from "@/app/dashboard/users/me/profile/unlink-social-action";
import type { SocialAuthProvider } from "@/lib/auth/social-auth-providers";
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

type ProviderUnlinkKeys = {
  trigger: string;
  title: string;
  description: string;
  confirm: string;
  password: string;
  invalidPassword: string;
  unlinkError: string;
  unlinkSuccess: string;
};

const PROVIDER_UNLINK_KEYS: Record<SocialAuthProvider, ProviderUnlinkKeys> = {
  google: {
    trigger: "users.profile.security.unlinkGoogle",
    title: "users.profile.unlinkGoogle.title",
    description: "users.profile.unlinkGoogle.description",
    confirm: "users.profile.unlinkGoogle.confirm",
    password: "users.profile.unlinkGoogle.form.password",
    invalidPassword: "users.profile.unlinkGoogle.toasts.invalidPassword",
    unlinkError: "users.profile.security.unlinkGoogleError",
    unlinkSuccess: "users.profile.security.unlinkGoogleSuccess",
  },
  microsoft: {
    trigger: "users.profile.security.unlinkMicrosoft",
    title: "users.profile.unlinkMicrosoft.title",
    description: "users.profile.unlinkMicrosoft.description",
    confirm: "users.profile.unlinkMicrosoft.confirm",
    password: "users.profile.unlinkMicrosoft.form.password",
    invalidPassword: "users.profile.unlinkMicrosoft.toasts.invalidPassword",
    unlinkError: "users.profile.security.unlinkMicrosoftError",
    unlinkSuccess: "users.profile.security.unlinkMicrosoftSuccess",
  },
  zoom: {
    trigger: "users.profile.security.unlinkZoom",
    title: "users.profile.unlinkZoom.title",
    description: "users.profile.unlinkZoom.description",
    confirm: "users.profile.unlinkZoom.confirm",
    password: "users.profile.unlinkZoom.form.password",
    invalidPassword: "users.profile.unlinkZoom.toasts.invalidPassword",
    unlinkError: "users.profile.security.unlinkZoomError",
    unlinkSuccess: "users.profile.security.unlinkZoomSuccess",
  },
};

const schema = z.object({
  password: z.string({
    error:
      "admin.users.profile.unlinkSocial.validation.password.required" satisfies BaseAllKeys,
  }),
});

export function UnlinkSocialDialog({
  provider,
  onSuccess,
}: {
  provider: SocialAuthProvider;
  onSuccess?: () => void;
}) {
  const t = useI18n("admin");
  const keys = PROVIDER_UNLINK_KEYS[provider];
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
      const result = await unlinkSocialAccount(provider, data.password);

      if (!result.ok) {
        if (result.code === "invalid_password") {
          toast.error(t(keys.invalidPassword as Parameters<typeof t>[0]));
          return;
        }

        toast.error(t(keys.unlinkError as Parameters<typeof t>[0]));
        return;
      }

      toast.success(t(keys.unlinkSuccess as Parameters<typeof t>[0]));
      setOpen(false);
      form.reset();
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t(keys.unlinkError as Parameters<typeof t>[0]));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {t(keys.trigger as Parameters<typeof t>[0])}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(keys.title as Parameters<typeof t>[0])}</DialogTitle>
          <DialogDescription>
            {t(keys.description as Parameters<typeof t>[0])}
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
                    {t(keys.password as Parameters<typeof t>[0])}
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
            {t(keys.confirm as Parameters<typeof t>[0])}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
