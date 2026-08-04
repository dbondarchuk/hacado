"use client";

import { adminApi } from "@timelish/api-sdk";
import { I18nFn, useI18n } from "@timelish/i18n/client";
import { AppointmentStatus, okStatus } from "@timelish/types";
import { Button, ButtonProps, cn, Spinner, toastPromise } from "@timelish/ui";
import { useRouter } from "next/navigation";
import React from "react";
import {
  isSubscriptionPastDueError,
  SubscriptionPastDueDialog,
} from "./subscription-past-due-dialog";

export const changeStatus = async (
  _id: string,
  status: AppointmentStatus,
  t: I18nFn<"admin">,
  setIsLoading: (isLoading: boolean) => void,
  refresh: () => void,
  onSuccess?: (newStatus: AppointmentStatus) => void,
  beforeRequest?: () => Promise<void> | void,
  requestedByCustomer?: boolean,
  onPastDue?: () => void,
) => {
  setIsLoading(true);

  const fn = async () => {
    if (beforeRequest) {
      const result = beforeRequest();
      if (result instanceof Promise) await result;
    }

    const res = await adminApi.appointments.changeStatus(
      _id,
      status,
      requestedByCustomer,
    );
    if (res !== okStatus) throw new Error("Request failed");
  };

  try {
    await toastPromise(fn(), {
      success: t("appointments.actionButton.changesSaved"),
      error: t("appointments.actionButton.requestError"),
    });
    refresh();
    onSuccess?.(status);
  } catch (error) {
    if (isSubscriptionPastDueError(error)) {
      onPastDue?.();
      return;
    }
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};

export const AppointmentActionButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    _id: string;
    status: AppointmentStatus;
    requestedByCustomer?: boolean;
    onSuccess?: (newStatus: AppointmentStatus) => void;
    beforeRequest?: () => Promise<void> | void;
    setIsLoading?: (isLoading: boolean) => void;
    icon?: React.ComponentType<{ className?: string }>;
  }
>(
  (
    {
      _id,
      status,
      requestedByCustomer,
      onSuccess,
      beforeRequest,
      onClick: originalOnClick,
      setIsLoading: propsSetIsLoading,
      icon: Icon,
      ...props
    },
    ref,
  ) => {
    const [isLoading, stateSetIsLoading] = React.useState(false);
    const [isPastDueDialogOpen, setIsPastDueDialogOpen] = React.useState(false);
    const router = useRouter();

    const setIsLoading = (loading: boolean) => {
      stateSetIsLoading(loading);
      propsSetIsLoading?.(loading);
    };

    const t = useI18n("admin");

    const onClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      await changeStatus(
        _id,
        status,
        t,
        setIsLoading,
        router.refresh,
        (newStatus) => {
          onSuccess?.(newStatus);
          originalOnClick?.(e);
        },
        beforeRequest,
        requestedByCustomer,
        () => setIsPastDueDialogOpen(true),
      );
    };

    return (
      <>
        <Button
          {...props}
          disabled={isLoading || props.disabled}
          ref={ref}
          onClick={onClick}
          className={cn(
            "inline-flex flex-row gap-1 items-center",
            props.className,
          )}
        >
          {isLoading ? <Spinner /> : Icon ? <Icon /> : null}
          {props.children}
        </Button>
        <SubscriptionPastDueDialog
          open={isPastDueDialogOpen}
          onOpenChange={setIsPastDueDialogOpen}
        />
      </>
    );
  },
);
AppointmentActionButton.displayName = "AppointmentActionButton";
