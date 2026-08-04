"use client";

import { useI18n } from "@timelish/i18n/client";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const SonnerToaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

const LoadingToast = () => {
  const t = useI18n("ui");
  return t("loading.loading");
};

async function toastPromise<T>(
  promise: Promise<T>,
  data: Parameters<typeof toast.promise<T>>[1],
): Promise<T> {
  toast.promise(promise, {
    loading: <LoadingToast />,
    ...(data || {}),
  });

  return await promise;
}

export { SonnerToaster, toastPromise };
