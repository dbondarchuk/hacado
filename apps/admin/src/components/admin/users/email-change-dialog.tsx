"use client";
import { authClient } from "@/app/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@timelish/i18n/client";
import { zEmail } from "@timelish/types";
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
  Spinner,
  toast,
} from "@timelish/ui";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: zEmail,
});

export const EmailChangeDialog = ({
  currentEmail,
}: {
  currentEmail: string;
}) => {
  const t = useI18n("admin");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: currentEmail,
    },
  });

  const email = form.watch("email");

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      setLoading(true);
      const result = await authClient.changeEmail({
        newEmail: data.email,
        callbackURL: "/dashboard/users/me/profile?emailChanged=true",
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

        toast.error(t("users.profile.emailChange.toasts.error"));
        return;
      }

      toast.success(t("users.profile.emailChange.toasts.emailSent"));

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {t("users.profile.security.changeEmail")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.profile.emailChange.title")}</DialogTitle>
          <DialogDescription>
            {t("users.profile.emailChange.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">{t("common.buttons.close")}</Button>
          </DialogClose>
          <Button
            variant="primary"
            onClick={form.handleSubmit(onSubmit)}
            disabled={loading || email === currentEmail}
          >
            {loading ? <Spinner /> : <Save />}{" "}
            {t("users.profile.emailChange.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
