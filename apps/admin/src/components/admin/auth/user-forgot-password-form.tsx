"use client";
import { authClient } from "@/app/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Link,
  Spinner,
  toast,
} from "@hacado/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  email: z.email({ error: "common.email.invalid" }),
});

type UserFormValue = z.infer<typeof formSchema>;
const defaultValues: UserFormValue = {
  email: "",
};

export const UserForgotPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const t = useI18n("admin");

  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true);
    try {
      const response = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: "/auth/reset-password",
      });

      if (response.error?.message) {
        console.error(response.error);
        toast.error(t("auth.forgotPassword.error"));
        return;
      }

      toast.success(t("auth.forgotPassword.success"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-2"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.forgotPassword.email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("auth.forgotPassword.email")}
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            disabled={loading}
            className="ml-auto w-full"
            type="submit"
            variant="brand-dark"
          >
            {loading && <Spinner />}
            {t("auth.forgotPassword.submit")}
          </Button>
        </form>
      </Form>

      <div className="text-center w-full text-base">
        {t.rich("auth.forgotPassword.rememberPassword", {
          link: (chunks: any) => (
            <Link
              href="/auth/signin"
              className="ml-auto w-full"
              variant="underline"
            >
              {chunks}
            </Link>
          ),
        })}
      </div>
    </div>
  );
};
