"use client";
import { authClient } from "@/app/auth-client";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z
  .object({
    password: z
      .string({ error: "admin.auth.validation.password.required" })
      .min(8, { error: "admin.auth.validation.password.minLength" })
      .max(128, { error: "admin.auth.validation.password.maxLength" }),
    confirmPassword: z.string({
      error: "admin.auth.validation.confirmPassword.required",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "admin.auth.validation.confirmPassword.required",
      });
    }
  });

type UserFormValue = z.infer<typeof formSchema>;
const defaultValues: UserFormValue = {
  password: "",
  confirmPassword: "",
};

export const UserResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const t = useI18n("admin");

  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: UserFormValue) => {
    if (!token) {
      toast.error(t("auth.resetPassword.error"));
      return;
    }

    setLoading(true);
    try {
      const response = await authClient.resetPassword({
        newPassword: data.password,
        token: token,
      });

      if (response.error?.message) {
        console.error(response.error);
        toast.error(t("auth.resetPassword.error"));
        return;
      }

      toast.success(t("auth.resetPassword.success"));
      router.push("/auth/signin");
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.resetPassword.password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("auth.resetPassword.password")}
                    disabled={loading}
                    {...field}
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
                <FormLabel>{t("auth.resetPassword.confirmPassword")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("auth.resetPassword.confirmPassword")}
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
            {t("auth.resetPassword.submit")}
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
